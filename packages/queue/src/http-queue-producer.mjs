import { parseSubmissionQueueMessage } from './message-contract.mjs';
import { createQueueProducerPort } from './producer-port.mjs';

const normalizeBaseUrl = (baseUrl) => baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

export const createHttpQueueProducer = ({ baseUrl, fetchImpl = globalThis.fetch }) => {
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new TypeError('queue HTTP baseUrl is required');
  }
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('queue HTTP fetch implementation is required');
  }

  const jobsUrl = `${normalizeBaseUrl(baseUrl)}/jobs`;

  return createQueueProducerPort({
    enqueue: async (message) => {
      const parsed = parseSubmissionQueueMessage(message);
      if (!parsed.success) return false;

      try {
        const response = await fetchImpl(jobsUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed.data)
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  });
};
