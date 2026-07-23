import crypto from 'node:crypto';
import { getDb } from '../db/database.mjs';

const now = () => new Date().toISOString();
const TERMINAL_RESULT_STATUSES = new Set(['completed', 'passed', 'failed', 'infra_failed']);

export const createAttemptIdempotencyKey = (submissionId, attempt) => `${submissionId}:attempt:${attempt}`;

const addMilliseconds = (timestamp, durationMs) => new Date(new Date(timestamp).getTime() + durationMs).toISOString();

const isPositiveDuration = (value) => Number.isFinite(value) && value > 0;

const mapRow = (row) => ({
  id: row.id,
  challengeSlug: row.challenge_slug,
  language: row.language,
  code: row.code,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  result: row.result_json ? JSON.parse(row.result_json) : null,
  gradingAttempt: row.grading_attempt ?? 1,
  attemptIdempotencyKey: row.attempt_idempotency_key ?? null,
  completionGuardAt: row.completion_guard_at ?? null,
  processingClaimedAt: row.processing_claimed_at ?? null,
  processingHeartbeatAt: row.processing_heartbeat_at ?? null,
  processingLeaseExpiresAt: row.processing_lease_expires_at ?? null
});

export const createSubmission = async (input) => {
  const timestamp = now();
  const submission = {
    id: crypto.randomUUID(),
    challengeSlug: input.challengeSlug,
    language: input.language,
    code: input.code,
    status: 'queued',
    createdAt: timestamp,
    updatedAt: timestamp,
    result: null,
    gradingAttempt: 1,
    processingClaimedAt: null,
    processingHeartbeatAt: null,
    processingLeaseExpiresAt: null
  };

  submission.attemptIdempotencyKey = createAttemptIdempotencyKey(submission.id, submission.gradingAttempt);

  getDb().prepare('INSERT INTO submissions (id, challenge_slug, language, code, status, created_at, updated_at, result_json, grading_attempt, attempt_idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(submission.id, submission.challengeSlug, submission.language, submission.code, submission.status, submission.createdAt, submission.updatedAt, null, submission.gradingAttempt, submission.attemptIdempotencyKey);

  return submission;
};

export const getSubmission = async (id) => {
  const row = getDb().prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  return row ? mapRow(row) : null;
};

export const listQueuedSubmissions = async () => {
  const rows = getDb().prepare(
    "SELECT * FROM submissions WHERE status = 'queued' AND completion_guard_at IS NULL ORDER BY created_at ASC"
  ).all();

  return rows.map(mapRow);
};

export const claimSubmissionForProcessing = async ({
  id,
  gradingAttempt,
  attemptIdempotencyKey,
  leaseDurationMs = null,
  timestamp = now()
}) => {
  const leaseEnabled = isPositiveDuration(leaseDurationMs);
  const processingClaimedAt = leaseEnabled ? timestamp : null;
  const processingHeartbeatAt = leaseEnabled ? timestamp : null;
  const processingLeaseExpiresAt = leaseEnabled ? addMilliseconds(timestamp, leaseDurationMs) : null;

  const write = getDb().prepare(`
    UPDATE submissions
    SET status = 'running',
        updated_at = ?,
        processing_claimed_at = ?,
        processing_heartbeat_at = ?,
        processing_lease_expires_at = ?
    WHERE id = ?
      AND status = 'queued'
      AND completion_guard_at IS NULL
      AND grading_attempt = ?
      AND (
        attempt_idempotency_key = ?
        OR (attempt_idempotency_key IS NULL AND ? IS NULL)
      )
  `).run(
    timestamp,
    processingClaimedAt,
    processingHeartbeatAt,
    processingLeaseExpiresAt,
    id,
    gradingAttempt,
    attemptIdempotencyKey,
    attemptIdempotencyKey
  );

  if (write.changes === 0) return null;
  return getSubmission(id);
};

export const heartbeatSubmissionProcessing = async ({
  id,
  gradingAttempt,
  attemptIdempotencyKey,
  leaseDurationMs,
  timestamp = now()
}) => {
  if (!isPositiveDuration(leaseDurationMs)) {
    throw new RangeError('leaseDurationMs must be a positive finite number.');
  }

  const nextLeaseExpiresAt = addMilliseconds(timestamp, leaseDurationMs);
  const write = getDb().prepare(`
    UPDATE submissions
    SET updated_at = ?,
        processing_heartbeat_at = ?,
        processing_lease_expires_at = ?
    WHERE id = ?
      AND status = 'running'
      AND completion_guard_at IS NULL
      AND processing_claimed_at IS NOT NULL
      AND processing_lease_expires_at > ?
      AND grading_attempt = ?
      AND (
        attempt_idempotency_key = ?
        OR (attempt_idempotency_key IS NULL AND ? IS NULL)
      )
  `).run(
    timestamp,
    timestamp,
    nextLeaseExpiresAt,
    id,
    timestamp,
    gradingAttempt,
    attemptIdempotencyKey,
    attemptIdempotencyKey
  );

  if (write.changes === 0) return null;
  return getSubmission(id);
};

export const updateSubmissionForAttempt = async (
  id,
  patch,
  { gradingAttempt, attemptIdempotencyKey, timestamp = now() }
) => {
  const current = await getSubmission(id);
  if (!current) return null;

  const isTerminalCompletion = patch?.result && TERMINAL_RESULT_STATUSES.has(patch.result.status);
  const status = patch.status ?? current.status;
  const result = patch.result === undefined ? current.result : patch.result;
  const resultJson = result ? JSON.stringify(result) : null;
  const clearProcessingLease = status !== 'running';

  if (isTerminalCompletion) {
    const write = getDb().prepare(`
      UPDATE submissions
      SET status = ?,
          updated_at = ?,
          result_json = ?,
          completion_guard_at = ?,
          processing_claimed_at = NULL,
          processing_heartbeat_at = NULL,
          processing_lease_expires_at = NULL
      WHERE id = ?
        AND status = 'running'
        AND completion_guard_at IS NULL
        AND grading_attempt = ?
        AND (processing_lease_expires_at IS NULL OR processing_lease_expires_at > ?)
        AND (
          attempt_idempotency_key = ?
          OR (attempt_idempotency_key IS NULL AND ? IS NULL)
        )
    `).run(
      status,
      timestamp,
      resultJson,
      timestamp,
      id,
      gradingAttempt,
      timestamp,
      attemptIdempotencyKey,
      attemptIdempotencyKey
    );

    if (write.changes === 0) return null;
    return getSubmission(id);
  }

  const write = getDb().prepare(`
    UPDATE submissions
    SET status = ?,
        updated_at = ?,
        result_json = ?,
        processing_claimed_at = ?,
        processing_heartbeat_at = ?,
        processing_lease_expires_at = ?
    WHERE id = ?
      AND status = 'running'
      AND completion_guard_at IS NULL
      AND grading_attempt = ?
      AND (processing_lease_expires_at IS NULL OR processing_lease_expires_at > ?)
      AND (
        attempt_idempotency_key = ?
        OR (attempt_idempotency_key IS NULL AND ? IS NULL)
      )
  `).run(
    status,
    timestamp,
    resultJson,
    clearProcessingLease ? null : current.processingClaimedAt,
    clearProcessingLease ? null : current.processingHeartbeatAt,
    clearProcessingLease ? null : current.processingLeaseExpiresAt,
    id,
    gradingAttempt,
    timestamp,
    attemptIdempotencyKey,
    attemptIdempotencyKey
  );

  if (write.changes === 0) return null;
  return getSubmission(id);
};

export const finalizeQueuedAttemptAsInfraFailed = async (
  id,
  result,
  { gradingAttempt, attemptIdempotencyKey, timestamp = now() }
) => {
  if (!result || result.status !== 'infra_failed') {
    throw new TypeError('result.status must be infra_failed.');
  }

  const write = getDb().prepare(`
    UPDATE submissions
    SET status = 'infra_failed',
        updated_at = ?,
        result_json = ?,
        completion_guard_at = ?,
        processing_claimed_at = NULL,
        processing_heartbeat_at = NULL,
        processing_lease_expires_at = NULL
    WHERE id = ?
      AND status = 'queued'
      AND completion_guard_at IS NULL
      AND grading_attempt = ?
      AND (
        attempt_idempotency_key = ?
        OR (attempt_idempotency_key IS NULL AND ? IS NULL)
      )
  `).run(
    timestamp,
    JSON.stringify(result),
    timestamp,
    id,
    gradingAttempt,
    attemptIdempotencyKey,
    attemptIdempotencyKey
  );

  if (write.changes === 0) return null;
  return getSubmission(id);
};

export const updateSubmission = async (id, patch) => {
  const current = await getSubmission(id);
  if (!current) return null;

  const isTerminalCompletion = patch?.result && TERMINAL_RESULT_STATUSES.has(patch.result.status);

  if (isTerminalCompletion) {
    const timestamp = now();
    const resultJson = JSON.stringify(patch.result);
    const status = patch.status ?? current.status;

    const write = getDb().prepare(`
      UPDATE submissions
      SET status = ?,
          updated_at = ?,
          result_json = ?,
          completion_guard_at = ?,
          processing_claimed_at = NULL,
          processing_heartbeat_at = NULL,
          processing_lease_expires_at = NULL
      WHERE id = ? AND completion_guard_at IS NULL
    `).run(status, timestamp, resultJson, timestamp, id);

    if (write.changes === 0) {
      return getSubmission(id);
    }

    return getSubmission(id);
  }

  if (current.completionGuardAt) {
    return current;
  }

  const updated = {
    ...current,
    ...patch,
    updatedAt: now()
  };
  const clearProcessingLease = updated.status !== 'running';

  const write = getDb().prepare(`
    UPDATE submissions
    SET challenge_slug = ?,
        language = ?,
        code = ?,
        status = ?,
        updated_at = ?,
        result_json = ?,
        grading_attempt = ?,
        attempt_idempotency_key = ?,
        completion_guard_at = ?,
        processing_claimed_at = ?,
        processing_heartbeat_at = ?,
        processing_lease_expires_at = ?
    WHERE id = ? AND completion_guard_at IS NULL
  `).run(
    updated.challengeSlug,
    updated.language,
    updated.code,
    updated.status,
    updated.updatedAt,
    updated.result ? JSON.stringify(updated.result) : null,
    updated.gradingAttempt,
    updated.attemptIdempotencyKey,
    updated.completionGuardAt,
    clearProcessingLease ? null : updated.processingClaimedAt,
    clearProcessingLease ? null : updated.processingHeartbeatAt,
    clearProcessingLease ? null : updated.processingLeaseExpiresAt,
    id
  );

  if (write.changes === 0) {
    return getSubmission(id);
  }

  return getSubmission(id);
};

export const startRetryAttempt = async (id, expectedAttempt = null) => {
  const current = await getSubmission(id);
  if (!current || current.completionGuardAt || current.status !== 'retry_pending') return null;

  if (expectedAttempt) {
    if (
      current.gradingAttempt !== expectedAttempt.gradingAttempt
      || current.attemptIdempotencyKey !== expectedAttempt.attemptIdempotencyKey
    ) {
      return null;
    }
  }

  const nextAttempt = (current.gradingAttempt ?? 1) + 1;
  const nextKey = createAttemptIdempotencyKey(id, nextAttempt);
  const timestamp = now();
  const write = getDb().prepare(`
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
    nextKey,
    id,
    current.gradingAttempt,
    current.attemptIdempotencyKey,
    current.attemptIdempotencyKey
  );

  if (write.changes === 0) return null;
  return getSubmission(id);
};