import crypto from 'node:crypto';
import { getDb } from '../db/database.mjs';

const now = () => new Date().toISOString();

const mapRow = (row) => ({
  id: row.id,
  challengeSlug: row.challenge_slug,
  language: row.language,
  code: row.code,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  result: row.result_json ? JSON.parse(row.result_json) : null
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
    result: null
  };

  getDb().prepare('INSERT INTO submissions (id, challenge_slug, language, code, status, created_at, updated_at, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(submission.id, submission.challengeSlug, submission.language, submission.code, submission.status, submission.createdAt, submission.updatedAt, null);

  return submission;
};

export const getSubmission = async (id) => {
  const row = getDb().prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  return row ? mapRow(row) : null;
};

export const updateSubmission = async (id, patch) => {
  const current = await getSubmission(id);
  if (!current) return null;

  const updated = {
    ...current,
    ...patch,
    updatedAt: now()
  };

  getDb().prepare('UPDATE submissions SET challenge_slug = ?, language = ?, code = ?, status = ?, updated_at = ?, result_json = ? WHERE id = ?')
    .run(updated.challengeSlug, updated.language, updated.code, updated.status, updated.updatedAt, updated.result ? JSON.stringify(updated.result) : null, id);

  return updated;
};
