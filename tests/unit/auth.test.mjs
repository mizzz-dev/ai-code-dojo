import test from 'node:test';
import assert from 'node:assert/strict';
import { login, getUserFromRequest } from '../../apps/api/src/auth.mjs';

test('admin login and role resolution', () => {
  const auth = login('admin', process.env.ADMIN_PASSWORD ?? 'admin1234');
  assert.ok(auth);
  assert.equal(auth.user.role, 'admin');
});

test('x-web-user header with learner resolves learner role', () => {
  const req = { headers: { 'x-web-user': `learner:${process.env.LEARNER_PASSWORD ?? 'learner1234'}` } };
  const user = getUserFromRequest(req);
  assert.equal(user.role, 'learner');
});
