import { getDb } from '../db/database.mjs';
import { createAttemptIdempotencyKey } from './submission-repository.mjs';

const now = () => new Date().toISOString();

const validatePositiveInteger = (value, name) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
};

const matchesAttemptKey = (actual, expected) => actual === expected;

const mapCandidate = (row) => ({
  id: row.id,
  gradingAttempt: row.grading_attempt,
  attemptIdempotencyKey: row.attempt_idempotency_key ?? null,
  processingLeaseExpiresAt: row.processing_lease_expires_at
});

const mapRecoveryState = (row) => ({
  id: row.id,
  status: row.status,
  gradingAttempt: row.grading_attempt,
  attemptIdempotencyKey: row.attempt_idempotency_key ?? null,
  completionGuardAt: row.completion_guard_at ?? null,
  processingLeaseExpiresAt: row.processing_lease_expires_at ?? null
});

export const listStaleRunningSubmissions = async ({ timestamp = now(), limit = 10 } = {}) => {
  validatePositiveInteger(limit, 'limit');

  const rows = getDb().prepare(`
    SELECT id,
           grading_attempt,
           attempt_idempotency_key,
           processing_lease_expires_at
    FROM submissions
    WHERE status = 'running'
      AND completion_guard_at IS NULL
      AND processing_lease_expires_at IS NOT NULL
      AND processing_lease_expires_at <= ?
    ORDER BY processing_lease_expires_at ASC, created_at ASC
    LIMIT ?
  `).all(timestamp, limit);

  return rows.map(mapCandidate);
};

export const recoverStaleRunningSubmission = async ({
  id,
  gradingAttempt,
  attemptIdempotencyKey,
  processingLeaseExpiresAt,
  maxInfraRetryAttempts,
  infraFailureResult,
  timestamp = now()
}) => {
  validatePositiveInteger(maxInfraRetryAttempts, 'maxInfraRetryAttempts');
  if (typeof processingLeaseExpiresAt !== 'string' || processingLeaseExpiresAt.length === 0) {
    throw new TypeError('processingLeaseExpiresAt is required.');
  }
  if (!infraFailureResult || infraFailureResult.status !== 'infra_failed') {
    throw new TypeError('infraFailureResult.status must be infra_failed.');
  }

  const database = getDb();
  const executeRecovery = database.transaction(() => {
    const current = database.prepare(`
      SELECT id,
             status,
             grading_attempt,
             attempt_idempotency_key,
             completion_guard_at,
             processing_lease_expires_at
      FROM submissions
      WHERE id = ?
    `).get(id);

    if (!current) return null;
    if (current.status !== 'running' || current.completion_guard_at !== null) return null;
    if (current.processing_lease_expires_at === null) return null;
    if (current.processing_lease_expires_at !== processingLeaseExpiresAt) return null;
    if (current.processing_lease_expires_at > timestamp) return null;
    if (current.grading_attempt !== gradingAttempt) return null;
    if (!matchesAttemptKey(current.attempt_idempotency_key ?? null, attemptIdempotencyKey ?? null)) return null;

    if (current.grading_attempt >= maxInfraRetryAttempts) {
      const terminalWrite = database.prepare(`
        UPDATE submissions
        SET status = 'infra_failed',
            updated_at = ?,
            result_json = ?,
            completion_guard_at = ?,
            processing_claimed_at = NULL,
            processing_heartbeat_at = NULL,
            processing_lease_expires_at = NULL
        WHERE id = ?
          AND status = 'running'
          AND completion_guard_at IS NULL
          AND processing_lease_expires_at = ?
          AND processing_lease_expires_at <= ?
          AND grading_attempt = ?
          AND (
            attempt_idempotency_key = ?
            OR (attempt_idempotency_key IS NULL AND ? IS NULL)
          )
      `).run(
        timestamp,
        JSON.stringify(infraFailureResult),
        timestamp,
        id,
        processingLeaseExpiresAt,
        timestamp,
        gradingAttempt,
        attemptIdempotencyKey,
        attemptIdempotencyKey
      );

      if (terminalWrite.changes === 0) return null;
      const terminal = database.prepare(`
        SELECT id, status, grading_attempt, attempt_idempotency_key, completion_guard_at, processing_lease_expires_at
        FROM submissions
        WHERE id = ?
      `).get(id);

      return {
        action: 'infra_failed',
        previousAttempt: gradingAttempt,
        submission: mapRecoveryState(terminal)
      };
    }

    const retryPendingWrite = database.prepare(`
      UPDATE submissions
      SET status = 'retry_pending',
          updated_at = ?,
          result_json = NULL,
          processing_claimed_at = NULL,
          processing_heartbeat_at = NULL,
          processing_lease_expires_at = NULL
      WHERE id = ?
        AND status = 'running'
        AND completion_guard_at IS NULL
        AND processing_lease_expires_at = ?
        AND processing_lease_expires_at <= ?
        AND grading_attempt = ?
        AND (
          attempt_idempotency_key = ?
          OR (attempt_idempotency_key IS NULL AND ? IS NULL)
        )
    `).run(
      timestamp,
      id,
      processingLeaseExpiresAt,
      timestamp,
      gradingAttempt,
      attemptIdempotencyKey,
      attemptIdempotencyKey
    );

    if (retryPendingWrite.changes === 0) return null;

    const nextAttempt = gradingAttempt + 1;
    const nextAttemptIdempotencyKey = createAttemptIdempotencyKey(id, nextAttempt);
    const queuedWrite = database.prepare(`
      UPDATE submissions
      SET status = 'queued',
          updated_at = ?,
          result_json = NULL,
          grading_attempt = ?,
          attempt_idempotency_key = ?,
          completion_guard_at = NULL,
          processing_claimed_at = NULL,
          processing_heartbeat_at = NULL,
          processing_lease_expires_at = NULL
      WHERE id = ?
        AND status = 'retry_pending'
        AND completion_guard_at IS NULL
        AND grading_attempt = ?
        AND (
          attempt_idempotency_key = ?
          OR (attempt_idempotency_key IS NULL AND ? IS NULL)
        )
    `).run(
      timestamp,
      nextAttempt,
      nextAttemptIdempotencyKey,
      id,
      gradingAttempt,
      attemptIdempotencyKey,
      attemptIdempotencyKey
    );

    if (queuedWrite.changes !== 1) {
      throw new Error('stale submission recovery transaction could not create the next attempt.');
    }

    const queued = database.prepare(`
      SELECT id, status, grading_attempt, attempt_idempotency_key, completion_guard_at, processing_lease_expires_at
      FROM submissions
      WHERE id = ?
    `).get(id);

    return {
      action: 'requeued',
      previousAttempt: gradingAttempt,
      submission: mapRecoveryState(queued)
    };
  });

  return executeRecovery();
};
