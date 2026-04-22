import http from 'node:http';

const port = Number(process.env.WEB_PORT ?? 3000);
const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:8080';

const sendHtml = (res, statusCode, html) => {
  res.writeHead(statusCode, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
};

const parseFormBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
};

const escapeHtml = (value = '') => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    const response = await fetch(`${apiBaseUrl}/api/challenges`);
    const data = await response.json();
    const rows = data.challenges
      .map((challenge) => `<tr><td><a href="/challenges/${challenge.slug}">${challenge.title}</a></td><td>${challenge.difficulty}</td><td>${challenge.category}</td><td>${challenge.supportedLanguages.join(', ')}</td></tr>`)
      .join('');

    return sendHtml(
      res,
      200,
      `<h1>ai-code-dojo 問題一覧</h1><table border="1"><tr><th>タイトル</th><th>難易度</th><th>カテゴリ</th><th>対応言語</th></tr>${rows}</table>`
    );
  }

  if (req.method === 'GET' && url.pathname.startsWith('/challenges/')) {
    const slug = url.pathname.replace('/challenges/', '');
    const response = await fetch(`${apiBaseUrl}/api/challenges/${slug}`);
    const { challenge } = await response.json();

    return sendHtml(
      res,
      200,
      `<h1>${challenge.metadata.title}</h1>
      <p><strong>編集対象:</strong> ${challenge.starterCode.find((file) => !file.readonly)?.path ?? 'N/A'}</p>
      <p><strong>背景:</strong> ${escapeHtml(challenge.statement.background)}</p>
      <p><strong>issue:</strong> ${escapeHtml(challenge.statement.issue)}</p>
      <h3>acceptance criteria</h3><ul>${challenge.statement.acceptanceCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <h3>out of scope</h3><ul>${challenge.statement.outOfScope.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <form method="POST" action="/submit">
        <input type="hidden" name="challengeSlug" value="${challenge.metadata.slug}" />
        <input type="hidden" name="language" value="${challenge.metadata.supportedLanguages[0]}" />
        <textarea name="code" rows="20" cols="100">${escapeHtml(challenge.starterCodeContent)}</textarea>
        <br /><button type="submit">提出する</button>
      </form>
      <p><a href="/">一覧へ戻る</a></p>`
    );
  }

  if (req.method === 'POST' && url.pathname === '/submit') {
    const form = await parseFormBody(req);
    const payload = {
      challengeSlug: form.get('challengeSlug'),
      language: form.get('language'),
      code: form.get('code')
    };

    const response = await fetch(`${apiBaseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const submission = await response.json();

    res.writeHead(302, { location: `/submissions/${submission.id}` });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname.startsWith('/submissions/')) {
    const id = url.pathname.replace('/submissions/', '');
    const response = await fetch(`${apiBaseUrl}/api/submissions/${id}`);
    const submission = await response.json();

    if (!submission.result) {
      return sendHtml(res, 200, `<h1>採点中...</h1><meta http-equiv="refresh" content="1" /><p>submission: ${id}</p>`);
    }

    return sendHtml(
      res,
      200,
      `<h1>提出結果</h1>
      <p>status: ${submission.status}</p>
      <p>pass/fail: ${submission.result.visibleTests.every((test) => test.passed) ? 'pass' : 'fail'}</p>
      <p>実行時間(ms): ${submission.result.durationMs}</p>
      <h3>visible tests</h3>
      <ul>${submission.result.visibleTests.map((test) => `<li>${test.testId}: ${test.passed ? 'pass' : 'fail'} (${test.durationMs}ms)</li>`).join('')}</ul>
      <h3>hidden tests</h3>
      <p>passed ${submission.result.hiddenTests.passedCount}/${submission.result.hiddenTests.total}</p>
      <h3>ログ</h3>
      <pre>${escapeHtml(submission.result.logs.join('\n\n'))}</pre>
      <p><a href="/">一覧へ戻る</a></p>`
    );
  }

  return sendHtml(res, 404, '<h1>Not Found</h1>');
});

server.listen(port, () => {
  console.log(`web listening on http://localhost:${port}`);
});
