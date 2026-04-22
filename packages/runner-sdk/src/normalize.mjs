export const normalizeRunnerResult = ({ visible, hidden, artifacts, durationMs, logs = [] }) => {
  const testResults = [...visible, ...hidden];
  const passedCount = testResults.filter((test) => test.passed).length;
  const score = testResults.length === 0 ? 0 : Math.round((passedCount / testResults.length) * 100);

  return {
    status: 'completed',
    score,
    logs,
    durationMs,
    testResults,
    artifacts
  };
};
