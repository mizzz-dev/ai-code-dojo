const DEFAULT_LEASE_DURATION_MS = 30_000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 10_000;

const parsePositiveNumber = (rawValue, fallback, name) => {
  if (rawValue === undefined) return fallback;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }

  return parsed;
};

export const getProcessingLeaseConfig = (env = process.env) => {
  const enabled = env.WORKER_HEARTBEAT_ENABLED === '1';
  const leaseDurationMs = parsePositiveNumber(
    env.WORKER_LEASE_DURATION_MS,
    DEFAULT_LEASE_DURATION_MS,
    'WORKER_LEASE_DURATION_MS'
  );
  const heartbeatIntervalMs = parsePositiveNumber(
    env.WORKER_HEARTBEAT_INTERVAL_MS,
    DEFAULT_HEARTBEAT_INTERVAL_MS,
    'WORKER_HEARTBEAT_INTERVAL_MS'
  );

  if (enabled && heartbeatIntervalMs * 3 > leaseDurationMs) {
    throw new Error('WORKER_HEARTBEAT_INTERVAL_MS must be at most one third of WORKER_LEASE_DURATION_MS.');
  }

  return {
    enabled,
    leaseDurationMs,
    heartbeatIntervalMs
  };
};
