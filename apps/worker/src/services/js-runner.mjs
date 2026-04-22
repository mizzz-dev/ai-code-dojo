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
      `[hidden] ${hiddenRun.output}`
    ],
    testResults,
    artifacts: []
  };

  await rm(tmpRoot, { recursive: true, force: true });

  return result;
};
