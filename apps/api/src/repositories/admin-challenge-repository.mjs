import { randomUUID } from 'node:crypto';
import { getDb } from '../db/database.mjs';

const now = () => new Date().toISOString();

const mapChallengeRow = (row) => ({
  id: row.id,
  slug: row.slug,
  status: row.status,
  currentVersionId: row.current_version_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapVersionRow = (row) => ({
  id: row.id,
  challengeId: row.challenge_id,
  version: row.version,
  createdAt: row.created_at,
  ...JSON.parse(row.payload_json)
});

export const listAdminChallenges = async () => {
  const rows = getDb().prepare('SELECT * FROM challenges ORDER BY updated_at DESC').all();
  return rows.map(mapChallengeRow);
};

export const getAdminChallengeById = async (id) => {
  const database = getDb();
  const challengeRow = database.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
  if (!challengeRow) return null;
  const versionRows = database.prepare('SELECT * FROM challenge_versions WHERE challenge_id = ? ORDER BY version DESC').all(id);
  return { ...mapChallengeRow(challengeRow), versions: versionRows.map(mapVersionRow) };
};

export const createAdminChallenge = async (payload) => {
  const database = getDb();
  const existing = database.prepare('SELECT id FROM challenges WHERE slug = ?').get(payload.slug);
  if (existing) throw new Error('slug already exists');

  const challengeId = randomUUID();
  const versionId = randomUUID();
  const createdAt = now();

  database.prepare('INSERT INTO challenges (id, slug, status, current_version_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(challengeId, payload.slug, 'draft', versionId, createdAt, createdAt);
  database.prepare('INSERT INTO challenge_versions (id, challenge_id, version, created_at, payload_json) VALUES (?, ?, ?, ?, ?)')
    .run(versionId, challengeId, 1, createdAt, JSON.stringify(payload.versionData));

  return { challengeId, versionId };
};

export const createAdminChallengeVersion = async (challengeId, versionData) => {
  const database = getDb();
  const challenge = database.prepare('SELECT id FROM challenges WHERE id = ?').get(challengeId);
  if (!challenge) return null;

  const row = database.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM challenge_versions WHERE challenge_id = ?').get(challengeId);
  const version = Number(row.version) + 1;
  const id = randomUUID();
  const updatedAt = now();

  database.prepare('INSERT INTO challenge_versions (id, challenge_id, version, created_at, payload_json) VALUES (?, ?, ?, ?, ?)')
    .run(id, challengeId, version, updatedAt, JSON.stringify(versionData));
  database.prepare('UPDATE challenges SET current_version_id = ?, updated_at = ? WHERE id = ?')
    .run(id, updatedAt, challengeId);

  return id;
};

export const setChallengePublishStatus = async (challengeId, status) => {
  const database = getDb();
  const updatedAt = now();
  const result = database.prepare('UPDATE challenges SET status = ?, updated_at = ? WHERE id = ?').run(status, updatedAt, challengeId);
  if (result.changes === 0) return null;
  const row = database.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);
  return mapChallengeRow(row);
};

export const findPublishedChallengeBySlug = async (slug) => {
  const database = getDb();
  const challengeRow = database.prepare("SELECT * FROM challenges WHERE slug = ? AND status = 'published'").get(slug);
  if (!challengeRow) return null;
  const versionRow = database.prepare('SELECT * FROM challenge_versions WHERE id = ?').get(challengeRow.current_version_id);
  if (!versionRow) return null;
  return { challenge: mapChallengeRow(challengeRow), version: mapVersionRow(versionRow) };
};
