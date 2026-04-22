import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const PROBLEMS_ROOT = path.resolve(process.cwd(), 'problems/examples');

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const toSummary = (problem) => ({
  slug: problem.metadata.slug,
  title: problem.metadata.title,
  difficulty: problem.metadata.difficulty,
  category: problem.metadata.category,
  supportedLanguages: problem.metadata.supportedLanguages
});

export const listChallenges = async () => {
  const dirs = await readdir(PROBLEMS_ROOT, { withFileTypes: true });
  const summaries = [];

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const problemPath = path.join(PROBLEMS_ROOT, dir.name, 'problem.json');
    const problem = await readJson(problemPath);
    summaries.push(toSummary(problem));
  }

  return summaries.sort((a, b) => a.slug.localeCompare(b.slug));
};

export const getChallengeBySlug = async (slug) => {
  const problemPath = path.join(PROBLEMS_ROOT, slug, 'problem.json');
  const problem = await readJson(problemPath);
  const starterFile = problem.starterCode.find((file) => !file.readonly);
  const starterCodePath = starterFile ? path.join(PROBLEMS_ROOT, slug, starterFile.path) : null;
  const starterCode = starterCodePath ? await readFile(starterCodePath, 'utf8') : '';

  return {
    ...problem,
    starterCodeContent: starterCode
  };
};

export const getChallengeBasePath = (slug) => path.join(PROBLEMS_ROOT, slug);
