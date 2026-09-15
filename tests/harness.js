// Artifact として公開されたときの姿を、テスト用に再現するためのヘルパー。
const fs = require('fs');
const path = require('path');

const PAGE_PATH = path.join(__dirname, '..', 'lead-magnet', 'landing-page', 'index.html');
const WIFI_PAGE_PATH = path.join(__dirname, '..', 'wifi-logger', 'index.html');

// index.html は <!doctype>/<html>/<head>/<body> を持たない(Artifact が publish 時に
// 包むため)。テストでも同じスケルトンを被せて、本番と同じ条件で検証する。
const SKELETON_HEAD = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{color-scheme:light dark}
body{margin:0;background:#faf9f5;font-family:system-ui,-apple-system,sans-serif;font-size:14px}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
`;
const SKELETON_FOOT = `
</body>
</html>
`;

// index.html 内の設定ポイント。テストから差し替えるため、宣言そのものを狙い撃ちする。
const FEEDBACK_WEBHOOK_DECL = 'var FEEDBACK_WEBHOOK_URL = "";';

/**
 * index.html を読み、Artifact のスケルトンで包んだ完全なHTMLを返す。
 * feedbackWebhookUrl を渡すと、空文字のプレースホルダーをその値に差し替える。
 */
function buildPage(options = {}) {
  let body = fs.readFileSync(PAGE_PATH, 'utf8');

  if (options.feedbackWebhookUrl) {
    if (!body.includes(FEEDBACK_WEBHOOK_DECL)) {
      throw new Error(
        `index.html に \`${FEEDBACK_WEBHOOK_DECL}\` が見つかりません。` +
        'フィードバックWebhookの設定箇所が変わった可能性があります。tests/harness.js を更新してください。'
      );
    }
    body = body.replace(
      FEEDBACK_WEBHOOK_DECL,
      `var FEEDBACK_WEBHOOK_URL = ${JSON.stringify(options.feedbackWebhookUrl)};`
    );
  }

  return SKELETON_HEAD + body + SKELETON_FOOT;
}

// Artifact のビューアが課す CSP の近似。外部ホストへの fetch / 画像 / メディアは止まり、
// <script> は限られた CDN からだけ通る。ロガーの疎通確認はこの条件で動かなければ意味がない。
const VIEWER_CSP = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://cdn.tailwindcss.com https://code.jquery.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
].join('; ');

/**
 * Wi-Fi切断ロガーを、同じ Artifact スケルトンで包んで返す。
 * 差し替えるプレースホルダーは持たない代わりに、ビューア相当の CSP を meta で被せる。
 */
function buildWifiPage() {
  const head = SKELETON_HEAD.replace(
    '<meta charset="utf-8">',
    `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${VIEWER_CSP}">`
  );
  return head + fs.readFileSync(WIFI_PAGE_PATH, 'utf8') + SKELETON_FOOT;
}

module.exports = { buildPage, buildWifiPage, PAGE_PATH, WIFI_PAGE_PATH, FEEDBACK_WEBHOOK_DECL, VIEWER_CSP };
