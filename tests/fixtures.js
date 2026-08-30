const http = require('http');
const { test: base, expect } = require('@playwright/test');
const { buildPage } = require('./harness');

/**
 * `openLandingPage(options)` を提供するフィクスチャ。
 * ビルドしたHTMLを ephemeral な localhost サーバーから配信して開く。
 * Google Fonts への実アクセスは遮断し、テストをネットワークから切り離す。
 */
const test = base.extend({
  openLandingPage: async ({ page }, use) => {
    let server = null;

    const open = async (options = {}) => {
      const html = buildPage(options);
      server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
    };

    await use(open);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  },
});

module.exports = { test, expect };
