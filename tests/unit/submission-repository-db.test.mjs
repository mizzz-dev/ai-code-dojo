import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('submission repository persists create/update/get in db', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-sub-'));
  const prev = process.cwd();
  process.chdir(dir);

  const repo = await import('../../apps/api/src/repositories/submission-repository.mjs');
  const created = await repo.createSubmission({ challengeSlug: 'js-bugfix-add', language: 'javascript', code: 'module.exports=1;' });
  assert.equal(created.status, 'queued');

  const running = await repo.updateSubmission(created.id, { status: 'running' });
  assert.equal(running.status, 'running');

  const completed = await repo.updateSubmission(created.id, {
    status: 'completed',
    result: { status: 'passed', score: 100, durationMs: 5, logs: [], testResults: [] }
  });
  assert.equal(completed.result.status, 'passed');

  const loaded = await repo.getSubmission(created.id);
  assert.equal(loaded.status, 'completed');
  assert.equal(loaded.result.score, 100);

  process.chdir(prev);
  await rm(dir, { recursive: true, force: true });
});
