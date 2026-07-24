import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBMISSION_QUEUE_MESSAGE_SCHEMA_VERSION,
  buildSubmissionQueueMessage,
  parseSubmissionQueueMessage
} from '../../packages/queue/src/message-contract.mjs';

test('queue message builderは最小参照情報だけを生成する', () => {
  const message = buildSubmissionQueueMessage({
    submissionId: 'submission-1',
    gradingAttempt: 2,
    attemptIdempotencyKey: 'submission-1:attempt:2',
    correlationId: 'correlation-1'
  });

  assert.deepEqual(message, {
    schemaVersion: SUBMISSION_QUEUE_MESSAGE_SCHEMA_VERSION,
    submissionId: 'submission-1',
    gradingAttempt: 2,
    attemptIdempotencyKey: 'submission-1:attempt:2',
    correlationId: 'correlation-1'
  });
  assert.equal('code' in message, false);
  assert.equal('hiddenTests' in message, false);
  assert.equal('secret' in message, false);
});

test('queue message parserは正しいversion付きmessageを受理する', () => {
  const parsed = parseSubmissionQueueMessage({
    schemaVersion: 1,
    submissionId: 'submission-1',
    gradingAttempt: 1,
    attemptIdempotencyKey: 'submission-1:attempt:1'
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.schemaVersion, 1);
});

test('queue message parserはversion不一致・欠落・不正型・未知fieldを拒否する', () => {
  const base = {
    schemaVersion: 1,
    submissionId: 'submission-1',
    gradingAttempt: 1,
    attemptIdempotencyKey: 'submission-1:attempt:1'
  };

  assert.equal(parseSubmissionQueueMessage({ ...base, schemaVersion: 2 }).error.code, 'unsupported_schema_version');
  assert.equal(parseSubmissionQueueMessage({ ...base, submissionId: '' }).error.code, 'invalid_submission_id');
  assert.equal(parseSubmissionQueueMessage({ ...base, gradingAttempt: 0 }).error.code, 'invalid_grading_attempt');
  assert.equal(parseSubmissionQueueMessage({ ...base, attemptIdempotencyKey: null }).error.code, 'invalid_attempt_idempotency_key');
  assert.equal(parseSubmissionQueueMessage({ ...base, correlationId: '' }).error.code, 'invalid_correlation_id');
  assert.equal(parseSubmissionQueueMessage({ ...base, code: 'do not include' }).error.code, 'unknown_field');
});
