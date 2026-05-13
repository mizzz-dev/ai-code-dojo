import { randomUUID } from 'node:crypto';
import { getDb } from '../apps/api/src/db/database.mjs';

const db = getDb();
const count = db.prepare('SELECT COUNT(*) AS count FROM challenges').get().count;
if (count > 0) {
  console.log('Seed skipped: challenges already exist.');
  process.exit(0);
}

const challengeId = randomUUID();
const versionId = randomUUID();
const now = new Date().toISOString();
const payload = {
  metadata: { title: 'Sample JS Bugfix', difficulty: 'easy', type: 'bugfix', tags: ['javascript'] },
  statement: { background: 'Seed data', task: 'Fix add function', acceptanceCriteria: ['tests pass'], outOfScope: [] },
  starterCode: [],
  visibleTests: ['tests/visible/add.test.js'],
  hiddenTests: ['tests/hidden/add.hidden.test.js'],
  runnerConfig: { testCommand: 'npm test' },
  reviewConfig: { prTitleTemplate: 'fix: add function', prBodyTemplate: 'seed', reviewerCommentTemplates: ['LGTM'], language: 'ja', focusPoints: ['tests'] }
};

db.prepare('INSERT INTO challenges (id, slug, status, current_version_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
  .run(challengeId, 'seed-js-bugfix-add', 'draft', versionId, now, now);
db.prepare('INSERT INTO challenge_versions (id, challenge_id, version, created_at, payload_json) VALUES (?, ?, ?, ?, ?)')
  .run(versionId, challengeId, 1, now, JSON.stringify(payload));

console.log('DB seed completed: 1 challenge inserted.');
