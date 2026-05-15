import { spawn } from 'node:child_process';

export const buildContainerRuntimeArgs = ({
  workingDirectory,
  tests,
  timeoutSeconds,
  image = 'node:20-alpine',
  cpuLimit = '0.5',
  memoryLimit = '256m',
  pidsLimit = 64,
  tmpfs = '/tmp:rw,noexec,nosuid,size=64m'
}) => {
  const hardTimeoutSeconds = Math.max(1, timeoutSeconds + 3);
  return [
    'run', '--rm',
    '--network', 'none',
    '--read-only',
    '--tmpfs', tmpfs,
    '--cpus', cpuLimit,
    '--memory', memoryLimit,
    '--pids-limit', String(pidsLimit),
    '-v', `${workingDirectory}:/workspace:ro`,
    '-w', '/workspace',
    image,
    'sh', '-lc',
    `timeout -s TERM -k 3s ${hardTimeoutSeconds}s node --test ${tests.map((test) => `'${String(test).replace(/'/g, `'\\''`)}'`).join(' ')}`
  ];
};

export const runNodeTestsInContainer = ({ workingDirectory, tests, timeoutMs, visibility, spawnImpl = spawn }) =>
  new Promise((resolve) => {
    const started = Date.now();
    const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
    const args = buildContainerRuntimeArgs({ workingDirectory, tests, timeoutSeconds });
    const child = spawnImpl('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let settled = false;
    let hostTimedOut = false;
    let killTimer = null;
    const hostTimeoutMs = timeoutMs + 5000;

    const clearKillTimer = () => {
      if (killTimer) {
        clearTimeout(killTimer);
        killTimer = null;
      }
    };

    const finalize = (message, passed) => {
      if (settled) return;
      settled = true;
      resolve({
        output: `${stdout}\n${stderr}`.trim(),
        result: {
          testId: `${visibility}-suite`,
          passed,
          message,
          durationMs: Date.now() - started,
          visibility
        }
      });
    };

    child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });

    const hostTimer = setTimeout(() => {
      if (settled) return;
      hostTimedOut = true;
      if (typeof child.kill === 'function') child.kill('SIGTERM');
      clearKillTimer();
      killTimer = setTimeout(() => {
        if (settled) return;
        if (typeof child.kill === 'function') child.kill('SIGKILL');
      }, 3000);
    }, hostTimeoutMs);

    const clearHostTimer = () => clearTimeout(hostTimer);

    child.on('error', (error) => {
      clearHostTimer();
      clearKillTimer();
      if (hostTimedOut) return finalize('timeout', false);
      finalize(`runtime unavailable: ${error.code ?? error.message}`, false);
    });

    child.on('close', (code) => {
      clearHostTimer();
      clearKillTimer();
      if (hostTimedOut) return finalize('timeout', false);
      if (code === 0) return finalize('ok', true);
      if (code === 124 || code === 137 || code === 143) return finalize('timeout', false);
      finalize('runtime failure', false);
    });
  });
