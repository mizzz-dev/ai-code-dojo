import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'app.db');
const LEGACY_CHALLENGES_PATH = path.resolve(process.cwd(), 'apps/api/data/challenges-admin.json');
const LEGACY_SUBMISSIONS_PATH = path.join(DATA_DIR, 'submissions.json');

let db;

const ensureDataDir = () => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
};

const migrateSchema = (database) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      current_version_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenge_versions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      UNIQUE(challenge_id, version),
      FOREIGN KEY(challenge_id) REFERENCES challenges(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      challenge_slug TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      result_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_challenges_slug_status ON challenges(slug, status);
  `);
};

const migrateLegacyJsonIfNeeded = (database) => {
  const count = database.prepare('SELECT COUNT(*) AS count FROM challenges').get().count;
  if (count === 0 && existsSync(LEGACY_CHALLENGES_PATH)) {
    const raw = JSON.parse(readFileSync(LEGACY_CHALLENGES_PATH, 'utf8'));
    const insertChallenge = database.prepare('INSERT OR IGNORE INTO challenges (id, slug, status, current_version_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    const insertVersion = database.prepare('INSERT OR IGNORE INTO challenge_versions (id, challenge_id, version, created_at, payload_json) VALUES (?, ?, ?, ?, ?)');
    for (const challenge of raw.challenges ?? []) {
      insertChallenge.run(challenge.id, challenge.slug, challenge.status, challenge.currentVersionId ?? null, challenge.createdAt, challenge.updatedAt);
    }
    for (const version of raw.challengeVersions ?? []) {
      const payload = {
        metadata: version.metadata,
        statement: version.statement,
        starterCode: version.starterCode,
        visibleTests: version.visibleTests,
        hiddenTests: version.hiddenTests,
        runnerConfig: version.runnerConfig,
        reviewConfig: version.reviewConfig
      };
      insertVersion.run(version.id, version.challengeId, version.version, version.createdAt, JSON.stringify(payload));
    }
  }

  const submissionCount = database.prepare('SELECT COUNT(*) AS count FROM submissions').get().count;
  if (submissionCount === 0 && existsSync(LEGACY_SUBMISSIONS_PATH)) {
    const raw = JSON.parse(readFileSync(LEGACY_SUBMISSIONS_PATH, 'utf8'));
    const insertSubmission = database.prepare('INSERT OR IGNORE INTO submissions (id, challenge_slug, language, code, status, created_at, updated_at, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const submission of raw) {
      insertSubmission.run(
        submission.id,
        submission.challengeSlug,
        submission.language,
        submission.code,
        submission.status,
        submission.createdAt,
        submission.updatedAt,
        submission.result ? JSON.stringify(submission.result) : null
      );
    }
  }
};

export const getDb = () => {
  if (db) return db;
  ensureDataDir();
  db = new Database(DB_PATH);
  migrateSchema(db);
  migrateLegacyJsonIfNeeded(db);
  return db;
};

export const runMigrations = () => {
  const database = getDb();
  migrateSchema(database);
  return DB_PATH;
};

export const getDbPath = () => DB_PATH;
