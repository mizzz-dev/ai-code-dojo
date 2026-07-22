import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('retry_pending移行後とlease期限切れ後の遅延terminal保存を拒否する', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-fencing-'));
  const previousCwd = process.cwd();
  process.chdir(dir);

  try {
    const repo = await import('../../apps/api/src/repositories/submission-repository.mjs');

    const retrySubmission = await repo.createSubmission({
      challengeSlug: 'js-bugfix-add',
      language: 'javascript',
      code: 'module.exports=1;'
    });
    const retryClaim = await repo.claimSubmissionForProcessing({
      id: retrySubmission.id,
      gradingAttempt: retrySubmission.gradingAttempt,
      attemptIdempotencyKey: retrySubmission.attemptIdempotencyKey,
      leaseDurationMs: 30_000,
      timestamp: '2026-07-22T00:00:00.000Z'
    });
    const expectedRetryAttempt = {
      gradingAttempt: retryClaim.gradingAttempt,
      attemptIdempotencyKey: retryClaim.attemptIdempotencyKey,
      timestamp: '2026-07-22T00:00:10.000Z'
    };

    const retryPending = await repo.updateSubmissionForAttempt(
      retrySubmission.id,
      { status: 'retry_pending' },
      expectedRetryAttempt
    );
    assert.equal(retryPending.status, 'retry_pending');

    const delayedTerminalAfterRetryPending = await repo.updateSubmissionForAttempt(
      retrySubmission.id,
      {
        status: 'completed',
        result: { status: 'passed', score: 100, durationMs: 1, logs: [], testResults: [] }
      },
      { ...expectedRetryAttempt, timestamp: '2026-07-22T00:00:11.000Z' }
    );
    assert.equal(delayedTerminalAfterRetryPending, null);

    const retryLatest = await repo.getSubmission(retrySubmission.id);
    assert.equal(retryLatest.status, 'retry_pending');
    assert.equal(retryLatest.result, null);
    assert.equal(retryLatest.completionGuardAt, null);

    const expiredSubmission = await repo.createSubmission({
      challengeSlug: 'js-bugfix-add',
      language: 'javascript',
      code: 'module.exports=2;'
    });
    const expiredClaim = await repo.claimSubmissionForProcessing({
      id: expiredSubmission.id,
      gradingAttempt: expiredSubmission.gradingAttempt,
      attemptIdempotencyKey: expiredSubmission.attemptIdempotencyKey,
      leaseDurationMs: 30_000,
      timestamp: '2026-07-22T00:00:00.000Z'
    });

    const delayedTerminalAfterLeaseExpiry = await repo.updateSubmissionForAttempt(
      expiredSubmission.id,
      {
        status: 'completed',
        result: { status: 'passed', score: 100, durationMs: 1, logs: [], testResults: [] }
      },
      {
        gradingAttempt: expiredClaim.gradingAttempt,
        attemptIdempotencyKey: expiredClaim.attemptIdempotencyKey,
        timestamp: '2026-07-22T00:00:31.000Z'
      }
    );
    assert.equal(delayedTerminalAfterLeaseExpiry, null);

    const expiredLatest = await repo.getSubmission(expiredSubmission.id);
    assert.equal(expiredLatest.status, 'running');
    assert.equal(expiredLatest.result, null);
    assert.equal(expiredLatest.completionGuardAt, null);
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { recursive: true, force: true });
  }
});
