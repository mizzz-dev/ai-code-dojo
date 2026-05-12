import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const startWeb = (port, apiBaseUrl) => spawn('node', ['apps/web/src/server.mjs'], {
  env: { ...process.env, WEB_PORT: String(port), API_BASE_URL: apiBaseUrl },
  stdio: 'ignore'
});

const waitUntilReady = async (url, retries = 40) => {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // noop
    }
    await sleep(100);
  }
  throw new Error(`server is not ready: ${url}`);
};

const postLogin = (port, username = 'learner', password = 'pw') => fetch(`http://localhost:${port}/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ username, password }).toString(),
  redirect: 'manual'
});

const createApiMock = (handler) => {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://localhost:${address.port}`
      });
    });
  });
};

test('login成功時は role に応じてリダイレクトされる', async (t) => {
  const apiMock = await createApiMock(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/auth/login') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ user: { role: 'admin' } }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const webPort = 23110;
  const web = startWeb(webPort, apiMock.baseUrl);

  t.after(() => {
    web.kill('SIGKILL');
    apiMock.server.close();
  });

  await waitUntilReady(`http://localhost:${webPort}/login`);

  const res = await postLogin(webPort, 'admin', 'secure-admin');
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/admin/challenges');
});

test('login API が 401 を返した場合は認証失敗メッセージを返す', async (t) => {
  const apiMock = await createApiMock(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/auth/login') {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const webPort = 23111;
  const web = startWeb(webPort, apiMock.baseUrl);

  t.after(() => {
    web.kill('SIGKILL');
    apiMock.server.close();
  });

  await waitUntilReady(`http://localhost:${webPort}/login`);

  const res = await postLogin(webPort, 'learner', 'bad');
  const html = await res.text();

  assert.equal(res.status, 401);
  assert.match(html, /認証に失敗しました。ユーザー名またはパスワードを確認してください。/);
});

test('login API 到達不能時は 502 と再試行メッセージを返しプロセスが継続する', async (t) => {
  const webPort = 23112;
  const web = startWeb(webPort, 'http://localhost:29999');

  t.after(() => {
    web.kill('SIGKILL');
  });

  await waitUntilReady(`http://localhost:${webPort}/login`);

  const first = await postLogin(webPort, 'learner', 'pw');
  const firstHtml = await first.text();
  assert.equal(first.status, 502);
  assert.match(firstHtml, /認証サービスに接続できませんでした。時間をおいて再試行してください。/);

  const health = await fetch(`http://localhost:${webPort}/login`);
  assert.equal(health.status, 200);
});
