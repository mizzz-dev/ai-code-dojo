import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const runNodeTests = (cwd, tests, timeoutMs, visibility) =>
  new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('node', ['--test', ...tests], { cwd });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - started;
      resolve({
        output: `${stdout}\n${stderr}`.trim(),
        result: {
          testId: `${visibility}-suite`,
          passed: !timedOut && code === 0,
          message: timedOut ? 'timeout' : code === 0 ? 'ok' : 'failed',
          durationMs,
          visibility
        }
      });
    });
  });

export const runJavaScriptChallenge = async ({ challenge, challengeBasePath, code }) => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-dojo-run-'));
  const workingDirectory = path.join(tmpRoot, challenge.metadata.slug);
  const startedAt = Date.now();

  await cp(challengeBasePath, workingDirectory, { recursive: true });

  const editableStarter = challenge.starterCode.find((file) => !file.readonly);
  if (editableStarter) {
    await writeFile(path.join(workingDirectory, editableStarter.path), code, 'utf8');
  }

  const visibleRun = await runNodeTests(
    workingDirectory,
    challenge.visibleTests,
    challenge.runnerConfig.timeoutSeconds * 1000,
    'visible'
  );
  const hiddenRun = await runNodeTests(
    workingDirectory,
    challenge.hiddenTests,
    challenge.runnerConfig.timeoutSeconds * 1000,
    'hidden'
  );

  const testResults = [visibleRun.result, hiddenRun.result];
  const passedCount = testResults.filter((test) => test.passed).length;

  const result = {
    status: 'completed',
    score: Math.round((passedCount / testResults.length) * 100),
    durationMs: Date.now() - startedAt,
    logs: [
      `[visible] ${visibleRun.output}`,
      '[hidden] hidden tests log is not exposed in MVP.'
    ],
    testResults,
    artifacts: []
  };

  await rm(tmpRoot, { recursive: true, force: true });

  return result;
};

export const runJavaScriptChallengeViaIsolatedJob = async ({ challenge, challengeBasePath, code }) =>
  runJavaScriptChallengeViaIsolatedJobWithSpawn({ challenge, challengeBasePath, code, spawnImpl: spawn });

export const runJavaScriptChallengeViaIsolatedJobWithSpawn = async ({
  challenge,
  challengeBasePath,
  code,
  spawnImpl
}) =>
  new Promise((resolve) => {
    const challengePath = path.join(challengeBasePath, 'problem.json');
    const payload = JSON.stringify({ challengePath, challengeBasePath, code });
    const workerRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    const entryPath = path.join(workerRoot, 'services', 'isolation-job-runner.mjs');
    const child = spawnImpl('node', [entryPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'development'
      }
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    let settled = false;
    const resolveOnce = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const normalizeFailure = (message, parsedFailure = null) => ({
      status: parsedFailure?.result?.status ?? 'failed',
      score: parsedFailure?.result?.score ?? 0,
      durationMs: parsedFailure?.result?.durationMs ?? 0,
      logs: parsedFailure?.result?.logs ?? [message],
      testResults: parsedFailure?.result?.testResults ?? [],
      artifacts: parsedFailure?.result?.artifacts ?? []
    });

    child.stdin.on('error', (error) => {
      resolveOnce(normalizeFailure(`isolation job stdin failed: ${error.code ?? error.message}`));
    });

    child.on('error', (error) => {
      resolveOnce(normalizeFailure(`isolation job spawn failed: ${error.code ?? error.message}`));
    });

    child.stdin.end(payload, 'utf8');

    child.on('close', () => {
      try {
        const parsed = JSON.parse(stdout || '{}');
        if (parsed.ok) {
          resolveOnce(parsed.result);
          return;
        }
      } catch {}

      try {
        const parsedFailure = JSON.parse(stdout || '{}');
        if (parsedFailure && parsedFailure.ok === false && parsedFailure.result) {
          resolveOnce(normalizeFailure(stderr || 'isolation job failed', parsedFailure));
          return;
        }
      } catch {}

      resolveOnce(normalizeFailure(stderr || 'isolation job failed'));
    });
  });
