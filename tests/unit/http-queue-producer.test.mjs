import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpQueueProducer } from '../../packages/queue/src/http-queue-producer.mjs';
import { buildSubmissionQueueMessage } from '../../packages/queue/src/message-contract.mjs';

test('HTTP queue producerはversion付きmessageを/jobsへ送信する', async () => {
  const requests = [];
  const producer = createHttpQueueProducer({
    baseUrl: 'http://worker.example/',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return { ok: true };
    }
  });

  const message = buildSubmissionQueueMessage({
    submissionId: 'submission-1',
    gradingAttempt: 2,
    attemptIdempotencyKey: 'submission-1:attempt:2'
  });
  const enqueued = await producer.enqueue(message);

  assert.equal(enqueued, true);
  assert.equal(requests[0].url, 'http://worker.example/jobs');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].init.body), message);
});

test('HTTP queue producerは非2xx・接続失敗・不正messageをfalseとして扱う', async () => {
  const message = buildSubmissionQueueMessage({
    submissionId: 'submission-1',
    gradingAttempt: 1,
    attemptIdempotencyKey: 'submission-1:attempt:1'
  });

  const nonSuccessProducer = createHttpQueueProducer({
    baseUrl: 'http://worker.example',
    fetchImpl: async () => ({ ok: false })
  });
  assert.equal(await nonSuccessProducer.enqueue(message), false);

  const failedProducer = createHttpQueueProducer({
    baseUrl: 'http://worker.example',
    fetchImpl: async () => {
      throw new Error('network error');
    }
  });
  assert.equal(await failedProducer.enqueue(message), false);

  let called = false;
  const invalidProducer = createHttpQueueProducer({
    baseUrl: 'http://worker.example',
    fetchImpl: async () => {
      called = true;
      return { ok: true };
    }
  });
  assert.equal(await invalidProducer.enqueue({ ...message, code: 'must not be sent' }), false);
  assert.equal(called, false);
});
