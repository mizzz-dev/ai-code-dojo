import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmissionInput } from '../../apps/api/src/services/submission-service.mjs';

test('submission validation: valid payload', () => {
  const valid = validateSubmissionInput({
    challengeSlug: 'js-bugfix-add',
    language: 'javascript',
    code: 'export function sum(nums){return 0;}'
  });

  assert.equal(valid, true);
});

test('submission validation: invalid payload', () => {
  const invalid = validateSubmissionInput({ challengeSlug: '', language: 'javascript', code: '' });
  assert.equal(invalid, false);
});
