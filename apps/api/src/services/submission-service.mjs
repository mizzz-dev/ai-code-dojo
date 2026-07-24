import { enqueueSubmissionAttempt } from '../../../../packages/queue/src/submission-queue.mjs';
import { createSubmission, getSubmission } from '../repositories/submission-repository.mjs';

export { enqueueSubmissionAttempt };

export const validateSubmissionInput = (input) => {
  if (!input || typeof input !== 'object') return false;
  if (typeof input.challengeSlug !== 'string' || input.challengeSlug.length === 0) return false;
  if (typeof input.language !== 'string' || input.language.length === 0) return false;
  if (typeof input.code !== 'string' || input.code.length === 0) return false;
  return true;
};

export const createSubmissionAndEnqueue = async (body) => {
  if (!validateSubmissionInput(body)) {
    return { error: '不正なsubmission入力です。challengeSlug/language/codeを確認してください。', statusCode: 400 };
  }

  const submission = await createSubmission(body);
  const enqueued = await enqueueSubmissionAttempt({
    submissionId: submission.id,
    gradingAttempt: submission.gradingAttempt,
    attemptIdempotencyKey: submission.attemptIdempotencyKey
  });

  if (!enqueued) {
    return { error: 'Workerへのジョブ投入に失敗しました。', statusCode: 502 };
  }

  return { data: { id: submission.id, status: submission.status }, statusCode: 201 };
};

export const getSubmissionResult = async (id, auth = { role: 'guest' }) => {
  const submission = await getSubmission(id);
  if (!submission) {
    return { error: 'submissionが見つかりません。', statusCode: 404 };
  }

  const visibleTests = (submission.result?.testResults ?? []).filter((test) => test.visibility === 'visible');
  const hiddenSummary = (submission.result?.testResults ?? []).filter((test) => test.visibility === 'hidden');
  const isAdmin = auth.role === 'admin';
  const learnerSafeStatus = submission.status === 'retry_pending'
    ? 'retrying'
    : submission.status === 'infra_failed'
      ? 'failed'
      : submission.status;
  const learnerSafeResultStatus = submission.result?.status === 'infra_failed'
    ? 'failed'
    : submission.result?.status;

  return {
    statusCode: 200,
    data: {
      id: submission.id,
      challengeSlug: submission.challengeSlug,
      language: submission.language,
      status: isAdmin ? submission.status : learnerSafeStatus,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      result: submission.result
        ? {
            status: isAdmin ? submission.result.status : learnerSafeResultStatus,
            score: submission.result.score,
            logs: isAdmin ? submission.result.logs : undefined,
            internal: isAdmin ? {
              hiddenTestResults: (submission.result?.testResults ?? []).filter((test) => test.visibility === 'hidden'),
              fullTestResults: submission.result?.testResults ?? []
            } : undefined,
            durationMs: submission.result.durationMs,
            visibleTests,
            hiddenTests: {
              passed: hiddenSummary.every((test) => test.passed),
              total: hiddenSummary.length,
              passedCount: hiddenSummary.filter((test) => test.passed).length
            }
          }
        : null
    }
  };
};
