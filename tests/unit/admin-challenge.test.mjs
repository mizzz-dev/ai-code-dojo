import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const basePayload = {
  slug: 'admin-test',
  versionData: {
    metadata: { title: 'Admin Test' },
    statement: {},
    starterCode: [],
    visibleTests: ['a'],
    hiddenTests: ['b'],
    runnerConfig: { testCommand: 'npm test' },
    reviewConfig: { prTitleTemplate: 't', prBodyTemplate: 'b', reviewerCommentTemplates: ['c'], language: 'ja', focusPoints: ['x'] }
  }
};

test('publish/unpublish state transition', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-'));
  const prev = process.cwd();
  process.chdir(dir);
  const repo = await import('../../apps/api/src/repositories/admin-challenge-repository.mjs');
  const created = await repo.createAdminChallenge(basePayload);
  const pub = await repo.setChallengePublishStatus(created.challengeId, 'published');
  assert.equal(pub.status, 'published');
  const draft = await repo.setChallengePublishStatus(created.challengeId, 'draft');
  assert.equal(draft.status, 'draft');
  process.chdir(prev);
  await rm(dir, { recursive: true, force: true });
});
