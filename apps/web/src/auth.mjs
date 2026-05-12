const WEB_SESSION_COOKIE = 'dojo_web_session';

const parseCookies = (raw = '') => Object.fromEntries(raw.split(';').map((v) => v.trim()).filter(Boolean).map((pair) => {
  const idx = pair.indexOf('=');
  if (idx < 0) return [pair, ''];
  return [pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1))];
}));

export const readWebSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[WEB_SESSION_COOKIE];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const buildWebSessionCookie = (user) => `${WEB_SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`;

export const clearWebSessionCookie = () => `${WEB_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
