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

  const guarded = await repo.createSubmission({ challengeSlug: 'js-bugfix-add', language: 'javascript', code: 'module.exports=2;' });
  const first = await repo.updateSubmission(guarded.id, {
    status: 'completed',
    result: { status: 'passed', score: 100, durationMs: 5, logs: [], testResults: [] }
  });
  assert.equal(first.result.status, 'passed');
  assert.ok(first.completionGuardAt);

  const second = await repo.updateSubmission(guarded.id, {
    status: 'failed',
    result: { status: 'failed', score: 0, durationMs: 3, logs: [], testResults: [] }
  });
  assert.equal(second.result.status, 'passed');
  assert.equal(second.completionGuardAt, first.completionGuardAt);

  const latestFromDb = await repo.getSubmission(guarded.id);
  assert.deepEqual(second, latestFromDb);

  const nonTerminal = await repo.createSubmission({ challengeSlug: 'js-bugfix-add', language: 'javascript', code: 'module.exports=3;' });
  const running2 = await repo.updateSubmission(nonTerminal.id, { status: 'running' });
  assert.equal(running2.status, 'running');
  assert.equal(running2.completionGuardAt, null);

  const retryPending = await repo.updateSubmission(nonTerminal.id, { status: 'retry_pending' });
  assert.equal(retryPending.status, 'retry_pending');
  assert.equal(retryPending.completionGuardAt, null);

  const retried = await repo.startRetryAttempt(nonTerminal.id);
  assert.equal(retried.status, 'queued');
  assert.equal(retried.result, null);
  assert.equal(retried.completionGuardAt, null);
  assert.equal(retried.gradingAttempt, 2);
  assert.equal(retried.attemptIdempotencyKey, repo.createAttemptIdempotencyKey(nonTerminal.id, 2));

  const retryRunning = await repo.updateSubmission(nonTerminal.id, { status: 'running' });
  assert.equal(retryRunning.status, 'running');

  const retryTerminal = await repo.updateSubmission(nonTerminal.id, {
    status: 'completed',
    result: { status: 'failed', score: 0, durationMs: 1, logs: [], testResults: [] }
  });
  assert.equal(retryTerminal.result.status, 'failed');
  assert.ok(retryTerminal.completionGuardAt);

  const terminalRetry = await repo.startRetryAttempt(nonTerminal.id);
  assert.equal(terminalRetry, null);

  const terminalOverwrite = await repo.updateSubmission(nonTerminal.id, { status: 'retry_pending' });
  assert.equal(terminalOverwrite.status, 'completed');
  assert.equal(terminalOverwrite.result.status, 'failed');
  assert.equal(terminalOverwrite.completionGuardAt, retryTerminal.completionGuardAt);

  const recoverableFirst = await repo.createSubmission({ challengeSlug: 'js-bugfix-add', language: 'javascript', code: 'module.exports=4;' });
  const recoverableSecond = await repo.createSubmission({ challengeSlug: 'js-bugfix-add', language: 'javascript', code: 'module.exports=5;' });

  const queued = await repo.listQueuedSubmissions();
  assert.deepEqual(
    new Set(queued.map((submission) => submission.id)),
    new Set([recoverableFirst.id, recoverableSecond.id])
  );

  const wrongAttemptClaim = await repo.claimSubmissionForProcessing({
    id: recoverableFirst.id,
    gradingAttempt: 99,
    attemptIdempotencyKey: recoverableFirst.attemptIdempotencyKey
  });
  assert.equal(wrongAttemptClaim, null);

  const claimed = await repo.claimSubmissionForProcessing({
    id: recoverableFirst.id,
    gradingAttempt: recoverableFirst.gradingAttempt,
    attemptIdempotencyKey: recoverableFirst.attemptIdempotencyKey
  });
  assert.equal(claimed.status, 'running');

  const duplicateClaim = await repo.claimSubmissionForProcessing({
    id: recoverableFirst.id,
    gradingAttempt: recoverableFirst.gradingAttempt,
    attemptIdempotencyKey: recoverableFirst.attemptIdempotencyKey
  });
  assert.equal(duplicateClaim, null);

  const remainingQueued = await repo.listQueuedSubmissions();
  assert.deepEqual(remainingQueued.map((submission) => submission.id), [recoverableSecond.id]);

  process.chdir(prev);
  await rm(dir, { recursive: true, force: true });
});
