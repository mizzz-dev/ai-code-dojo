import http from 'node:http';
import { listChallenges, getChallengeBySlug } from './repositories/challenge-repository.mjs';
import { createSubmissionAndEnqueue, getSubmissionResult } from './services/submission-service.mjs';

const port = Number(process.env.API_PORT ?? 8080);

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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, service: 'api' });
    }

    if (req.method === 'GET' && url.pathname === '/api/challenges') {
      const items = await listChallenges();
      return sendJson(res, 200, { challenges: items });
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/challenges/')) {
      const slug = url.pathname.replace('/api/challenges/', '');
      const challenge = await getChallengeBySlug(slug);
      return sendJson(res, 200, { challenge });
    }

    if (req.method === 'POST' && url.pathname === '/api/submissions') {
      const body = await parseBody(req);
      const result = await createSubmissionAndEnqueue(body);
      if (result.error) return sendJson(res, result.statusCode, { error: result.error });
      return sendJson(res, result.statusCode, result.data);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/submissions/')) {
      const id = url.pathname.replace('/api/submissions/', '');
      const result = await getSubmissionResult(id);
      if (result.error) return sendJson(res, result.statusCode, { error: result.error });
      return sendJson(res, result.statusCode, result.data);
    }

    return sendJson(res, 404, { error: 'not found' });
  } catch (error) {
    return sendJson(res, 500, { error: `internal error: ${error.message}` });
  }
});

server.listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});
