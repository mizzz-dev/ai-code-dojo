export const createQueueProducerPort = ({ enqueue }) => {
  if (typeof enqueue !== 'function') {
    throw new TypeError('queue producer enqueue must be a function');
  }

  return Object.freeze({
    enqueue: async (message) => Boolean(await enqueue(message))
  });
};
