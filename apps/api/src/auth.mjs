const SESSION_COOKIE = 'dojo_session';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const sessions = new Map();

const users = {
  admin: { id: 'u-admin', username: 'admin', role: 'admin', password: process.env.ADMIN_PASSWORD },
  learner: { id: 'u-learner', username: 'learner', role: 'learner', password: process.env.LEARNER_PASSWORD }
};

const isUserCredentialEnabled = (user) => typeof user?.password === 'string' && user.password.length > 0;

const parseCookies = (raw = '') => Object.fromEntries(raw.split(';').map((v) => v.trim()).filter(Boolean).map((pair) => {
  const idx = pair.indexOf('=');
  if (idx < 0) return [pair, ''];
  return [pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1))];
}));

const now = () => Date.now();

const parseHeaderUser = (raw = '') => {
  const [username, password] = raw.split(':');
  if (!username || !password) return null;
  const user = users[username];
  if (!isUserCredentialEnabled(user)) return null;
  if (!user || user.password !== password) return null;
  return { id: user.id, username: user.username, role: user.role };
};

const createSession = (user) => {
  const token = crypto.randomUUID();
  sessions.set(token, { user, expiresAt: now() + SESSION_TTL_MS });
  return token;
};

import crypto from 'node:crypto';

export const setSessionCookie = (res, token) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`);
};

export const clearSessionCookie = (res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
};

export const login = (username, password) => {
  const user = users[username];
  if (!isUserCredentialEnabled(user)) return null;
  if (!user || user.password !== password) return null;
  const token = createSession({ id: user.id, username: user.username, role: user.role });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
};

export const getUserFromRequest = (req) => {
  const headerUser = parseHeaderUser(req.headers['x-web-user']);
  if (headerUser) return headerUser;
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const found = sessions.get(token);
  if (!found) return null;
  if (found.expiresAt < now()) {
    sessions.delete(token);
    return null;
  }
  return found.user;
};
