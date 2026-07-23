import {
  listStaleRunningSubmissions,
  recoverStaleRunningSubmission
} from '../../../api/src/repositories/stale-submission-recovery-repository.mjs';
import { finalizeQueuedAttemptAsInfraFailed } from '../../../api/src/repositories/submission-repository.mjs';
import { enqueueSubmissionAttempt } from '../../../api/src/services/submission-service.mjs';

const createInfraFailureResult = (message) => ({
  status: 'infra_failed',
  score: 0,
  durationMs: 0,
  logs: [message],
  testResults: [],
  artifacts: []
});

const defaultDependencies = {
  listStaleRunningSubmissions,
  recoverStaleRunningSubmission,
  enqueueSubmissionAttempt,
  finalizeQueuedAttemptAsInfraFailed
};

const runWithConcurrency = async (items, concurrency, handler) => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await handler(items[index]);
    }
  });

  await Promise.all(workers);
};

export const runStaleRecoveryScan = async ({
  config,
  maxInfraRetryAttempts,
  retryEnqueueBaseUrl,
  timestamp = new Date().toISOString(),
  logger = console,
  dependencies = defaultDependencies
}) => {
  const candidates = await dependencies.listStaleRunningSubmissions({
    timestamp,
    limit: config.batchSize
  });
  const summary = {
    scanned: candidates.length,
    requeued: 0,
    terminalized: 0,
    enqueueFailedFinalized: 0,
    noOp: 0,
    errors: 0
  };

  await runWithConcurrency(candidates, config.concurrency, async (candidate) => {
    try {
      const recovered = await dependencies.recoverStaleRunningSubmission({
        id: candidate.id,
        gradingAttempt: candidate.gradingAttempt,
        attemptIdempotencyKey: candidate.attemptIdempotencyKey,
        processingLeaseExpiresAt: candidate.processingLeaseExpiresAt,
        maxInfraRetryAttempts,
        timestamp,
        infraFailureResult: createInfraFailureResult('Worker処理中断後の再試行上限に到達しました。')
      });

      if (!recovered) {
        summary.noOp += 1;
        return;
      }

      if (recovered.action === 'infra_failed') {
        summary.terminalized += 1;
        logger.log('stale submission recovery completed', {
          submissionId: candidate.id,
          previousAttempt: recovered.previousAttempt,
          action: 'infra_failed',
          reason: 'lease_expired',
          timestamp
        });
        return;
      }

      const enqueued = await dependencies.enqueueSubmissionAttempt({
        submissionId: recovered.submission.id,
        gradingAttempt: recovered.submission.gradingAttempt,
        attemptIdempotencyKey: recovered.submission.attemptIdempotencyKey,
        runnerApiBaseUrl: retryEnqueueBaseUrl
      });

      if (enqueued) {
        summary.requeued += 1;
        logger.log('stale submission recovery completed', {
          submissionId: candidate.id,
          previousAttempt: recovered.previousAttempt,
          nextAttempt: recovered.submission.gradingAttempt,
          action: 'requeued',
          reason: 'lease_expired',
          timestamp
        });
        return;
      }

      const finalized = await dependencies.finalizeQueuedAttemptAsInfraFailed(
        recovered.submission.id,
        createInfraFailureResult('Stale submission回収後の再投入に失敗しました。'),
        {
          gradingAttempt: recovered.submission.gradingAttempt,
          attemptIdempotencyKey: recovered.submission.attemptIdempotencyKey,
          timestamp
        }
      );

      if (finalized) {
        summary.enqueueFailedFinalized += 1;
        logger.error('stale submission recovery enqueue failed', {
          submissionId: candidate.id,
          previousAttempt: recovered.previousAttempt,
          nextAttempt: recovered.submission.gradingAttempt,
          action: 'infra_failed',
          reason: 'enqueue_failed',
          timestamp
        });
      } else {
        summary.noOp += 1;
      }
    } catch (error) {
      summary.errors += 1;
      logger.error('stale submission recovery candidate failed', {
        submissionId: candidate.id,
        gradingAttempt: candidate.gradingAttempt,
        message: error.message,
        timestamp
      });
    }
  });

  return summary;
};

export const startStaleRecoveryScanner = ({
  config,
  maxInfraRetryAttempts,
  retryEnqueueBaseUrl,
  logger = console,
  dependencies = defaultDependencies
}) => {
  if (!config.enabled) {
    return {
      run: async () => ({ skipped: true, reason: 'disabled' }),
      stop: () => {}
    };
  }

  let scanRunning = false;
  const run = async (trigger = 'manual') => {
    if (scanRunning) {
      return { skipped: true, reason: 'scan_in_progress' };
    }

    scanRunning = true;
    try {
      const summary = await runStaleRecoveryScan({
        config,
        maxInfraRetryAttempts,
        retryEnqueueBaseUrl,
        logger,
        dependencies
      });
      if (summary.scanned > 0 || summary.errors > 0) {
        logger.log('stale submission recovery scan completed', { trigger, ...summary });
      }
      return summary;
    } catch (error) {
      logger.error('stale submission recovery scan failed', {
        trigger,
        message: error.message
      });
      return { error: true, message: error.message };
    } finally {
      scanRunning = false;
    }
  };

  void run('startup');
  const timer = setInterval(() => {
    void run('periodic');
  }, config.intervalMs);
  timer.unref?.();

  return {
    run,
    stop: () => clearInterval(timer)
  };
};
