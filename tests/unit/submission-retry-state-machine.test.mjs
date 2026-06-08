import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('learner-safe で infra_failed/retry_pending を抽象化する', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dojo-retry-'));
  const prev = process.cwd();
  process.chdir(dir);

  const repo = await import('../../apps/api/src/repositories/submission-repository.mjs');
  const service = await import('../../apps/api/src/services/submission-service.mjs');

  const created = await repo.createSubmission({ challengeSlug: 'js-bugfix-add', language: 'javascript', code: 'module.exports=1;' });
  await repo.updateSubmission(created.id, { status: 'retry_pending' });

  const learnerRetrying = await service.getSubmissionResult(created.id, { role: 'learner' });
  assert.equal(learnerRetrying.data.status, 'retrying');

  await repo.updateSubmission(created.id, {
    status: 'infra_failed',
    result: { status: 'infra_failed', score: 0, durationMs: 0, logs: ['infra'], testResults: [], artifacts: [] }
  });

  const learnerFailed = await service.getSubmissionResult(created.id, { role: 'learner' });
  assert.equal(learnerFailed.data.status, 'failed');
  assert.equal(learnerFailed.data.result.status, 'failed');
  assert.equal(learnerFailed.data.result.logs, undefined);

  const adminInfra = await service.getSubmissionResult(created.id, { role: 'admin' });
  assert.equal(adminInfra.data.status, 'infra_failed');
  assert.equal(adminInfra.data.result.status, 'infra_failed');
  assert.deepEqual(adminInfra.data.result.logs, ['infra']);

  process.chdir(prev);
  await rm(dir, { recursive: true, force: true });
});


test('retry enqueue は呼び出し側が指定したWorker URLを優先する', async () => {
  const service = await import('../../apps/api/src/services/submission-service.mjs');
  const originalFetch = globalThis.fetch;
  const originalRunnerUrl = process.env.RUNNER_API_BASE_URL;
  const requestedUrls = [];

  process.env.RUNNER_API_BASE_URL = 'http://localhost:65530';
  globalThis.fetch = async (url) => {
    requestedUrls.push(url);
    return { ok: true };
  };

  try {
    const enqueued = await service.enqueueSubmissionAttempt({
      submissionId: 'sub-1',
      gradingAttempt: 2,
      attemptIdempotencyKey: 'sub-1:attempt:2',
      runnerApiBaseUrl: 'http://localhost:18082'
    });

    assert.equal(enqueued, true);
    assert.deepEqual(requestedUrls, ['http://localhost:18082/jobs']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalRunnerUrl === undefined) {
      delete process.env.RUNNER_API_BASE_URL;
    } else {
      process.env.RUNNER_API_BASE_URL = originalRunnerUrl;
    }
  }
});
