import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const authModulePath = pathToFileURL(path.resolve('apps/api/src/auth.mjs')).href;

const loadAuthModule = async ({ adminPassword, learnerPassword }) => {
  if (adminPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = adminPassword;
  if (learnerPassword === undefined) delete process.env.LEARNER_PASSWORD;
  else process.env.LEARNER_PASSWORD = learnerPassword;
  return import(`${authModulePath}?t=${Date.now()}-${Math.random()}`);
};

test('環境変数あり: admin login 成功', async () => {
  const { login } = await loadAuthModule({ adminPassword: 'secure-admin', learnerPassword: 'secure-learner' });
  const auth = login('admin', 'secure-admin');
  assert.ok(auth);
  assert.equal(auth.user.role, 'admin');
});

test('環境変数あり: learner login 成功', async () => {
  const { login } = await loadAuthModule({ adminPassword: 'secure-admin', learnerPassword: 'secure-learner' });
  const auth = login('learner', 'secure-learner');
  assert.ok(auth);
  assert.equal(auth.user.role, 'learner');
});

test('環境変数なし: login 失敗', async () => {
  const { login } = await loadAuthModule({ adminPassword: undefined, learnerPassword: undefined });
  assert.equal(login('admin', 'admin1234'), null);
  assert.equal(login('learner', 'learner1234'), null);
});

test('環境変数なし: x-web-user 認証失敗', async () => {
  const { getUserFromRequest } = await loadAuthModule({ adminPassword: undefined, learnerPassword: undefined });
  const req = { headers: { 'x-web-user': 'learner:learner1234' } };
  assert.equal(getUserFromRequest(req), null);
});
