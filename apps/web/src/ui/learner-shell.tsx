import {
  AppShell,
  BottomTabBar,
  MascotHintCard,
  PageContainer,
  ResultSummaryCard,
  SectionHeader,
  SidebarNavigation,
  TopHeader
} from '@ai-code-dojo/ui/src/index.js';

export function LearnerAppShellPreview() {
  return (
    <PageContainer>
      <AppShell
        header={<TopHeader title="AI Code Dojo" />}
        sidebar={<SidebarNavigation items={[{ key: 'dashboard', label: 'ダッシュボード' }, { key: 'challenge', label: '問題' }, { key: 'review', label: '復習' }]} />}
        bottomTabs={<BottomTabBar items={[{ key: 'home', label: 'ホーム' }, { key: 'challenge', label: '問題' }, { key: 'result', label: '結果' }]} />}
        content={<><SectionHeader title="学習者ホーム" description="挑戦状況を確認して次の問題に進みましょう" /><ResultSummaryCard title="前回の提出" status="success" description="visible tests: 5/5 pass" /><MascotHintCard hint="hidden tests を意識して境界値ケースも確認しましょう。" /></>}
      />
    </PageContainer>
  );
}
