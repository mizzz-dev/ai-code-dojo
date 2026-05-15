import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getChallengeBasePath } from '../../api/src/repositories/challenge-repository.mjs';
import { getSubmission, updateSubmission } from '../../api/src/repositories/submission-repository.mjs';
import { runJavaScriptChallenge, runJavaScriptChallengeViaIsolatedJob } from './services/js-runner.mjs';

const port = Number(process.env.WORKER_PORT ?? 8081);
const useIsolationPoc = process.env.RUNNER_ISOLATION_POC === '1';
const isProduction = process.env.NODE_ENV === 'production';

if (useIsolationPoc && isProduction) {
  throw new Error('RUNNER_ISOLATION_POC must not be enabled in production.');
}

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const processSubmission = async (submissionId) => {
  const submission = await getSubmission(submissionId);
  if (!submission) return;

  await updateSubmission(submissionId, { status: 'running' });

  try {
    const challengeBasePath = getChallengeBasePath(submission.challengeSlug);
    const challenge = await readJson(path.join(challengeBasePath, 'problem.json'));

    if (submission.language !== 'javascript') {
      await updateSubmission(submissionId, {
        status: 'failed',
        result: {
          status: 'failed',
          score: 0,
          durationMs: 0,
          logs: ['このMVPではJavaScriptのみ採点対応です。'],
          testResults: [],
          artifacts: []
        }
      });
      return;
    }

    const normalizedResult = useIsolationPoc
      ? await runJavaScriptChallengeViaIsolatedJob({
          challenge,
          challengeBasePath,
          code: submission.code
        })
      : await runJavaScriptChallenge({
          challenge,
          challengeBasePath,
          code: submission.code
        });

    await updateSubmission(submissionId, { status: 'completed', result: normalizedResult });
  } catch (error) {
    await updateSubmission(submissionId, {
      status: 'failed',
      result: {
        status: 'failed',
        score: 0,
        durationMs: 0,
        logs: [error.message],
        testResults: [],
        artifacts: []
      }
    });
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, service: 'worker' });
  }

  if (req.method === 'POST' && url.pathname === '/jobs') {
    const body = await parseBody(req);
    if (!body?.submissionId) {
      return sendJson(res, 400, { error: 'submissionId is required' });
    }

    setImmediate(() => {
      processSubmission(body.submissionId);
    });

    return sendJson(res, 202, { accepted: true, submissionId: body.submissionId });
  }

  return sendJson(res, 404, { error: 'not found' });
});

server.listen(port, () => {
  console.log(`worker listening on http://localhost:${port}`);
});
