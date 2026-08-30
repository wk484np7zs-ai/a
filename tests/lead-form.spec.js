// フィードバック機能の追加でLPの主目的(PDF配布)を壊していないことの回帰テスト。
const { test, expect } = require('./fixtures');

test.describe('リード獲得フォーム', () => {
  test('メールアドレスが不正なときはエラーになり、ダウンロードは始まらない', async ({ page, openLandingPage }) => {
    await openLandingPage();

    await page.locator('#name').fill('山田 花子');
    await page.locator('#email').fill('not-an-email');
    await page.locator('#submit-btn').click();

    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#form-success')).toBeHidden();
  });

  test('正しく入力するとPDFがダウンロードされ、完了メッセージが表示される', async ({ page, openLandingPage }) => {
    await openLandingPage();

    const download = page.waitForEvent('download');
    await page.locator('#name').fill('山田 花子');
    await page.locator('#email').fill('hanako@example.com');
    await page.locator('#submit-btn').click();

    // Blob由来のダウンロードでは Chromium が download 属性のファイル名を
    // 返さないことがあるため、中身がPDFであることで確認する。
    const stream = await (await download).createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(Buffer.concat(chunks).subarray(0, 5).toString('latin1')).toBe('%PDF-');

    await expect(page.locator('#form-success')).toBeVisible();
    await expect(page.locator('#lead-form')).toBeHidden();
  });
});
