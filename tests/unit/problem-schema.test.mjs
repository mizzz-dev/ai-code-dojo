import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const src = await readFile('packages/problem-schema/src/index.ts', 'utf8');

test('problem schema exports MVP language set', () => {
  assert.ok(src.includes('javascript'));
  assert.ok(src.includes('typescript'));
  assert.ok(src.includes('python'));
  assert.ok(src.includes('sql'));
  assert.ok(src.includes('html-css'));
});

test('problem schema has runtime validator for challenge loading', () => {
  assert.ok(src.includes('export const isProblemDefinition'));
  assert.ok(src.includes('visibleTests'));
  assert.ok(src.includes('hiddenTests'));
});
