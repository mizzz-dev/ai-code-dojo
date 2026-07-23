import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const infraFailedResult = {
  status: 'infra_failed',
  score: 0,
  durationMs: 0,
  logs: ['Retryジョブの再投入に失敗しました。'],
  testResults: [],
  artifacts: []
};

test('queued retry attemptだけをattempt/keyでfenceしてinfra_failedへ終端化する', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-queued-finalize-'));
  const previousCwd = process.cwd();
  process.chdir(dir);

  try {
    const repo = await import('../../apps/api/src/repositories/submission-repository.mjs');

    const created = await repo.createSubmission({
      challengeSlug: 'missing-challenge',
      language: 'javascript',
      code: 'module.exports=1;'
    });
    const running = await repo.claimSubmissionForProcessing({
      id: created.id,
      gradingAttempt: created.gradingAttempt,
      attemptIdempotencyKey: created.attemptIdempotencyKey
    });
    const retryPending = await repo.updateSubmissionForAttempt(
      created.id,
      { status: 'retry_pending' },
      {
        gradingAttempt: running.gradingAttempt,
        attemptIdempotencyKey: running.attemptIdempotencyKey
      }
    );
    const queuedRetry = await repo.startRetryAttempt(created.id, {
      gradingAttempt: retryPending.gradingAttempt,
      attemptIdempotencyKey: retryPending.attemptIdempotencyKey
    });

    assert.equal(queuedRetry.status, 'queued');
    assert.equal(queuedRetry.gradingAttempt, 2);

    const wrongAttempt = await repo.finalizeQueuedAttemptAsInfraFailed(
      created.id,
      infraFailedResult,
      {
        gradingAttempt: 1,
        attemptIdempotencyKey: created.attemptIdempotencyKey
      }
    );
    assert.equal(wrongAttempt, null);
    assert.equal((await repo.getSubmission(created.id)).status, 'queued');

    const finalized = await repo.finalizeQueuedAttemptAsInfraFailed(
      created.id,
      infraFailedResult,
      {
        gradingAttempt: queuedRetry.gradingAttempt,
        attemptIdempotencyKey: queuedRetry.attemptIdempotencyKey,
        timestamp: '2026-07-23T00:00:00.000Z'
      }
    );

    assert.equal(finalized.status, 'infra_failed');
    assert.equal(finalized.result.status, 'infra_failed');
    assert.equal(finalized.result.logs[0], 'Retryジョブの再投入に失敗しました。');
    assert.equal(finalized.completionGuardAt, '2026-07-23T00:00:00.000Z');
    assert.equal(finalized.processingClaimedAt, null);
    assert.equal(finalized.processingHeartbeatAt, null);
    assert.equal(finalized.processingLeaseExpiresAt, null);

    const duplicate = await repo.finalizeQueuedAttemptAsInfraFailed(
      created.id,
      infraFailedResult,
      {
        gradingAttempt: queuedRetry.gradingAttempt,
        attemptIdempotencyKey: queuedRetry.attemptIdempotencyKey
      }
    );
    assert.equal(duplicate, null);

    const runningOnly = await repo.createSubmission({
      challengeSlug: 'missing-challenge',
      language: 'javascript',
      code: 'module.exports=2;'
    });
    await repo.claimSubmissionForProcessing({
      id: runningOnly.id,
      gradingAttempt: runningOnly.gradingAttempt,
      attemptIdempotencyKey: runningOnly.attemptIdempotencyKey
    });

    const runningFinalize = await repo.finalizeQueuedAttemptAsInfraFailed(
      runningOnly.id,
      infraFailedResult,
      {
        gradingAttempt: runningOnly.gradingAttempt,
        attemptIdempotencyKey: runningOnly.attemptIdempotencyKey
      }
    );
    assert.equal(runningFinalize, null);
    assert.equal((await repo.getSubmission(runningOnly.id)).status, 'running');

    await assert.rejects(
      repo.finalizeQueuedAttemptAsInfraFailed(
        runningOnly.id,
        { ...infraFailedResult, status: 'failed' },
        {
          gradingAttempt: runningOnly.gradingAttempt,
          attemptIdempotencyKey: runningOnly.attemptIdempotencyKey
        }
      ),
      /result.status must be infra_failed/
    );
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { recursive: true, force: true });
  }
});