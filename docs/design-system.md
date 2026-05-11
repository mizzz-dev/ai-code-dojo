# Design System（MVP初期）

## トークン定義
`packages/ui/src/tokens/tokens.css` で learner 向けテーマトークンを一元管理する。

- colors: canvas/elevated/surface/text/primary/accent/status
- gradients: brand/surface/success
- typography: family/size/weight
- spacing: 4px基準のスケール
- radius: sm/md/lg/xl/pill
- shadows: sm/md/lg
- z-index: base/header/sidebar/bottom-tab/overlay
- motion: duration(fast/base/slow) + easing(standard/emphasized)

## テーマ方針
- 学習者向けUIは `data-theme="learner"` で適用する。
- 管理画面は `theme="admin"` を入口に分離可能な設計とし、トークンの上書きポイントを確保する。
- カラー・余白・角丸・影の値はコンポーネント内で直書きせず、原則トークン経由で参照する。

## 共通コンポーネント利用ルール
- `variant` は見た目、`size` は寸法、`state`(active/disabled) は挙動の責務として分離する。
- `AppShell` は `header / sidebar / bottomTabs / content` を注入する構成コンポーネントとして利用する。
- `Sidebar` と `BottomTabBar` は同じナビ情報を利用できる props 形状にして、PC/Tablet/Mobile で使い回す。
- `MascotHintCard` は任意表示を前提にし、非表示でもレイアウトが崩れないようにする。

## 開発者向け確認導線
Storybook 未導入期間は `apps/web/src/ui/learner-shell.tsx` を基準のプレビュー導線として扱う。

