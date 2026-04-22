import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRunnerResult } from '../../packages/runner-sdk/src/normalize.mjs';

test('runner normalize combines visible/hidden and calculates score', () => {
  const result = normalizeRunnerResult({
    visible: [{ testId: 'v1', passed: true, durationMs: 10, visibility: 'visible' }],
    hidden: [{ testId: 'h1', passed: false, durationMs: 12, visibility: 'hidden' }],
    artifacts: [],
    durationMs: 22,
    logs: ['done']
  });

  assert.equal(result.score, 50);
  assert.equal(result.testResults.length, 2);
  assert.equal(result.durationMs, 22);
});
