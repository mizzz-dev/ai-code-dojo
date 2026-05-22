import crypto from 'node:crypto';
import { getDb } from '../db/database.mjs';

const now = () => new Date().toISOString();
const TERMINAL_RESULT_STATUSES = new Set(['passed', 'failed', 'infra_failed']);

export const createAttemptIdempotencyKey = (submissionId, attempt) => `${submissionId}:attempt:${attempt}`;

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
  completionGuardAt: row.completion_guard_at ?? null
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
    gradingAttempt: 1
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

export const updateSubmission = async (id, patch) => {
  const current = await getSubmission(id);
  if (!current) return null;

  const isTerminalCompletion = patch?.result && TERMINAL_RESULT_STATUSES.has(patch.result.status);

  if (isTerminalCompletion) {
    const timestamp = now();
    const updatedAt = timestamp;
    const completionGuardAt = timestamp;
    const resultJson = JSON.stringify(patch.result);
    const status = patch.status ?? current.status;

    const write = getDb().prepare(
      'UPDATE submissions SET status = ?, updated_at = ?, result_json = ?, completion_guard_at = ? WHERE id = ? AND completion_guard_at IS NULL'
    ).run(status, updatedAt, resultJson, completionGuardAt, id);

    if (write.changes === 0) {
      return getSubmission(id);
    }

    return getSubmission(id);
  }

  const updated = {
    ...current,
    ...patch,
    updatedAt: now()
  };

  getDb().prepare('UPDATE submissions SET challenge_slug = ?, language = ?, code = ?, status = ?, updated_at = ?, result_json = ?, grading_attempt = ?, attempt_idempotency_key = ?, completion_guard_at = ? WHERE id = ?')
    .run(updated.challengeSlug, updated.language, updated.code, updated.status, updated.updatedAt, updated.result ? JSON.stringify(updated.result) : null, updated.gradingAttempt, updated.attemptIdempotencyKey, updated.completionGuardAt, id);

  return updated;
};


export const startRetryAttempt = async (id) => {
  const current = await getSubmission(id);
  if (!current) return null;

  const nextAttempt = (current.gradingAttempt ?? 1) + 1;
  return updateSubmission(id, {
    status: 'queued',
    gradingAttempt: nextAttempt,
    attemptIdempotencyKey: createAttemptIdempotencyKey(id, nextAttempt),
    result: null,
    completionGuardAt: null
  });
};
