const DEFAULT_STALE_RECOVERY_INTERVAL_MS = 15_000;
const DEFAULT_STALE_RECOVERY_BATCH_SIZE = 10;
const DEFAULT_STALE_RECOVERY_CONCURRENCY = 2;

const parsePositiveInteger = (rawValue, fallback, name) => {
  if (rawValue === undefined) return fallback;

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
};

export const getStaleRecoveryConfig = (
  env = process.env,
  { heartbeatEnabled = env.WORKER_HEARTBEAT_ENABLED === '1' } = {}
) => {
  const enabled = env.WORKER_STALE_RECOVERY_ENABLED === '1';
  const intervalMs = parsePositiveInteger(
    env.WORKER_STALE_RECOVERY_INTERVAL_MS,
    DEFAULT_STALE_RECOVERY_INTERVAL_MS,
    'WORKER_STALE_RECOVERY_INTERVAL_MS'
  );
  const batchSize = parsePositiveInteger(
    env.WORKER_STALE_RECOVERY_BATCH_SIZE,
    DEFAULT_STALE_RECOVERY_BATCH_SIZE,
    'WORKER_STALE_RECOVERY_BATCH_SIZE'
  );
  const concurrency = parsePositiveInteger(
    env.WORKER_STALE_RECOVERY_CONCURRENCY,
    DEFAULT_STALE_RECOVERY_CONCURRENCY,
    'WORKER_STALE_RECOVERY_CONCURRENCY'
  );

  if (enabled && !heartbeatEnabled) {
    throw new Error('WORKER_STALE_RECOVERY_ENABLED requires WORKER_HEARTBEAT_ENABLED=1.');
  }

  if (concurrency > batchSize) {
    throw new Error('WORKER_STALE_RECOVERY_CONCURRENCY must not exceed WORKER_STALE_RECOVERY_BATCH_SIZE.');
  }

  return {
    enabled,
    intervalMs,
    batchSize,
    concurrency
  };
};
