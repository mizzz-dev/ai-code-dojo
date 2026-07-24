export const SUBMISSION_QUEUE_MESSAGE_SCHEMA_VERSION = 1;

const allowedFields = new Set([
  'schemaVersion',
  'submissionId',
  'gradingAttempt',
  'attemptIdempotencyKey',
  'correlationId'
]);

const failure = (code, field = null) => ({
  success: false,
  error: { code, field }
});

const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;

export const parseSubmissionQueueMessage = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return failure('invalid_message');
  }

  const unknownField = Object.keys(input).find((field) => !allowedFields.has(field));
  if (unknownField) return failure('unknown_field', unknownField);

  if (input.schemaVersion !== SUBMISSION_QUEUE_MESSAGE_SCHEMA_VERSION) {
    return failure('unsupported_schema_version', 'schemaVersion');
  }
  if (!isNonEmptyString(input.submissionId)) {
    return failure('invalid_submission_id', 'submissionId');
  }
  if (!Number.isInteger(input.gradingAttempt) || input.gradingAttempt < 1) {
    return failure('invalid_grading_attempt', 'gradingAttempt');
  }
  if (!isNonEmptyString(input.attemptIdempotencyKey)) {
    return failure('invalid_attempt_idempotency_key', 'attemptIdempotencyKey');
  }
  if (input.correlationId !== undefined && !isNonEmptyString(input.correlationId)) {
    return failure('invalid_correlation_id', 'correlationId');
  }

  return {
    success: true,
    data: {
      schemaVersion: SUBMISSION_QUEUE_MESSAGE_SCHEMA_VERSION,
      submissionId: input.submissionId,
      gradingAttempt: input.gradingAttempt,
      attemptIdempotencyKey: input.attemptIdempotencyKey,
      ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId })
    }
  };
};

export const buildSubmissionQueueMessage = ({
  submissionId,
  gradingAttempt,
  attemptIdempotencyKey,
  correlationId
}) => {
  const parsed = parseSubmissionQueueMessage({
    schemaVersion: SUBMISSION_QUEUE_MESSAGE_SCHEMA_VERSION,
    submissionId,
    gradingAttempt,
    attemptIdempotencyKey,
    ...(correlationId === undefined ? {} : { correlationId })
  });

  if (!parsed.success) {
    throw new TypeError(`invalid submission queue message: ${parsed.error.code}`);
  }

  return parsed.data;
};
