import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const runNodeTests = (cwd, tests, timeoutMs, visibility) =>
  new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('node', ['--test', ...tests], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 3000);
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const durationMs = Date.now() - started;
      resolve({
        output: `${stdout}\n${stderr}`.trim(),
        result: {
          testId: `${visibility}-suite`,
          passed: !timedOut && code === 0,
          message: timedOut ? 'timeout' : signal === 'SIGKILL' ? 'killed' : code === 0 ? 'ok' : 'failed',
          durationMs,
          visibility
        }
      });
    });
  });

const main = async () => {
  const payload = JSON.parse(process.argv[2]);
  const challenge = JSON.parse(await readFile(payload.challengePath, 'utf8'));
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'ai-dojo-isolated-'));
  const workingDirectory = path.join(tmpRoot, challenge.metadata.slug);
  const startedAt = Date.now();

  try {
    await cp(payload.challengeBasePath, workingDirectory, { recursive: true });
    const editableStarter = challenge.starterCode.find((file) => !file.readonly);
    if (editableStarter) {
      await writeFile(path.join(workingDirectory, editableStarter.path), payload.code, 'utf8');
    }

    const timeoutMs = challenge.runnerConfig.timeoutSeconds * 1000;
    const visibleRun = await runNodeTests(workingDirectory, challenge.visibleTests, timeoutMs, 'visible');
    const hiddenRun = await runNodeTests(workingDirectory, challenge.hiddenTests, timeoutMs, 'hidden');

    const testResults = [visibleRun.result, hiddenRun.result];
    const passedCount = testResults.filter((test) => test.passed).length;

    const result = {
      status: 'completed',
      score: Math.round((passedCount / testResults.length) * 100),
      durationMs: Date.now() - startedAt,
      logs: [`[visible] ${visibleRun.output}`, '[hidden] hidden tests log is not exposed in MVP.'],
      testResults,
      artifacts: [
        { name: 'stdout.log', visibility: 'internal' },
        { name: 'stderr.log', visibility: 'internal' },
        { name: 'results.json', visibility: 'internal' }
      ]
    };

    process.stdout.write(JSON.stringify({ ok: true, result }));
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }
};

main().catch((error) => {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      result: {
        status: 'failed',
        score: 0,
        durationMs: 0,
        logs: [String(error?.message ?? error)],
        testResults: [],
        artifacts: []
      }
    })
  );
});
