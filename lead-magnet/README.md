# リードマグネット:「隠れ栄養不足度セルフチェックリスト」

分子栄養学カウンセラー向けに作成した、リード獲得用の一式です。

## 中身

- `隠れ栄養不足度セルフチェックリスト.pdf` — 配布用PDF本体(全7ページ)
  - はじめに / 全30問チェックリスト(6カテゴリ) / 結果の見方・栄養素の傾向 / 個別カウンセリングへのCTA
- `build_pdf.py` — 上記PDFを生成するPythonスクリプト(reportlab使用)。文言や配色を変えたい場合はこのファイルを編集して再実行してください(`pip install reportlab` の上で `python3 build_pdf.py`)。
- `landing-page/index.html` — メール登録フォーム付きのランディングページ。訪問者が名前・メールアドレスを入力すると、その場でPDFがブラウザからダウンロードされます。

公開中のランディングページ(Artifact): https://claude.ai/code/artifact/43bd37b0-d8ee-4ad5-96e3-602f8bca3013
(claude.ai上では private 設定のため、共有するには共有メニューから公開設定にしてください)

## 公開前に差し替えが必要な箇所

PDF・LPともに、以下はプレースホルダーのままです。ご自身の情報に差し替えてください。

- 屋号・カウンセラー名(現在「分子栄養学カウンセリング」「分子栄養学カウンセラー」のまま)
- 個別カウンセリングの申込URL・メールアドレス・Instagram/LINE公式アカウント
- LPの「ABOUT COUNSELOR」欄のプロフィール文・写真(現在プレースホルダー画像)

## ご感想(フィードバック)ボタンについて

LPのフッターに「このページのご感想を送る」ボタンがあります。押すとダイアログが開き、
3段階の評価(役に立った / ふつう / 期待と違った)と自由記述のご感想を送信できます。
氏名・メールアドレスは送信されません。

**受け取るにはWebhookの設定が必要です。** `landing-page/index.html` 内の
`FEEDBACK_WEBHOOK_URL` が空のままだと、訪問者にはお礼が表示されますが、
内容はどこにも記録されません(送信先がないため)。ご意見を受け取りたい場合は、
`LEAD_WEBHOOK_URL` と同じ要領で受信URLを設定してください。送信される内容は
`rating`(評価) / `comment`(ご感想) / `source` / `ts`(送信日時)のJSONです。

## メールアドレスの自動収集について

`landing-page/index.html` 内の `LEAD_WEBHOOK_URL`(JavaScript内、`lead-form` の送信処理付近)に、
お使いのメール配信サービス(Googleフォーム、ConvertKit、Mailchimp、Zapier/MakeのWebhookなど)の
受信URLを設定すると、フォーム送信のたびに氏名・メールアドレスが自動送信されるようになります。
空のままでも、PDFのダウンロード自体は問題なく機能します。

## PDFの差し替え・更新

`build_pdf.py` を編集後に再生成したら、`landing-page/index.html` にも埋め込み直す必要があります
(PDFはBase64エンコードしてページ内に埋め込んでいるため)。埋め込み直す際は、生成した
`output.pdf` をBase64化し、`index.html` 内の `window.__LEAD_MAGNET_PDF_BASE64__` の値を置き換えてください。

## テスト

LPの動作(ご感想ボタン、リード獲得フォーム)はリポジトリ直下のテストで確認できます。

```bash
npm install     # 初回のみ
npx playwright install chromium   # 初回のみ(ブラウザの取得)
npm test
```

`index.html` を編集したら実行してください。
