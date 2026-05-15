import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { runJavaScriptChallengeViaIsolatedJob } from '../../apps/worker/src/services/js-runner.mjs';

test('runJavaScriptChallengeViaIsolatedJob keeps structured failure payload logs', async () => {
  const result = await runJavaScriptChallengeViaIsolatedJob({
    challenge: {},
    challengeBasePath: '/non-existent-path',
    code: 'console.log(1);'
  });

  assert.equal(result.status, 'failed');
  assert.ok(Array.isArray(result.logs));
  assert.ok(result.logs.length > 0);
  assert.ok(Array.isArray(result.testResults));
  assert.ok(Array.isArray(result.artifacts));
});

test('worker server rejects RUNNER_ISOLATION_POC=1 in production', async () => {
  const serverPath = path.resolve('apps/worker/src/server.mjs');
  const child = spawn('node', [serverPath], {
    env: { ...process.env, NODE_ENV: 'production', RUNNER_ISOLATION_POC: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  const code = await new Promise((resolve) => child.on('close', resolve));
  assert.notEqual(code, 0);
  assert.match(stderr, /RUNNER_ISOLATION_POC must not be enabled in production/);
});
