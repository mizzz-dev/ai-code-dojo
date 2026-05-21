import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const resetDbModule = async () => {
  const moduleUrl = new URL('../../apps/api/src/db/database.mjs', import.meta.url);
  return import(`${moduleUrl.href}?t=${Date.now()}`);
};

test('runMigrations adds attempt columns before attempt indexes on legacy submissions table', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-db-migrate-'));
  const prev = process.cwd();
  process.chdir(dir);

  const dataDir = path.join(dir, '.data');
  await mkdir(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'app.db');
  const legacyDb = new DatabaseSync(dbPath);

  legacyDb.exec(`
    CREATE TABLE submissions (
      id TEXT PRIMARY KEY,
      challenge_slug TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      result_json TEXT
    );
  `);
  legacyDb.close();

  const { runMigrations } = await resetDbModule();
  runMigrations();

  const migratedDb = new DatabaseSync(dbPath);
  const columns = migratedDb.prepare('PRAGMA table_info(submissions)').all();
  const indexes = migratedDb.prepare('PRAGMA index_list(submissions)').all();

  assert.ok(columns.some((column) => column.name === 'grading_attempt'));
  assert.ok(columns.some((column) => column.name === 'attempt_idempotency_key'));
  assert.ok(indexes.some((index) => index.name === 'idx_submissions_attempt_unique'));
  assert.ok(indexes.some((index) => index.name === 'idx_submissions_attempt_key_unique'));

  const keyRows = migratedDb.prepare('SELECT attempt_idempotency_key FROM submissions').all();
  assert.deepEqual(keyRows, []);

  migratedDb.close();
  process.chdir(prev);
  await rm(dir, { recursive: true, force: true });
});
