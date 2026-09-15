# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## リポジトリの概要

コードベースというよりは **成果物リポジトリ**。独立した2つの成果物が入っている。

1. `lead-magnet/` — 分子栄養学カウンセラー向けのリードマグネット(見込み客獲得用の無料配布物)一式
2. `wifi-logger/` — トレーニング室のタブレット用 Wi-Fi切断ロガー(単一HTML)

両者に依存関係はない。テストだけが `tests/` で同居している(同じ Artifact スケルトンを共有するため)。

### `lead-magnet/`

| ファイル | 役割 |
| --- | --- |
| `lead-magnet/build_pdf.py` | 配布PDFを生成する reportlab スクリプト(単一ファイル、トップレベル実行) |
| `lead-magnet/隠れ栄養不足度セルフチェックリスト.pdf` | 生成済みの配布用PDF(A4・全7ページ) |
| `lead-magnet/landing-page/index.html` | メール登録フォーム付きLP。Artifact として公開する前提の単一HTML |
| `lead-magnet/README.md` | エンドユーザー(カウンセラー本人)向けの手順書 |
| `tests/` | Playwrightテスト(リポジトリ直下の `npm test` で実行) |

### `wifi-logger/`

| ファイル | 役割 |
| --- | --- |
| `wifi-logger/index.html` | ロガー本体。Artifact として公開する前提の単一HTML |
| `wifi-logger/README.md` | 現場(タブレットを操作する人)向けの手順書 |

文言・UIはすべて日本語。コミットメッセージも日本語。

## PDFのビルド

```bash
pip install reportlab      # この環境には未インストール
python3 lead-magnet/build_pdf.py
```

- 出力は **`output.pdf`(カレントディレクトリ)** 固定。リポジトリ内の
  `隠れ栄養不足度セルフチェックリスト.pdf` に差し替えるにはリネームが必要。
- 日本語フォントは reportlab 同梱の CID フォント(`HeiseiKakuGo-W5` = 見出し、
  `HeiseiMin-W3` = 本文)を使用。外部フォントファイルは不要。
- `BaseDocTemplate` + 2つの `PageTemplate`(`Cover` / `Normal`)構成。表紙だけ背景を敷き、
  2ページ目以降にヘッダー罫線とページ番号を描画する。ページを追加する場合は
  `NextPageTemplate` / `PageBreak` の並びを崩さないこと。
- ブランドカラー(`NAVY` / `GREEN` / `GOLD` / `CREAM`)と `BRAND` / `AUTHOR` は
  ファイル冒頭の定数。配色や屋号を変えるときはここだけを触る。

## ランディングページ (`landing-page/index.html`)

Artifact として公開されることを前提にした構造なので、通常のHTMLファイルと違う点がある。

- **`<!doctype>` / `<html>` / `<head>` / `<body>` タグを持たない。** `<title>` と `<style>` から
  始まる本文のみ。公開時にスケルトンで包まれるため、これらを追加してはいけない。
- **ダウンロード機能は Artifact の `downloads` capability に依存する。**
  `deliverPdf()` はまず `window.claude.use("downloads")` を試し、失敗したら
  Blob + `<a download>` にフォールバックする。Artifact のビューアはページ発の
  ダウンロードをブロックするため、**publish 時に `downloads` capability を宣言しないと
  実質的に機能しない**(`artifact-capabilities` skill を参照)。
- 外部リソースは Google Fonts のみ。それ以外はすべてインライン/data URI。
- 配色トークンは `:root` / `@media (prefers-color-scheme: dark)` / `:root[data-theme="dark"]`
  の3箇所に定義されている。色を足すときは3箇所すべてを更新すること。

### ご感想(フィードバック)ダイアログ

フッターの「このページのご感想を送る」ボタンが、ネイティブの `<dialog>`(`#feedback-dialog`)を
`showModal()` で開く。Escapeキー・背景クリック・`[data-feedback-close]` のボタンで閉じる。
送信は評価ラジオ(`feedback-rating`)が必須、コメントは任意。送信先は `FEEDBACK_WEBHOOK_URL`
(既定は空文字)への best-effort な `no-cors` POST で、`LEAD_WEBHOOK_URL` と同じ書き方をしている。

注意: `FEEDBACK_WEBHOOK_URL` が空のままだと、訪問者にはお礼が表示される一方で内容は
どこにも残らない。この挙動を変える(送信先未設定時にボタン自体を隠すなど)場合は、
`tests/feedback.spec.js` の期待値もあわせて更新すること。

選択中の評価は `.feedback-option:has(input:checked)` で表現している。ラジオ自体は
`.visually-hidden` で隠しているだけなので、キーボード操作とスクリーンリーダーは通常どおり動く。

### PDFとプレビュー画像の埋め込み(重要)

`index.html` は PDF 本体とプレビュー画像を base64 で自前に抱えている:

- `window.__LEAD_MAGNET_PDF_BASE64__` — 配布PDFそのもの(現状 約20,000文字 = 15KB)
- `window.__LEAD_MAGNET_PREVIEWS__` — PDF冒頭 **4ページ分** のJPEGプレビュー配列

**`build_pdf.py` を編集してPDFを再生成したら、この2つを必ず貼り直すこと。**
貼り直さないと、LPからは古いPDFが配布され続ける(見た目には気づけない)。

```bash
base64 -w0 output.pdf     # __LEAD_MAGNET_PDF_BASE64__ に貼る値
```

プレビュー画像はPDFをページ画像に変換して作るが、`pdftoppm` / ImageMagick は
この環境に入っていない。レイアウトを変えた場合のみ作り直せばよく、
文言の微修正なら既存のプレビューを流用して構わない。

## 未確定のプレースホルダー

PDF・LPの両方に、公開前に差し替えが必要な箇所が残っている。勝手に具体名を
創作せず、プレースホルダーのままにするかユーザーに確認すること。

- 屋号「分子栄養学カウンセリング」/ 氏名「分子栄養学カウンセラー」
- 申込URL・メールアドレス・Instagram / LINE公式アカウント(PDF最終ページの CTA、LPの申込導線)
- LP「ABOUT COUNSELOR」のプロフィール文と写真(現在はプレースホルダー画像)
- `LEAD_WEBHOOK_URL`(空文字。設定するとフォーム送信時に氏名・メールを `no-cors` POST する)
- `FEEDBACK_WEBHOOK_URL`(空文字。**設定しないとご感想が記録されない**)

## Wi-Fi切断ロガー (`wifi-logger/index.html`)

LPと同じく **Artifact 前提の単一HTML**。`<!doctype>` / `<html>` / `<head>` / `<body>` を持たない。

- **外部リソースをひとつも読み込まない。** Wi-Fiが切れる現場で使う道具なので、Google Fonts も使わず
  端末内蔵の和文ゴシックだけで組んでいる。ここに外部依存を足さないこと。
- **配色は記録紙(ストリップチャート)の一つの世界に寄せており、ダークテーマを持たない。**
  夜間は減光レイヤー(`#dimLayer`)が担当する。意図的な単一テーマなので、
  `prefers-color-scheme` のブロックを足す前にこの前提を確認すること。
- **CSV保存は Artifact の `downloads` capability に依存する。** `saveCsv()` はまず
  `window.claude.use("downloads")` で得た `save()` を使い、失敗したときだけ Blob + `<a download>` に
  フォールバックする。**publish時に `capabilities: {downloads: true}` を宣言しないとビューア内で保存が効かない。**
- **疎通確認はビューアの CSP を前提に組んである(`probe()`)。** Artifact のビューアは外部ホストへの
  `fetch` / 画像 / メディアをすべて止め、`<script>` だけを cdnjs / jsDelivr 等の限られた CDN から通す。
  そのため既定の監視先は cdnjs と jsDelivr の小さな JS(js-cookie 3.0.5)で、`.js` の URL は `<script>` 読み込み、
  それ以外は `fetch(no-cors)` → 画像の順に試し、届いた方式を `state.methodByUrl` に URL ごとに覚える。
  **既定の監視先を画像や favicon に戻さないこと**(初版でそれをやって「接続テストが×」になった)。
  `loadConfig()` は初版の既定値 `google.com/favicon.ico` が保存されていたら捨てる。
  no-cors の fetch は 404 でも resolve するが、疎通の有無を見るのが目的なのでこれで正しい。
- `tests/harness.js` の `buildWifiPage()` はこの CSP を `<meta http-equiv>` で再現する(`VIEWER_CSP`)。
  ロガーのテストは必ずこの条件で通すこと。LP の skeleton には被せていない(LP の webhook POST が対象外になるため)。

### 記録の保存(重要)

記録は `localStorage` に数秒ごと保存される(セッション: `wifi-logger.session.v1`、
設定: `wifi-logger.config.v1`)。終日動かすタブレットで、リロードや電池切れで記録が消えないための要。

- 保存形式は `encode()` / `decode()` の配列圧縮。**キーの順番を変えたら `v` を上げること。**
- 容量が尽きたら波形(`samples`)を 3000 → 600 → 0 と切り詰め、切断記録(`events`)を最後まで守る。
- 起動時に前回セッションが見つかると復元バナーが出る。`破棄` を押すまで消えない。
  `続きから再開` では、開いたままの切断を最後の確認時刻で閉じ、途切れていた区間を「計測中断」として足す。

### やってはいけないこと

- **自動でCSVをダウンロードさせない。** `downloads` capability は毎回ビューアの確認を求めるため、
  無人のタブレットでは保存されない。自動保存は localStorage、ファイル書き出しは手動、という分担を崩さないこと。
- 監視中に監視先(`#targets`)を編集可能にしないこと。記録とCSVの監視先がずれる。

## テスト

```bash
npm install                        # 初回のみ
npx playwright install chromium    # 初回のみ(ブラウザの取得)
npm test                           # = playwright test
npx playwright test tests/feedback.spec.js   # 単一ファイル
```

- `@playwright/test` は **1.56.0 に固定**している。この開発環境に事前インストール済みの
  Chromium(ビルド 1194)と対応するバージョンで、ずらすとブラウザを取り直す必要が出る。
- `tests/harness.js` が `index.html` を **Artifact のスケルトンで包んでから** 配信する。
  index.html 単体はブラウザで直接開いても正しい姿にならないため、テストは必ずこれを経由すること。
- `tests/fixtures.js` の `openLandingPage()` が、ページを ephemeral な localhost サーバーから開く。
  `about:blank` ではなく実オリジンから配信するのは、Blob ダウンロードと `fetch` を本番と
  同じ条件にするため。Google Fonts へのアクセスは遮断してあり、テストはネットワークに依存しない。
- `openLandingPage({ feedbackWebhookUrl })` は `index.html` 内の
  `var FEEDBACK_WEBHOOK_URL = "";` を文字列置換で差し替える。この宣言の書き方を変えると
  harness が例外を投げて教えてくれる。
- `tests/lead-form.spec.js` はPDF配布(このLPの本来の目的)の回帰テスト。LPを触ったら必ず通すこと。
- `tests/wifi-logger.spec.js` はロガーの回帰テスト。監視開始 → 切断検知 → 復旧 → CSV → 再起動後の復元までを
  一続きで確かめる。`openWifiLogger()` が返す `setOnline(bool)` で回線の切断/復旧を再現する。
  監視間隔の下限が5秒のため、実時間で30秒ほどかかる(`test.setTimeout(90000)`)。

## 健康関連コンテンツについての注意

このPDFは体調のセルフチェックを扱う。診断・治療効果を断定する表現や、
医療行為と誤認される文言は避け、既存の「〜かもしれません」「〜の目安」といった
トーンを維持すること。
