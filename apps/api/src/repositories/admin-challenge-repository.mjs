import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'apps/api/data');
const STORE_PATH = path.join(DATA_DIR, 'challenges-admin.json');

const now = () => new Date().toISOString();

const defaultStore = { challenges: [], challengeVersions: [] };

const ensureStore = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeFile(STORE_PATH, JSON.stringify(defaultStore, null, 2));
      return structuredClone(defaultStore);
    }
    throw error;
  }
};

const saveStore = async (store) => writeFile(STORE_PATH, JSON.stringify(store, null, 2));

export const listAdminChallenges = async () => (await ensureStore()).challenges;

export const getAdminChallengeById = async (id) => {
  const store = await ensureStore();
  const challenge = store.challenges.find((item) => item.id === id);
  if (!challenge) return null;
  const versions = store.challengeVersions.filter((v) => v.challengeId === id).sort((a, b) => b.version - a.version);
  return { ...challenge, versions };
};

export const createAdminChallenge = async (payload) => {
  const store = await ensureStore();
  if (store.challenges.some((item) => item.slug === payload.slug)) throw new Error('slug already exists');
  const challengeId = randomUUID();
  const versionId = randomUUID();
  const createdAt = now();
  store.challenges.push({ id: challengeId, slug: payload.slug, status: 'draft', currentVersionId: versionId, createdAt, updatedAt: createdAt });
  store.challengeVersions.push({ id: versionId, challengeId, version: 1, createdAt, ...payload.versionData });
  await saveStore(store);
  return { challengeId, versionId };
};

export const createAdminChallengeVersion = async (challengeId, versionData) => {
  const store = await ensureStore();
  const challenge = store.challenges.find((item) => item.id === challengeId);
  if (!challenge) return null;
  const current = store.challengeVersions.filter((v) => v.challengeId === challengeId);
  const version = current.length ? Math.max(...current.map((v) => v.version)) + 1 : 1;
  const id = randomUUID();
  store.challengeVersions.push({ id, challengeId, version, createdAt: now(), ...versionData });
  challenge.currentVersionId = id;
  challenge.updatedAt = now();
  await saveStore(store);
  return id;
};

export const setChallengePublishStatus = async (challengeId, status) => {
  const store = await ensureStore();
  const challenge = store.challenges.find((item) => item.id === challengeId);
  if (!challenge) return null;
  challenge.status = status;
  challenge.updatedAt = now();
  await saveStore(store);
  return challenge;
};

export const findPublishedChallengeBySlug = async (slug) => {
  const store = await ensureStore();
  const challenge = store.challenges.find((item) => item.slug === slug && item.status === 'published');
  if (!challenge) return null;
  const version = store.challengeVersions.find((item) => item.id === challenge.currentVersionId);
  return version ? { challenge, version } : null;
};
