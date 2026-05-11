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

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const navLinks = [
  ['/', '問題一覧'],
  ['/progress', '進捗'],
  ['/dashboard', 'ダッシュボード']
];

const renderLayout = ({ title, activePath, content }) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} | AI Code Dojo</title>
<style>
  :root { color-scheme: light; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f8ff; color: #1f2430; margin: 0; }
  .app { max-width: 1080px; margin: 0 auto; padding: 16px; }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .brand { font-weight: 700; font-size: 20px; }
  .nav { display: flex; gap: 8px; flex-wrap: wrap; }
  .nav a { text-decoration: none; color: #344054; border: 1px solid #d0d5dd; border-radius: 999px; padding: 6px 12px; font-size: 14px; }
  .nav a.active { background: #2656f6; border-color: #2656f6; color: #fff; }
  .card { background: #fff; border: 1px solid #e4e7ec; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .muted { color: #667085; }
  .cta { display: inline-block; background: #2656f6; color: white; padding: 8px 12px; border-radius: 8px; text-decoration: none; border: 0; cursor: pointer; }
  .secondary { background: #fff; color: #344054; border: 1px solid #d0d5dd; }
  .badge { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 12px; margin-right: 6px; }
  .ok { background: #e7f8ee; color: #067647; }
  .warn { background: #fff4e6; color: #b54708; }
  .fail { background: #fee4e2; color: #b42318; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; border-bottom: 1px solid #eaecf0; padding: 10px 8px; }
  textarea { width: 100%; min-height: 280px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
</style>
</head>
<body>
  <main class="app">
    <header class="header">
      <div class="brand">AI Code Dojo</div>
      <nav class="nav">${navLinks.map(([href, label]) => `<a class="${href === activePath ? 'active' : ''}" href="${href}">${label}</a>`).join('')}</nav>
    </header>
    ${content}
  </main>
</body>
</html>`;

const renderStateCard = (state, message) => `<section class="card"><span class="badge ${state}">${state}</span><p>${escapeHtml(message)}</p></section>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/dashboard') {
    return sendHtml(res, 200, renderLayout({
      title: 'ダッシュボード',
      activePath: '/dashboard',
      content: `<section class="card"><h1>ダッシュボード</h1><p class="muted">学習導線のハブです。次に解く問題や直近の提出結果を確認できます。</p><p><a class="cta" href="/">問題一覧へ</a></p></section>`
    }));
  }

  if (req.method === 'GET' && url.pathname === '/progress') {
    return sendHtml(res, 200, renderLayout({
      title: '進捗',
      activePath: '/progress',
      content: `<section class="card"><h1>進捗</h1><p class="muted">MVP段階のため、進捗は提出結果画面で確認してください。</p><p><a class="cta secondary" href="/">提出へ進む</a></p></section>`
    }));
  }

  if (req.method === 'GET' && url.pathname === '/') {
    try {
      const response = await fetch(`${apiBaseUrl}/api/challenges`);
      if (!response.ok) {
        return sendHtml(res, 502, renderLayout({ title: '問題一覧', activePath: '/', content: renderStateCard('fail', '問題一覧の取得に失敗しました。時間をおいて再試行してください。') }));
      }
      const data = await response.json();
      const challenges = Array.isArray(data?.challenges) ? data.challenges : [];
      if (challenges.length === 0) {
        return sendHtml(res, 200, renderLayout({ title: '問題一覧', activePath: '/', content: renderStateCard('warn', '公開中の問題はまだありません。') }));
      }

      const rows = challenges.map((challenge) => `<tr>
        <td><strong>${escapeHtml(challenge.title)}</strong><br /><span class="muted">${escapeHtml(challenge.slug)}</span></td>
        <td>${escapeHtml(challenge.difficulty)}</td>
        <td>${escapeHtml(challenge.category)}</td>
        <td>${escapeHtml((challenge.supportedLanguages ?? []).join(', '))}</td>
        <td><a class="cta" href="/challenges/${encodeURIComponent(challenge.slug)}">問題を開く</a></td>
      </tr>`).join('');

      return sendHtml(res, 200, renderLayout({
        title: '問題一覧',
        activePath: '/',
        content: `<section class="card"><h1>問題一覧</h1><p class="muted">難易度や言語を確認して、1問ずつ確実に進めましょう。</p><table><tr><th>問題</th><th>難易度</th><th>カテゴリ</th><th>対応言語</th><th></th></tr>${rows}</table></section>`
      }));
    } catch {
      return sendHtml(res, 502, renderLayout({ title: '問題一覧', activePath: '/', content: renderStateCard('fail', 'API通信エラーが発生しました。') }));
    }
  }

  if (req.method === 'GET' && url.pathname.startsWith('/challenges/')) {
    const slug = decodeURIComponent(url.pathname.replace('/challenges/', ''));
    try {
      const response = await fetch(`${apiBaseUrl}/api/challenges/${slug}`);
      if (response.status === 404) {
        return sendHtml(res, 404, renderLayout({ title: '問題詳細', activePath: '/', content: renderStateCard('warn', '問題が見つかりません。') }));
      }
      if (!response.ok) {
        return sendHtml(res, 502, renderLayout({ title: '問題詳細', activePath: '/', content: renderStateCard('fail', '問題詳細の取得に失敗しました。') }));
      }
      const { challenge } = await response.json();
      return sendHtml(res, 200, renderLayout({
        title: challenge.metadata.title,
        activePath: '/',
        content: `<section class="card"><h1>${escapeHtml(challenge.metadata.title)}</h1>
        <p><span class="badge ok">${escapeHtml(challenge.metadata.difficulty)}</span><span class="badge warn">${escapeHtml(challenge.metadata.type)}</span></p>
        <p><strong>編集対象:</strong> ${escapeHtml(challenge.starterCode.find((file) => !file.readonly)?.path ?? 'N/A')}</p>
        <p class="muted">${escapeHtml(challenge.statement.background)}</p>
        <p><strong>課題:</strong> ${escapeHtml(challenge.statement.issue)}</p>
        <h3>acceptance criteria</h3><ul>${challenge.statement.acceptanceCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        <form method="POST" action="/submit">
          <input type="hidden" name="challengeSlug" value="${escapeHtml(challenge.metadata.slug)}" />
          <input type="hidden" name="language" value="${escapeHtml(challenge.metadata.supportedLanguages[0])}" />
          <textarea name="code">${escapeHtml(challenge.starterCodeContent)}</textarea>
          <p><button class="cta" type="submit">提出する</button> <a class="cta secondary" href="/">一覧へ戻る</a></p>
        </form></section>`
      }));
    } catch {
      return sendHtml(res, 502, renderLayout({ title: '問題詳細', activePath: '/', content: renderStateCard('fail', 'API通信エラーが発生しました。') }));
    }
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
    if (response.status === 404) {
      return sendHtml(res, 404, renderLayout({ title: '提出結果', activePath: '/progress', content: renderStateCard('warn', '提出結果が見つかりません。') }));
    }
    const submission = await response.json();

    if (!submission.result) {
      return sendHtml(res, 200, renderLayout({ title: '提出結果', activePath: '/progress', content: `${renderStateCard('ok', '採点中です。1秒後に自動更新します。')}<meta http-equiv="refresh" content="1" />` }));
    }

    const visiblePass = submission.result.visibleTests.every((test) => test.passed);
    return sendHtml(
      res,
      200,
      renderLayout({
        title: '提出結果',
        activePath: '/progress',
        content: `<section class="card"><h1>提出結果</h1>
        <p><span class="badge ${visiblePass ? 'ok' : 'fail'}">${visiblePass ? 'success' : 'fail'}</span> visible tests ${submission.result.visibleTests.filter((test) => test.passed).length}/${submission.result.visibleTests.length}</p>
        <p><strong>実行時間:</strong> ${submission.result.durationMs}ms</p>
        <h3>visible tests</h3><ul>${submission.result.visibleTests.map((test) => `<li>${escapeHtml(test.testId)}: ${test.passed ? 'pass' : 'fail'} (${test.durationMs}ms)</li>`).join('')}</ul>
        <h3>hidden tests</h3><p>passed ${submission.result.hiddenTests.passedCount}/${submission.result.hiddenTests.total}</p>
        <h3>ログ</h3><pre>${escapeHtml((submission.result.logs ?? []).join('\n\n'))}</pre>
        <p><a class="cta secondary" href="/progress">進捗へ</a></p></section>`
      })
    );
  }

  return sendHtml(res, 404, renderLayout({ title: 'Not Found', activePath: '/', content: '<section class="card"><h1>Not Found</h1></section>' }));
});

server.listen(port, () => {
  console.log(`web listening on http://localhost:${port}`);
});
