import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('stale runningだけをCASで新attemptへ回収し、上限到達時はinfra_failedへ終端化する', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-stale-recovery-'));
  const previousCwd = process.cwd();
  process.chdir(dir);

  try {
    const repo = await import('../../apps/api/src/repositories/submission-repository.mjs');
    const recoveryRepo = await import('../../apps/api/src/repositories/stale-submission-recovery-repository.mjs');
    const infraFailureResult = {
      status: 'infra_failed',
      score: 0,
      durationMs: 0,
      logs: ['Worker処理中断後の再試行上限に到達しました。'],
      testResults: [],
      artifacts: []
    };

    const stale = await repo.createSubmission({
      challengeSlug: 'js-bugfix-add',
      language: 'javascript',
      code: 'module.exports=1;'
    });
    const staleClaim = await repo.claimSubmissionForProcessing({
      id: stale.id,
      gradingAttempt: stale.gradingAttempt,
      attemptIdempotencyKey: stale.attemptIdempotencyKey,
      leaseDurationMs: 30_000,
      timestamp: '2026-07-23T00:00:00.000Z'
    });

    const unexpired = await repo.createSubmission({
      challengeSlug: 'js-bugfix-add',
      language: 'javascript',
      code: 'module.exports=2;'
    });
    await repo.claimSubmissionForProcessing({
      id: unexpired.id,
      gradingAttempt: unexpired.gradingAttempt,
      attemptIdempotencyKey: unexpired.attemptIdempotencyKey,
      leaseDurationMs: 60_000,
      timestamp: '2026-07-23T00:00:00.000Z'
    });

    const legacy = await repo.createSubmission({
      challengeSlug: 'js-bugfix-add',
      language: 'javascript',
      code: 'module.exports=3;'
    });
    await repo.updateSubmission(legacy.id, { status: 'running' });

    const candidates = await recoveryRepo.listStaleRunningSubmissions({
      timestamp: '2026-07-23T00:00:31.000Z',
      limit: 10
    });
    assert.deepEqual(candidates.map((candidate) => candidate.id), [stale.id]);

    const wrongLease = await recoveryRepo.recoverStaleRunningSubmission({
      id: stale.id,
      gradingAttempt: stale.gradingAttempt,
      attemptIdempotencyKey: stale.attemptIdempotencyKey,
      processingLeaseExpiresAt: '2026-07-23T00:00:29.000Z',
      maxInfraRetryAttempts: 2,
      infraFailureResult,
      timestamp: '2026-07-23T00:00:31.000Z'
    });
    assert.equal(wrongLease, null);

    const firstRecovery = await recoveryRepo.recoverStaleRunningSubmission({
      id: stale.id,
      gradingAttempt: stale.gradingAttempt,
      attemptIdempotencyKey: stale.attemptIdempotencyKey,
      processingLeaseExpiresAt: staleClaim.processingLeaseExpiresAt,
      maxInfraRetryAttempts: 2,
      infraFailureResult,
      timestamp: '2026-07-23T00:00:31.000Z'
    });
    assert.equal(firstRecovery.action, 'requeued');
    assert.equal(firstRecovery.previousAttempt, 1);
    assert.equal(firstRecovery.submission.status, 'queued');
    assert.equal(firstRecovery.submission.gradingAttempt, 2);
    assert.equal(
      firstRecovery.submission.attemptIdempotencyKey,
      repo.createAttemptIdempotencyKey(stale.id, 2)
    );
    assert.equal(firstRecovery.submission.processingLeaseExpiresAt, null);

    const duplicateRecovery = await recoveryRepo.recoverStaleRunningSubmission({
      id: stale.id,
      gradingAttempt: stale.gradingAttempt,
      attemptIdempotencyKey: stale.attemptIdempotencyKey,
      processingLeaseExpiresAt: staleClaim.processingLeaseExpiresAt,
      maxInfraRetryAttempts: 2,
      infraFailureResult,
      timestamp: '2026-07-23T00:00:31.000Z'
    });
    assert.equal(duplicateRecovery, null);

    const delayedOldAttemptTerminal = await repo.updateSubmissionForAttempt(
      stale.id,
      {
        status: 'completed',
        result: { status: 'passed', score: 100, durationMs: 1, logs: [], testResults: [] }
      },
      {
        gradingAttempt: stale.gradingAttempt,
        attemptIdempotencyKey: stale.attemptIdempotencyKey,
        timestamp: '2026-07-23T00:00:32.000Z'
      }
    );
    assert.equal(delayedOldAttemptTerminal, null);

    const secondClaim = await repo.claimSubmissionForProcessing({
      id: stale.id,
      gradingAttempt: firstRecovery.submission.gradingAttempt,
      attemptIdempotencyKey: firstRecovery.submission.attemptIdempotencyKey,
      leaseDurationMs: 30_000,
      timestamp: '2026-07-23T00:01:00.000Z'
    });
    const terminalRecovery = await recoveryRepo.recoverStaleRunningSubmission({
      id: stale.id,
      gradingAttempt: secondClaim.gradingAttempt,
      attemptIdempotencyKey: secondClaim.attemptIdempotencyKey,
      processingLeaseExpiresAt: secondClaim.processingLeaseExpiresAt,
      maxInfraRetryAttempts: 2,
      infraFailureResult,
      timestamp: '2026-07-23T00:01:31.000Z'
    });

    assert.equal(terminalRecovery.action, 'infra_failed');
    assert.equal(terminalRecovery.submission.status, 'infra_failed');
    assert.equal(terminalRecovery.submission.gradingAttempt, 2);
    assert.ok(terminalRecovery.submission.completionGuardAt);
    assert.equal(terminalRecovery.submission.processingLeaseExpiresAt, null);

    const latest = await repo.getSubmission(stale.id);
    assert.equal(latest.result.status, 'infra_failed');
    assert.equal(latest.processingClaimedAt, null);
    assert.equal(latest.processingHeartbeatAt, null);
    assert.equal(latest.processingLeaseExpiresAt, null);
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { recursive: true, force: true });
  }
});
