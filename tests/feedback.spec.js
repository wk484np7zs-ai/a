const { test, expect } = require('./fixtures');

const openButton = (page) => page.getByRole('button', { name: 'このページのご感想を送る' });
const dialog = (page) => page.locator('#feedback-dialog');

test.describe('フィードバックボタン', () => {
  test('フッターにボタンが表示され、初期状態ではダイアログが閉じている', async ({ page, openLandingPage }) => {
    await openLandingPage();

    await expect(openButton(page)).toBeVisible();
    await expect(dialog(page)).toBeHidden();
  });

  test('ボタンを押すとフィードバックダイアログが開く', async ({ page, openLandingPage }) => {
    await openLandingPage();
    await openButton(page).click();

    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#feedback-title')).toHaveText('ご意見をお聞かせください');
    // 3つの評価肢がすべて未選択で並んでいる
    const ratings = page.locator('input[name="feedback-rating"]');
    await expect(ratings).toHaveCount(3);
    await expect(page.locator('input[name="feedback-rating"]:checked')).toHaveCount(0);
  });

  test('評価を選ばずに送信するとエラーになり、お礼画面には進まない', async ({ page, openLandingPage }) => {
    await openLandingPage();
    await openButton(page).click();
    await page.locator('#feedback-comment').fill('評価だけ選び忘れました');
    await page.locator('#feedback-submit').click();

    await expect(page.locator('#feedback-error')).toBeVisible();
    await expect(page.locator('#feedback-error')).toContainText('評価をひとつお選びください');
    await expect(page.locator('#feedback-success')).toBeHidden();
    await expect(page.locator('#feedback-form')).toBeVisible();
  });

  test('評価を選んで送信するとお礼が表示される', async ({ page, openLandingPage }) => {
    await openLandingPage();
    await openButton(page).click();
    await page.getByText('役に立った').click();
    await page.locator('#feedback-submit').click();

    await expect(page.locator('#feedback-success')).toBeVisible();
    await expect(page.locator('#feedback-success')).toContainText('ありがとうございました');
    await expect(page.locator('#feedback-form')).toBeHidden();
    await expect(page.locator('#feedback-error')).toBeHidden();
  });

  test('Webhookを設定すると、評価とコメントがPOSTされる', async ({ page, openLandingPage }) => {
    const WEBHOOK = 'https://feedback.example.test/hook';

    await openLandingPage({ feedbackWebhookUrl: WEBHOOK });

    const posted = page.waitForRequest(WEBHOOK);
    await page.route(WEBHOOK, (route) => route.fulfill({ status: 200, body: 'ok' }));

    await openButton(page).click();
    await page.getByText('期待と違った').click();
    await page.locator('#feedback-comment').fill('サプリの選び方をもっと知りたいです');
    await page.locator('#feedback-submit').click();

    const request = await posted;
    expect(request.method()).toBe('POST');

    const payload = JSON.parse(request.postData());
    expect(payload.rating).toBe('unhelpful');
    expect(payload.comment).toBe('サプリの選び方をもっと知りたいです');
    expect(payload.source).toBe('hidden-deficiency-checklist-lp');
    expect(Number.isNaN(Date.parse(payload.ts))).toBe(false);

    await expect(page.locator('#feedback-success')).toBeVisible();
  });

  test('Webhook未設定でも送信でエラーにならない', async ({ page, openLandingPage }) => {
    const requests = [];
    await openLandingPage();
    page.on('request', (req) => requests.push(req.url()));

    await openButton(page).click();
    await page.getByText('ふつう').click();
    await page.locator('#feedback-submit').click();

    await expect(page.locator('#feedback-success')).toBeVisible();
    // 送信先が未設定なので、外部への送信は発生しない
    expect(requests.filter((url) => !url.startsWith('http://127.0.0.1'))).toEqual([]);
  });

  test('閉じるボタンとEscapeキーでダイアログが閉じる', async ({ page, openLandingPage }) => {
    await openLandingPage();

    await openButton(page).click();
    await expect(dialog(page)).toBeVisible();
    await page.locator('#feedback-form [data-feedback-close]').click();
    await expect(dialog(page)).toBeHidden();

    await openButton(page).click();
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });

  test('送信後に開き直すと入力がリセットされている', async ({ page, openLandingPage }) => {
    await openLandingPage();

    await openButton(page).click();
    await page.getByText('役に立った').click();
    await page.locator('#feedback-comment').fill('とても参考になりました');
    await page.locator('#feedback-submit').click();
    await expect(page.locator('#feedback-success')).toBeVisible();
    await page.locator('#feedback-success [data-feedback-close]').click();

    await openButton(page).click();
    await expect(page.locator('#feedback-form')).toBeVisible();
    await expect(page.locator('#feedback-success')).toBeHidden();
    await expect(page.locator('#feedback-comment')).toHaveValue('');
    await expect(page.locator('input[name="feedback-rating"]:checked')).toHaveCount(0);
    await expect(page.locator('#feedback-submit')).toBeEnabled();
    await expect(page.locator('#feedback-submit')).toHaveText('送信する');
  });
});
