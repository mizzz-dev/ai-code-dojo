import test from 'node:test';
import assert from 'node:assert/strict';
import { getStaleRecoveryConfig } from '../../apps/worker/src/config/stale-recovery-config.mjs';

test('stale recovery config keeps scanner disabled by default', () => {
  assert.deepEqual(getStaleRecoveryConfig({}), {
    enabled: false,
    intervalMs: 15_000,
    batchSize: 10,
    concurrency: 2
  });
});

test('stale recovery config validates enabled settings and heartbeat dependency', () => {
  assert.deepEqual(getStaleRecoveryConfig({
    WORKER_STALE_RECOVERY_ENABLED: '1',
    WORKER_STALE_RECOVERY_INTERVAL_MS: '5000',
    WORKER_STALE_RECOVERY_BATCH_SIZE: '8',
    WORKER_STALE_RECOVERY_CONCURRENCY: '2'
  }, { heartbeatEnabled: true }), {
    enabled: true,
    intervalMs: 5000,
    batchSize: 8,
    concurrency: 2
  });

  assert.throws(
    () => getStaleRecoveryConfig({ WORKER_STALE_RECOVERY_ENABLED: '1' }, { heartbeatEnabled: false }),
    /requires WORKER_HEARTBEAT_ENABLED=1/
  );

  assert.throws(
    () => getStaleRecoveryConfig({
      WORKER_STALE_RECOVERY_BATCH_SIZE: '2',
      WORKER_STALE_RECOVERY_CONCURRENCY: '3'
    }),
    /must not exceed/
  );

  assert.throws(
    () => getStaleRecoveryConfig({ WORKER_STALE_RECOVERY_INTERVAL_MS: '1.5' }),
    /positive integer/
  );
});
