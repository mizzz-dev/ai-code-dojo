import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  runJavaScriptChallengeViaIsolatedJob,
  runJavaScriptChallengeViaIsolatedJobWithSpawn
} from '../../apps/worker/src/services/js-runner.mjs';

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

test('runJavaScriptChallengeViaIsolatedJob normalizes child stdin EPIPE failures', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdin.end = () => {
      child.stdin.emit('error', Object.assign(new Error('broken pipe'), { code: 'EPIPE' }));
    };
    setImmediate(() => child.emit('close', 1));
    return child;
  };

  const result = await runJavaScriptChallengeViaIsolatedJobWithSpawn({
    challenge: {},
    challengeBasePath: '/tmp',
    code: 'console.log(1);',
    spawnImpl: fakeSpawn
  });

  assert.equal(result.status, 'failed');
  assert.match(result.logs[0], /stdin failed: EPIPE/);
});

test('runJavaScriptChallengeViaIsolatedJob normalizes child spawn failures once', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdin.end = () => {};
    setImmediate(() => {
      child.emit('error', Object.assign(new Error('spawn failed'), { code: 'ENOENT' }));
      child.emit('close', 1);
    });
    return child;
  };

  const result = await runJavaScriptChallengeViaIsolatedJobWithSpawn({
    challenge: {},
    challengeBasePath: '/tmp',
    code: 'console.log(1);',
    spawnImpl: fakeSpawn
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.logs.length, 1);
  assert.match(result.logs[0], /spawn failed: ENOENT/);
});
