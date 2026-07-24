import { buildSubmissionQueueMessage } from './message-contract.mjs';
import { createHttpQueueProducer } from './http-queue-producer.mjs';

const getDefaultWorkerUrl = () => process.env.RUNNER_API_BASE_URL ?? 'http://localhost:8081';

export const enqueueSubmissionAttempt = async ({
  submissionId,
  gradingAttempt,
  attemptIdempotencyKey,
  correlationId,
  runnerApiBaseUrl = getDefaultWorkerUrl(),
  queueProducer
}) => {
  let message;
  try {
    message = buildSubmissionQueueMessage({
      submissionId,
      gradingAttempt,
      attemptIdempotencyKey,
      correlationId
    });
  } catch {
    return false;
  }

  const producer = queueProducer ?? createHttpQueueProducer({ baseUrl: runnerApiBaseUrl });
  return producer.enqueue(message);
};
