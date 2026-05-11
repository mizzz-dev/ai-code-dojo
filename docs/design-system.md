# Design System（MVP初期）

## トークン定義
`packages/ui/src/tokens/tokens.css` でCSS Variablesとして管理する。

- color tokens: 背景/サーフェス/文字/primary/accent
- gradient tokens: hero, card
- spacing tokens: 4px基準
- radius tokens: sm/md/lg/pill
- shadow tokens: sm/md
- typography tokens: font family/size/weight
- status colors: success/warning/fail/info
- z-index tokens: base/header/sidebar/bottom-tab/overlay
- motion tokens: fast/base/slow + easing

## 実装ルール
- 値の直書き禁止。原則トークン経由。
- CTAは primary color を使用し視認性優先。
- コンポーネントは責務分離し、文言・レイアウト・状態表示を混在させない。
