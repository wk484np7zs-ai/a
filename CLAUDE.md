# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## リポジトリの概要

分子栄養学カウンセラー向けのリードマグネット(見込み客獲得用の無料配布物)一式。
コードベースというよりは **成果物リポジトリ** で、`lead-magnet/` 以下がすべて。

| ファイル | 役割 |
| --- | --- |
| `lead-magnet/build_pdf.py` | 配布PDFを生成する reportlab スクリプト(単一ファイル、トップレベル実行) |
| `lead-magnet/隠れ栄養不足度セルフチェックリスト.pdf` | 生成済みの配布用PDF(A4・全7ページ) |
| `lead-magnet/landing-page/index.html` | メール登録フォーム付きLP。Artifact として公開する前提の単一HTML |
| `lead-magnet/README.md` | エンドユーザー(カウンセラー本人)向けの手順書 |

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

## 健康関連コンテンツについての注意

このPDFは体調のセルフチェックを扱う。診断・治療効果を断定する表現や、
医療行為と誤認される文言は避け、既存の「〜かもしれません」「〜の目安」といった
トーンを維持すること。
