const http = require('http');
const { test: base, expect } = require('@playwright/test');
const { buildPage, buildWifiPage } = require('./harness');

/**
 * ビルド済みHTMLを ephemeral な localhost サーバーから配信して開く。
 * `about:blank` ではなく実オリジンから配信するのは、Blob ダウンロードと fetch を
 * 本番と同じ条件に置くため。
 */
function serveHtml(page, html) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', async () => {
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      resolve(server);
    });
  });
}

/**
 * `openLandingPage(options)` と `openWifiLogger(options)` を提供するフィクスチャ。
 * どちらも外部ネットワークを遮断し、テストをネットワークから切り離す。
 */
const test = base.extend({
  openLandingPage: async ({ page }, use) => {
    let server = null;

    const open = async (options = {}) => {
      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
      server = await serveHtml(page, buildPage(options));
    };

    await use(open);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  },

  /**
   * ロガーを開く。`online` で監視先の応答を切り替えられる(既定は疎通あり)。
   * 返り値の `setOnline(bool)` で、テスト中に回線の切断/復旧を再現する。
   */
  openWifiLogger: async ({ page }, use) => {
    let server = null;
    let online = true;

    const open = async (options = {}) => {
      online = options.online !== false;

      // 監視先は実在の CDN なので、テストでは必ず横取りする。
      // CSP に弾かれた要求はここまで来ない(ブラウザが発行前に止める)。
      await page.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/, (route) => {
        if (!online) return route.abort('failed');
        return route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: '/* probe */',
        });
      });
      // 既定以外の監視先(画像など)を試すテスト用。CSP が正しく効いていれば要求は届かない。
      await page.route(/www\.google\.com/, (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'image/gif',
          body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        });
      });

      server = await serveHtml(page, buildWifiPage());

      if (options.seedSession) {
        await page.evaluate((s) => {
          localStorage.setItem('wifi-logger.session.v1', JSON.stringify(s));
        }, options.seedSession);
        await page.reload();
      }

      return {
        setOnline: (value) => {
          online = value;
        },
      };
    };

    await use(open);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  },
});

module.exports = { test, expect };
