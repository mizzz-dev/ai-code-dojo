import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const waitForHealth = async (url, retries = 30) => {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // noop
    }
    await sleep(100);
  }
  throw new Error(`health check failed: ${url}`);
};

const startServer = (cmd, args, env) => spawn(cmd, args, { env: { ...process.env, ...env }, stdio: 'ignore' });

test('challenge 一覧/詳細, submission 作成/結果取得', async (t) => {
  const worker = startServer('node', ['apps/worker/src/server.mjs'], { WORKER_PORT: '18081' });
  const api = startServer('node', ['apps/api/src/server.mjs'], { API_PORT: '18080', RUNNER_API_BASE_URL: 'http://localhost:18081' });

  t.after(() => {
    api.kill('SIGKILL');
    worker.kill('SIGKILL');
  });

  await waitForHealth('http://localhost:18081/health');
  await waitForHealth('http://localhost:18080/health');

  const listRes = await fetch('http://localhost:18080/api/challenges');
  const listData = await listRes.json();
  assert.ok(listData.challenges.length >= 1);

  const detailRes = await fetch('http://localhost:18080/api/challenges/js-bugfix-add');
  const detailData = await detailRes.json();
  assert.equal(detailData.challenge.metadata.slug, 'js-bugfix-add');

  const submissionRes = await fetch('http://localhost:18080/api/submissions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      challengeSlug: 'js-bugfix-add',
      language: 'javascript',
      code: 'export function sum(nums){ return nums.reduce((acc, n) => acc + n, 0); }'
    })
  });
  assert.equal(submissionRes.status, 201);
  const submission = await submissionRes.json();

  let resultData;
  for (let i = 0; i < 30; i += 1) {
    const resultRes = await fetch(`http://localhost:18080/api/submissions/${submission.id}`);
    resultData = await resultRes.json();
    if (resultData.result) break;
    await sleep(100);
  }

  assert.equal(resultData.status, 'completed');
  assert.ok(Array.isArray(resultData.result.visibleTests));
  assert.equal(typeof resultData.result.hiddenTests.passed, 'boolean');
});
