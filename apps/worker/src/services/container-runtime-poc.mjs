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
    'timeout',
    '--signal=TERM',
    '--kill-after=3s',
    `${hardTimeoutSeconds}s`,
    'node', '--test', ...tests
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
    let closed = false;

    const finalize = (message, passed) => {
      if (closed) return;
      closed = true;
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

    child.on('error', (error) => {
      finalize(`runtime unavailable: ${error.code ?? error.message}`, false);
    });

    child.on('close', (code) => {
      if (code === 0) return finalize('ok', true);
      if (code === 124 || code === 137 || code === 143) return finalize('timeout', false);
      finalize('runtime failure', false);
    });
  });
