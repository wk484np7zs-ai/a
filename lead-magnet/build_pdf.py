# -*- coding: utf-8 -*-
"""隠れ栄養不足度セルフチェックリスト - リードマグネットPDF生成"""
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Frame, PageTemplate, BaseDocTemplate, NextPageTemplate
)
from reportlab.platypus.flowables import Flowable

pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))  # ゴシック(見出し用)
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))      # 明朝(本文用)

# ブランドカラー
NAVY = colors.HexColor('#1F3A34')
GREEN = colors.HexColor('#4C7A63')
GOLD = colors.HexColor('#C9A24B')
CREAM = colors.HexColor('#FAF7F0')
GRAY = colors.HexColor('#5C5C5C')
LIGHTLINE = colors.HexColor('#DDD6C4')

PAGE_W, PAGE_H = A4

styles = {
    'CoverTitle': ParagraphStyle('CoverTitle', fontName='HeiseiKakuGo-W5', fontSize=30,
                                  leading=40, textColor=NAVY, alignment=TA_CENTER),
    'CoverSub': ParagraphStyle('CoverSub', fontName='HeiseiKakuGo-W5', fontSize=13,
                                leading=20, textColor=GREEN, alignment=TA_CENTER),
    'CoverFoot': ParagraphStyle('CoverFoot', fontName='HeiseiMin-W3', fontSize=10.5,
                                 leading=16, textColor=GRAY, alignment=TA_CENTER),
    'H1': ParagraphStyle('H1', fontName='HeiseiKakuGo-W5', fontSize=17,
                          leading=24, textColor=NAVY, spaceBefore=4, spaceAfter=10),
    'H2': ParagraphStyle('H2', fontName='HeiseiKakuGo-W5', fontSize=12.5,
                          leading=18, textColor=GREEN, spaceBefore=14, spaceAfter=6),
    'Body': ParagraphStyle('Body', fontName='HeiseiMin-W3', fontSize=10.3,
                            leading=17, textColor=colors.HexColor('#2B2B2B')),
}
styles['BodyCenter'] = ParagraphStyle('BodyCenter', fontName='HeiseiMin-W3', fontSize=10.3,
                                       leading=17, textColor=colors.HexColor('#2B2B2B'), alignment=TA_CENTER)
styles['Check'] = ParagraphStyle('Check', fontName='HeiseiMin-W3', fontSize=10.3,
                                  leading=16, textColor=colors.HexColor('#2B2B2B'))
styles['Small'] = ParagraphStyle('Small', fontName='HeiseiMin-W3', fontSize=9,
                                  leading=14, textColor=GRAY)
styles['ScoreLabel'] = ParagraphStyle('ScoreLabel', fontName='HeiseiKakuGo-W5', fontSize=11,
                                       leading=16, textColor=NAVY)
styles['PageFoot'] = ParagraphStyle('PageFoot', fontName='HeiseiMin-W3', fontSize=8,
                                     leading=10, textColor=colors.HexColor('#9A9A9A'), alignment=TA_CENTER)

BRAND = "分子栄養学カウンセリング"  # プレースホルダー: 実際の屋号に差し替え
AUTHOR = "分子栄養学カウンセラー"    # プレースホルダー: 実際の氏名/資格に差し替え


def on_page(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setStrokeColor(LIGHTLINE)
        canvas.setLineWidth(0.6)
        canvas.line(20*mm, PAGE_H - 16*mm, PAGE_W - 20*mm, PAGE_H - 16*mm)
        canvas.setFont('HeiseiMin-W3', 8.5)
        canvas.setFillColor(GRAY)
        canvas.drawString(20*mm, PAGE_H - 13*mm, "隠れ栄養不足度セルフチェックリスト")
        canvas.drawRightString(PAGE_W - 20*mm, PAGE_H - 13*mm, BRAND)
        canvas.setFillColor(colors.HexColor('#9A9A9A'))
        canvas.drawCentredString(PAGE_W / 2, 12*mm, f"— {doc.page} —")
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 10*mm, PAGE_W, 10*mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 10.6*mm, PAGE_W, 0.6*mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, 0, PAGE_W, 6*mm, fill=1, stroke=0)
    canvas.restoreState()


def section_header(text, sub=None):
    flow = [Paragraph(text, styles['H1'])]
    if sub:
        flow.append(Paragraph(sub, styles['Body']))
    flow.append(Spacer(1, 6))
    flow.append(HRFlowable(width='100%', thickness=0.7, color=LIGHTLINE, spaceAfter=10))
    return flow


def checklist_table(items):
    data = []
    for label in items:
        box = "□"
        data.append([box, Paragraph(label, styles['Check'])])
    t = Table(data, colWidths=[9*mm, 150*mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'HeiseiKakuGo-W5'),
        ('FONTSIZE', (0, 0), (0, -1), 13),
        ('TEXTCOLOR', (0, 0), (0, -1), GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, -2), 0.4, LIGHTLINE),
    ]))
    return t


doc = BaseDocTemplate(
    'output.pdf', pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=18*mm,
)
frame_cover = Frame(0, 0, PAGE_W, PAGE_H, id='cover', leftPadding=25*mm, rightPadding=25*mm,
                     topPadding=55*mm, bottomPadding=25*mm)
frame_normal = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
doc.addPageTemplates([
    PageTemplate(id='Cover', frames=[frame_cover], onPage=cover_page),
    PageTemplate(id='Normal', frames=[frame_normal], onPage=on_page),
])

story = []

# ---------- Cover ----------
story.append(Paragraph("隠れ栄養不足度<br/>セルフチェックリスト", styles['CoverTitle']))
story.append(Spacer(1, 14))
story.append(Paragraph("その不調、気合いや年齢のせいではなく、<br/>「栄養」が原因かもしれません", styles['CoverSub']))
story.append(Spacer(1, 40))
story.append(HRFlowable(width='30%', thickness=1.2, color=GOLD, hAlign='CENTER', spaceAfter=40))
story.append(Paragraph("30の質問に答えるだけで、<br/>あなたのカラダが今どの栄養素を求めているかがわかります。", styles['CoverFoot']))
story.append(Spacer(1, 90))
story.append(Paragraph(f"{AUTHOR}<br/>{BRAND}", styles['CoverFoot']))
story.append(NextPageTemplate('Normal'))
story.append(PageBreak())

# ---------- p2: はじめに ----------
story += section_header("はじめに — その不調、栄養からのサインです")
story.append(Paragraph(
    "「病院で検査しても異常なしと言われるのに、なんだか調子が悪い」<br/>"
    "「疲れが取れない」「イライラしやすい」「肌や髪の調子が悪い」——<br/>"
    "そんな“なんとなく不調”の背景には、血液検査の基準値だけでは見えない"
    "栄養素の偏りが隠れていることが少なくありません。", styles['Body']))
story.append(Spacer(1, 10))
story.append(Paragraph(
    "分子栄養学は、細胞・血液レベルで「今のカラダに何が足りていないか」を読み解き、"
    "食事とサプリメントで整えていく考え方です。このチェックリストは、"
    "医療機関の診断に代わるものではありませんが、ご自身の生活を振り返り、"
    "「もしかして」に気づくための最初の一歩として作成しました。", styles['Body']))
story.append(Spacer(1, 10))
story.append(Paragraph(
    "6つのカテゴリ・全30項目です。ここ1〜2ヶ月の体調を思い浮かべながら、"
    "当てはまるものに チェックを入れてください。", styles['Body']))
story.append(Spacer(1, 14))
story.append(Table([[Paragraph(
    "※ このチェックリストは医学的診断を目的としたものではありません。"
    "気になる症状が続く場合は医療機関を受診してください。", styles['Small'])]],
    colWidths=[170*mm],
    style=TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('BOX', (0, 0), (-1, -1), 0.5, LIGHTLINE),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ])))
story.append(PageBreak())

# ---------- p3-4: チェックリスト ----------
categories = [
    ("① エネルギー・疲労感", [
        "階段を上ると息切れ・動悸がする",
        "朝起きるのがつらく、寝ても疲れが取れない",
        "夕方になると急に集中力が切れる",
        "立ちくらみ・めまいを感じることがある",
        "顔色が青白い、または爪が割れやすい",
    ]),
    ("② メンタル・気分の波", [
        "理由もなくイライラしたり、涙もろくなる",
        "不安感が強く、心配事が頭から離れない",
        "やる気が出ず、何をするのも億劫に感じる",
        "生理前に気分の落ち込みが強くなる（女性）",
        "甘いものやカフェインが手放せない",
    ]),
    ("③ 肌・髪・爪のトラブル", [
        "肌荒れ・ニキビ・乾燥が繰り返し起こる",
        "髪が細くなった、抜け毛が増えた",
        "爪が薄く割れやすい、縦線が目立つ",
        "口内炎や口角炎ができやすい",
        "傷や虫刺されの治りが遅い",
    ]),
    ("④ 消化・腸のコンディション", [
        "お腹が張る、ガスがたまりやすい",
        "便秘と下痢を繰り返す",
        "食後に胃もたれや眠気が強く出る",
        "脂っこい食事の後に調子を崩しやすい",
        "食後もすぐにお腹が空く／間食が多い",
    ]),
    ("⑤ 睡眠・自律神経", [
        "寝つきが悪い、夜中に目が覚める",
        "朝すっきり起きられない",
        "手足の冷えが強い",
        "肩こり・首こりが慢性的にある",
        "こむら返り（足がつる）が起きやすい",
    ]),
    ("⑥ 免疫・その他", [
        "風邪をひきやすい、治りにくい",
        "季節の変わり目に体調を崩しやすい",
        "アレルギー症状（鼻炎・皮膚など）がある",
        "筋肉量が落ちてきたと感じる",
        "ダイエットしてもなかなか体重が落ちない",
    ]),
]

for i, (title, items) in enumerate(categories):
    story.append(Paragraph(title, styles['H2']))
    story.append(checklist_table(items))
    story.append(Spacer(1, 4))
    if i in (1, 3):
        story.append(PageBreak())

story.append(PageBreak())

# ---------- p5: 結果の見方 ----------
story += section_header("チェックの結果を見てみましょう", "チェックがついた合計数で、今の栄養状態の目安がわかります。")
score_data = [
    [Paragraph("<b>0〜4個</b>", styles['ScoreLabel']), Paragraph("良好ゾーン：大きな偏りは少なそうです。今の生活習慣を維持しましょう。", styles['Body'])],
    [Paragraph("<b>5〜10個</b>", styles['ScoreLabel']), Paragraph("要注意ゾーン：特定の栄養素が不足し始めているサインかもしれません。食事の見直しがおすすめです。", styles['Body'])],
    [Paragraph("<b>11〜18個</b>", styles['ScoreLabel']), Paragraph("栄養不足リスク高ゾーン：複数の栄養素が不足している可能性があります。専門家への相談をおすすめします。", styles['Body'])],
    [Paragraph("<b>19個以上</b>", styles['ScoreLabel']), Paragraph("要専門サポートゾーン：カラダが発しているサインが多く出ています。早めに分子栄養学の視点でのカウンセリングを受けることをおすすめします。", styles['Body'])],
]
t = Table(score_data, colWidths=[32*mm, 128*mm])
t.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
    ('LINEBELOW', (0, 0), (-1, -2), 0.4, LIGHTLINE),
]))
story.append(t)
story.append(Spacer(1, 16))
story.append(Paragraph("カテゴリ別に見えてくる、不足しやすい栄養素の傾向", styles['H2']))
tendency_data = [
    ["① エネルギー・疲労感", "鉄・ビタミンB群・たんぱく質"],
    ["② メンタル・気分の波", "鉄・マグネシウム・ビタミンB6"],
    ["③ 肌・髪・爪のトラブル", "たんぱく質・亜鉛・ビタミンB群"],
    ["④ 消化・腸のコンディション", "消化酵素・食物繊維・腸内環境"],
    ["⑤ 睡眠・自律神経", "マグネシウム・ビタミンD・カルシウム"],
    ["⑥ 免疫・その他", "ビタミンD・亜鉛・たんぱく質"],
]
t2 = Table(tendency_data, colWidths=[70*mm, 90*mm])
t2.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, -1), 'HeiseiMin-W3'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (0, -1), NAVY),
    ('FONTNAME', (0, 0), (0, -1), 'HeiseiKakuGo-W5'),
    ('TEXTCOLOR', (1, 0), (1, -1), GRAY),
    ('BACKGROUND', (0, 0), (-1, -1), colors.white),
    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, CREAM]),
    ('TOPPADDING', (0, 0), (-1, -1), 7),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('BOX', (0, 0), (-1, -1), 0.5, LIGHTLINE),
    ('INNERGRID', (0, 0), (-1, -1), 0.4, LIGHTLINE),
]))
story.append(t2)
story.append(PageBreak())

# ---------- p6: 次の一歩 ----------
story += section_header("チェックが多かったあなたへ — 次の一歩")
story.append(Paragraph(
    "チェックの数が多かった方も、少なかった方も、まずは今の自分のカラダの声に気づけたことが"
    "大切な一歩です。分子栄養学では、血液検査データを「病気か健康か」ではなく"
    "「その人にとって最適な状態か」という視点で読み解き、食事・サプリメント・生活習慣を"
    "一人ひとりに合わせて設計していきます。", styles['Body']))
story.append(Spacer(1, 10))
story.append(Paragraph("こんな方は、ぜひ個別カウンセリングをご検討ください", styles['H2']))
for line in [
    "チェックが11個以上あり、何から手をつければいいかわからない",
    "血液検査の結果を分子栄養学の視点で詳しく読み解いてほしい",
    "自己流のサプリメントで結果が出ず、正しい摂り方を知りたい",
    "食事改善を、自分の体質に合わせて具体的に組み立てたい",
]:
    story.append(Paragraph(f"・{line}", styles['Body']))
story.append(Spacer(1, 18))
story.append(Table([[Paragraph(
    "<b>個別カウンセリングのご案内</b><br/>"
    "このチェックリストを片手に、あなたの体調・食生活を一緒に振り返るご相談を承っています。<br/>"
    "お申し込み・お問い合わせは下記よりお気軽にどうぞ。<br/><br/>"
    "公式サイト／お申し込みフォーム：〔URLをここに記載〕<br/>"
    "メール：〔メールアドレスをここに記載〕<br/>"
    "Instagram／LINE公式：〔アカウント名をここに記載〕",
    ParagraphStyle('CTA', fontName='HeiseiMin-W3', fontSize=10.5, leading=18,
                    textColor=colors.white))]],
    colWidths=[170*mm],
    style=TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ])))
story.append(Spacer(1, 20))
story.append(Paragraph(
    "最後までお読みいただき、ありがとうございました。<br/>"
    "あなたのカラダが本来持っている力を取り戻すお手伝いができれば幸いです。",
    styles['Body']))
story.append(Spacer(1, 24))
story.append(Paragraph(f"{AUTHOR}　{BRAND}", styles['Small']))

doc.build(story)
print("PDF generated: output.pdf")
