import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const SUBMISSIONS_PATH = path.join(DATA_DIR, 'submissions.json');

const ensureStore = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(SUBMISSIONS_PATH, 'utf8');
  } catch {
    await writeFile(SUBMISSIONS_PATH, '[]', 'utf8');
  }
};

const loadStore = async () => {
  await ensureStore();
  return JSON.parse(await readFile(SUBMISSIONS_PATH, 'utf8'));
};

const saveStore = async (submissions) => {
  await writeFile(SUBMISSIONS_PATH, JSON.stringify(submissions, null, 2), 'utf8');
};

export const createSubmission = async (input) => {
  const submissions = await loadStore();
  const newSubmission = {
    id: crypto.randomUUID(),
    challengeSlug: input.challengeSlug,
    language: input.language,
    code: input.code,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null
  };

  submissions.push(newSubmission);
  await saveStore(submissions);
  return newSubmission;
};

export const getSubmission = async (id) => {
  const submissions = await loadStore();
  return submissions.find((submission) => submission.id === id) ?? null;
};

export const updateSubmission = async (id, patch) => {
  const submissions = await loadStore();
  const index = submissions.findIndex((submission) => submission.id === id);
  if (index < 0) return null;

  submissions[index] = {
    ...submissions[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  await saveStore(submissions);
  return submissions[index];
};
