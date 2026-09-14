// Wi-Fi切断ロガーの回帰テスト。
// このアプリの本来の目的は「切断を取りこぼさず記録して CSV に出す」ことなので、
// 監視 → 切断検知 → 復旧 → CSV → 再起動後の復元 までを一続きで確かめる。
const fs = require('fs');
const { test, expect } = require('./fixtures');

// 監視間隔を最短(5秒)にして、テストを現実的な長さに収める。
async function useFastInterval(page) {
  await page.locator('#settings summary').click();
  await page.fill('#interval', '5');
  await page.fill('#timeout', '3');
  await page.fill('#threshold', '2');
}

test.describe('Wi-Fi切断ロガー', () => {
  test.setTimeout(90000);

  test('監視を開始すると接続中になり、チェック回数が増える', async ({ page, openWifiLogger }) => {
    await openWifiLogger();
    await useFastInterval(page);

    await expect(page.locator('#stateWord')).toHaveText('停止中');
    await page.click('#btnRun');

    await expect(page.locator('#stateWord')).toHaveText('接続中', { timeout: 20000 });
    await expect(page.locator('#btnRun')).toHaveText('監視を停止');
    await expect.poll(
      async () => Number(await page.locator('#sChecks').textContent()),
      { timeout: 25000 }
    ).toBeGreaterThanOrEqual(2);

    // 監視中に監視先を書き換えられてしまうと、記録とCSVの監視先がずれる。
    await expect(page.locator('#targets')).toBeDisabled();
  });

  test('連続失敗で切断を記録し、復旧すると復旧時刻が入る', async ({ page, openWifiLogger }) => {
    const net = await openWifiLogger();
    await useFastInterval(page);
    await page.click('#btnRun');
    await expect(page.locator('#stateWord')).toHaveText('接続中', { timeout: 20000 });

    net.setOnline(false);
    await expect(page.locator('#stateWord')).toHaveText('切断中', { timeout: 30000 });
    await expect(page.locator('#sEvents')).toHaveText('1');

    const row = page.locator('#eventsBody tr').first();
    await expect(row).toHaveClass(/live/);
    await expect(row.locator('td').nth(2)).toHaveText('継続中');
    await expect(row.locator('td').nth(5)).toHaveText('切断');

    net.setOnline(true);
    await expect(page.locator('#stateWord')).toHaveText('接続中', { timeout: 30000 });
    // 復旧時刻が hh:mm:ss で埋まり、行が「継続中」でなくなる。
    await expect(row.locator('td').nth(2)).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
    await expect(page.locator('#sEvents')).toHaveText('1');
  });

  test('在室人数を入力すると、そのままCSVに出力される', async ({ page, openWifiLogger }) => {
    const net = await openWifiLogger();
    await useFastInterval(page);
    await page.click('#btnRun');
    await expect(page.locator('#stateWord')).toHaveText('接続中', { timeout: 20000 });

    net.setOnline(false);
    await expect(page.locator('#stateWord')).toHaveText('切断中', { timeout: 30000 });

    await page.locator('#eventsBody .people').first().fill('12');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btnCsvEvents'),
    ]);
    expect(download.suggestedFilename()).toMatch(/^wifi_events_\d{8}_\d{4}\.csv$/);

    const csv = fs.readFileSync(await download.path(), 'utf8');
    expect(csv.charCodeAt(0)).toBe(0xfeff); // Excel 用の BOM
    const [header, first] = csv.replace(/^﻿/, '').split('\r\n');
    expect(header).toBe('発生日,切断開始,復旧時刻,停止時間(分),在室人数,種別,監視先');
    expect(first.split(',')[4]).toBe('12');
    expect(first.split(',')[5]).toBe('切断');
  });

  test('画面を閉じても記録は残り、続きから再開できる', async ({ page, openWifiLogger }) => {
    const net = await openWifiLogger();
    await useFastInterval(page);
    await page.click('#btnRun');
    await expect(page.locator('#stateWord')).toHaveText('接続中', { timeout: 20000 });

    net.setOnline(false);
    await expect(page.locator('#stateWord')).toHaveText('切断中', { timeout: 30000 });
    net.setOnline(true);
    await expect(page.locator('#stateWord')).toHaveText('接続中', { timeout: 30000 });

    const startedAt = await page.locator('#sStart').textContent();
    await page.click('#btnRun'); // 監視を停止(= 端末内に保存された状態)
    await expect(page.locator('#stateWord')).toHaveText('停止中');

    await page.reload();

    // 前回の記録が見つかり、破棄するまで消えない。
    await expect(page.locator('#resumeNote')).toBeVisible();
    await expect(page.locator('#resumeText')).toContainText('切断 1 件');

    await page.click('#btnResume');
    await expect(page.locator('#resumeNote')).toBeHidden();
    await expect(page.locator('#sStart')).toHaveText(startedAt);
    await expect(page.locator('#sEvents')).toHaveText('1');
    // 記録が途切れていた区間は「計測中断」ではなく、1分未満なので足されない。
    await expect(page.locator('#eventsBody tr')).toHaveCount(1);
  });

  test('前回の記録は破棄を選ぶまで消えない', async ({ page, openWifiLogger }) => {
    const start = Date.now() - 3600000;
    await openWifiLogger({
      seedSession: {
        v: 1,
        savedAt: Date.now() - 60000,
        startedAt: start,
        checks: 42,
        targets: ['https://www.google.com/favicon.ico'],
        events: [['outage', start + 600000, start + 900000, '8']],
        samples: [],
      },
    });

    await expect(page.locator('#resumeNote')).toBeVisible();
    await expect(page.locator('#resumeText')).toContainText('チェック 42 回');
    await expect(page.locator('#resumeText')).toContainText('切断 1 件');

    page.once('dialog', (d) => d.accept());
    await page.click('#btnResumeDrop');
    await expect(page.locator('#resumeNote')).toBeHidden();

    await page.reload();
    await expect(page.locator('#resumeNote')).toBeHidden();
  });
});
