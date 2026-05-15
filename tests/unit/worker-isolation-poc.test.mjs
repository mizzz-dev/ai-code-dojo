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
import { buildContainerRuntimeArgs, runNodeTestsInContainer } from '../../apps/worker/src/services/container-runtime-poc.mjs';

test('buildContainerRuntimeArgs builds deterministic docker options', () => {
  const args = buildContainerRuntimeArgs({
    workingDirectory: '/tmp/job',
    tests: ['tests/visible/a.test.js'],
    timeoutSeconds: 5
  });

  assert.deepEqual(args.slice(0, 17), [
    'run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m',
    '--cpus', '0.5', '--memory', '256m', '--pids-limit', '64', '-v', '/tmp/job:/workspace:ro', '-w', '/workspace'
  ]);
  assert.equal(args[args.length - 3], 'sh');
  assert.equal(args[args.length - 2], '-lc');
  assert.match(args[args.length - 1], /timeout -s TERM -k 3s/);
});

test('runNodeTestsInContainer normalizes docker unavailable as failed', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    setImmediate(() => child.emit('error', Object.assign(new Error('not found'), { code: 'ENOENT' })));
    return child;
  };

  const result = await runNodeTestsInContainer({
    workingDirectory: '/tmp/job', tests: ['x'], timeoutMs: 1000, visibility: 'visible', spawnImpl: fakeSpawn
  });
  assert.equal(result.result.passed, false);
  assert.match(result.result.message, /runtime unavailable/);
});


test('runNodeTestsInContainer host timeout escalates to SIGKILL and resolves on close', async () => {
  const events = [];
  let childRef;
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = (signal) => {
      events.push(signal);
      if (signal === 'SIGKILL') setImmediate(() => child.emit('close', 137));
    };
    childRef = child;
    return child;
  };

  const resultPromise = runNodeTestsInContainer({
    workingDirectory: '/tmp/job', tests: ['x'], timeoutMs: 10, visibility: 'visible', spawnImpl: fakeSpawn
  });

  setTimeout(() => {
    if (!events.includes('SIGKILL')) childRef.emit('close', 143);
  }, 9000);

  const result = await resultPromise;

  assert.equal(result.result.passed, false);
  assert.equal(result.result.message, 'timeout');
  assert.deepEqual(events, ['SIGTERM', 'SIGKILL']);
});

test('runNodeTestsInContainer avoids double resolve on error then close', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};
    setImmediate(() => {
      child.emit('error', Object.assign(new Error('not found'), { code: 'ENOENT' }));
      child.emit('close', 1);
    });
    return child;
  };

  const result = await runNodeTestsInContainer({
    workingDirectory: '/tmp/job', tests: ['x'], timeoutMs: 1000, visibility: 'visible', spawnImpl: fakeSpawn
  });

  assert.match(result.result.message, /runtime unavailable/);
});
