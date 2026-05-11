import {
  AppShell,
  Badge,
  BottomTabBar,
  Button,
  Card,
  DifficultyBadge,
  MascotHintCard,
  PageContainer,
  ProgressRing,
  ResultSummaryCard,
  ReviewPreviewCard,
  Sidebar,
  StatCard,
  TopHeader
} from '@ai-code-dojo/ui/src/index.js';

export function LearnerAppShellPreview() {
  return (
    <PageContainer>
      <AppShell
        theme="learner"
        header={<TopHeader title="AI Code Dojo" actions={<Button variant="secondary" size="sm">プロフィール</Button>} />}
        sidebar={<Sidebar activeKey="dashboard" items={[{ key: 'dashboard', label: 'ダッシュボード' }, { key: 'challenge', label: '問題' }, { key: 'review', label: '復習' }]} />}
        bottomTabs={<BottomTabBar activeKey="home" items={[{ key: 'home', label: 'ホーム' }, { key: 'challenge', label: '問題' }, { key: 'result', label: '結果' }]} />}
        content={<div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-3)' }}>
            <StatCard label="連続学習日数" value="12日" trend="+2日" />
            <StatCard label="可視テスト合格率" value="91%" />
            <Card><DifficultyBadge difficulty="intermediate" /></Card>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
            <ProgressRing progress={72} />
            <div><Badge label="長文サンプル" status="info" /><p>日本語の長い説明文が入る場合でも、学習者向けテーマで視認性を保ちつつ折り返されることを確認するための文面です。</p><Button>次の問題に進む</Button><Button variant="ghost" disabled>準備中</Button></div>
          </div>
          <ResultSummaryCard title="前回の提出" status="success" description="visible tests: 5/5 pass" />
          <ReviewPreviewCard title="レビューのプレビュー" excerpt="境界値ケースの抜け漏れがありました。配列が空の場合も考慮しましょう。" reviewedAt="2026-05-11" score="88/100" />
          <MascotHintCard hint="hidden tests を意識して境界値ケースも確認しましょう。" />
        </div>}
      />
    </PageContainer>
  );
}
