import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const startServer = (cmd, args, env) => spawn(cmd, args, { env: { ...process.env, ...env }, stdio: 'ignore' });

const waitForHealth = async (url, retries = 30) => {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // noop
    }
    await sleep(100);
  }
  throw new Error(`health check failed: ${url}`);
};

test('web smoke: 問題を開いて提出し結果を表示できる', async (t) => {
  const worker = startServer('node', ['apps/worker/src/server.mjs'], { WORKER_PORT: '28081' });
  const api = startServer('node', ['apps/api/src/server.mjs'], { API_PORT: '28080', RUNNER_API_BASE_URL: 'http://localhost:28081' });
  const web = startServer('node', ['apps/web/src/server.mjs'], { WEB_PORT: '23000', API_BASE_URL: 'http://localhost:28080' });

  t.after(() => {
    web.kill('SIGKILL');
    api.kill('SIGKILL');
    worker.kill('SIGKILL');
  });

  await waitForHealth('http://localhost:28081/health');
  await waitForHealth('http://localhost:28080/health');
  await sleep(200);

  const top = await fetch('http://localhost:23000/');
  const topHtml = await top.text();
  assert.match(topHtml, /問題一覧/);

  const detail = await fetch('http://localhost:23000/challenges/js-bugfix-add');
  const detailHtml = await detail.text();
  assert.match(detailHtml, /starter\/sum\.js/);

  const form = new URLSearchParams({
    challengeSlug: 'js-bugfix-add',
    language: 'javascript',
    code: 'export function sum(nums){ return nums.reduce((acc, n) => acc + n, 0); }'
  });

  const submit = await fetch('http://localhost:23000/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    redirect: 'manual'
  });

  assert.equal(submit.status, 302);
  const location = submit.headers.get('location');
  assert.ok(location);

  let resultHtml = '';
  for (let i = 0; i < 30; i += 1) {
    const result = await fetch(`http://localhost:23000${location}`);
    resultHtml = await result.text();
    if (resultHtml.includes('提出結果')) break;
    await sleep(100);
  }

  assert.match(resultHtml, /提出結果/);
  assert.match(resultHtml, /pass\/fail/);
});
