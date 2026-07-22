import test from 'node:test';
import assert from 'node:assert/strict';
import { getProcessingLeaseConfig } from '../../apps/worker/src/config/processing-lease-config.mjs';

test('processing lease config keeps heartbeat disabled by default', () => {
  assert.deepEqual(getProcessingLeaseConfig({}), {
    enabled: false,
    leaseDurationMs: 30_000,
    heartbeatIntervalMs: 10_000
  });
});

test('processing lease config validates enabled lease and heartbeat intervals', () => {
  assert.deepEqual(getProcessingLeaseConfig({
    WORKER_HEARTBEAT_ENABLED: '1',
    WORKER_LEASE_DURATION_MS: '9000',
    WORKER_HEARTBEAT_INTERVAL_MS: '3000'
  }), {
    enabled: true,
    leaseDurationMs: 9000,
    heartbeatIntervalMs: 3000
  });

  assert.throws(
    () => getProcessingLeaseConfig({
      WORKER_HEARTBEAT_ENABLED: '1',
      WORKER_LEASE_DURATION_MS: '9000',
      WORKER_HEARTBEAT_INTERVAL_MS: '4000'
    }),
    /at most one third/
  );

  assert.throws(
    () => getProcessingLeaseConfig({
      WORKER_HEARTBEAT_ENABLED: '1',
      WORKER_LEASE_DURATION_MS: '0'
    }),
    /positive finite number/
  );
});
