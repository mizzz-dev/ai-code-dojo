# Screen Spec（学習者向け基盤）

## App Shell
- TopHeader
- SidebarNavigation（Desktop/Tablet）
- BottomTabBar（Mobile）
- ContentLayout

## レスポンシブ
- Desktop: Sidebar + Main の2カラム
- Tablet: Sidebarを圧縮表示、情報密度優先
- Mobile: BottomTabBar中心、縦積み

## 再利用コンポーネント
Button / Card / Badge / Tabs / DifficultyBadge / StatCard / ProgressRing / ResultSummaryCard / MascotHintCard / SectionHeader / EmptyState / PageContainer


## 実画面への適用状況（Issue #16）
- 適用済みルート: `/`（challenge一覧）, `/challenges/:slug`（challenge詳細+提出）, `/submissions/:id`（提出結果）, `/progress`, `/dashboard`。
- preview (`apps/web/src/ui/learner-shell.tsx`) はUI参照用に維持し、実データ取得・送信・ポーリング責務は `apps/web/src/server.mjs` に集約する。
- loading / empty / error / success の状態文言は画面共通トーンで統一し、API障害時にも導線が途切れない。
- submission導線は既存の `POST /api/submissions` と `GET /api/submissions/:id` を継続利用し、Worker起点の採点フローを変更しない。
