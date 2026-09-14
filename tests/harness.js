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

/**
 * Wi-Fi切断ロガーを、同じ Artifact スケルトンで包んで返す。
 * こちらは差し替えるプレースホルダーを持たないので、包むだけ。
 */
function buildWifiPage() {
  return SKELETON_HEAD + fs.readFileSync(WIFI_PAGE_PATH, 'utf8') + SKELETON_FOOT;
}

module.exports = { buildPage, buildWifiPage, PAGE_PATH, WIFI_PAGE_PATH, FEEDBACK_WEBHOOK_DECL };
