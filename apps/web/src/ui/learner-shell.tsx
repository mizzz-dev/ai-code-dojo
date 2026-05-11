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

const navItems = [
  { key: 'dashboard', label: 'ダッシュボード' },
  { key: 'challenge', label: '問題一覧' },
  { key: 'progress', label: '進捗' },
  { key: 'result', label: '提出結果' },
  { key: 'review', label: '復習' }
];

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-3)' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ margin: 'var(--spacing-1) 0 0', color: 'var(--color-text-muted)' }}>{description}</p>
    </div>
  );
}

function DashboardSection() {
  return (
    <Card>
      <SectionTitle title="ダッシュボード" description="今日やることがすぐ分かる、学習の起点です。" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-3)' }}>
        <StatCard label="連続学習日数" value="12日" trend="+2日" />
        <StatCard label="獲得XP" value="1,280" trend="今週 +120" />
        <StatCard label="可視テスト合格率" value="91%" />
      </div>
      <div style={{ marginTop: 'var(--spacing-3)', display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <ProgressRing progress={72} />
        <div style={{ display: 'grid', gap: 'var(--spacing-2)', maxWidth: 560 }}>
          <Badge label="次の一手" status="info" />
          <p style={{ margin: 0 }}>前回失敗した「配列の境界値」問題を1問復習すると、進捗が最も伸びます。</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <Button>復習を開始</Button>
            <Button variant="secondary">問題一覧を見る</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ChallengeFlowSection() {
  return (
    <Card>
      <SectionTitle title="問題一覧 → 問題詳細 → コード編集 / テスト実行" description="提出までの主要導線を新UIで統一しています。" />
      <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
        <Card tone="soft">
          <p style={{ marginTop: 0 }}><strong>問題一覧（tablet重視）</strong></p>
          <p>難易度・タグ・進捗で絞り込み。CTAは「問題を開く」を主導線に固定。</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty="intermediate" />
            <Badge label="配列" status="info" />
            <Badge label="未提出" status="warning" />
            <Button size="sm">問題を開く</Button>
          </div>
        </Card>
        <Card tone="soft">
          <p style={{ marginTop: 0 }}><strong>問題詳細（PC重視）</strong></p>
          <p>長文でも読みやすいように段落と補助情報を分離し、提出条件を先に提示。</p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 0 }}>表示テストと提出要件を先頭に置き、学習者が迷わない順序にしています。</p>
        </Card>
        <Card tone="soft">
          <p style={{ marginTop: 0 }}><strong>コード編集 / テスト実行（可読性優先）</strong></p>
          <p>装飾を最小化し、フォント・行間・結果表示を明確化。mobileは閲覧補助を優先。</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <Button>テスト実行</Button>
            <Button variant="secondary">提出する</Button>
          </div>
        </Card>
      </div>
    </Card>
  );
}

function ResultAndProgressSection() {
  return (
    <>
      <ResultSummaryCard title="提出結果" status="success" description="visible tests: 5/5 pass / hidden tests は採点待ち" />
      <ReviewPreviewCard title="レビューのプレビュー" excerpt="境界値ケースの抜け漏れがありました。配列が空の場合も考慮しましょう。" reviewedAt="2026-05-11" score="88/100" />
      <Card>
        <SectionTitle title="進捗" description="週間の成長を確認し、次の学習を判断しやすくします。" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-3)' }}>
          <StatCard label="今週の完了問題" value="8問" />
          <StatCard label="再挑戦予定" value="3問" />
          <StatCard label="レビュー待ち" value="1件" />
        </div>
      </Card>
    </>
  );
}

function StatusStatesSection() {
  return (
    <Card>
      <SectionTitle title="loading / empty / error" description="API応答が不安定でも画面が破綻しない状態設計です。" />
      <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
        <Card tone="soft"><Badge label="loading" status="info" /> <p>提出結果を取得しています…</p></Card>
        <Card tone="soft"><Badge label="empty" status="warning" /> <p>提出履歴はまだありません。最初の1問を解いてみましょう。</p></Card>
        <Card tone="soft"><Badge label="error" status="fail" /> <p>通信エラーが発生しました。時間をおいて再試行してください。</p><Button variant="secondary" size="sm">再試行</Button></Card>
      </div>
    </Card>
  );
}

export function LearnerAppShellPreview() {
  return (
    <PageContainer>
      <AppShell
        theme="learner"
        header={<TopHeader title="AI Code Dojo" actions={<Button variant="secondary" size="sm">プロフィール</Button>} />}
        sidebar={<Sidebar activeKey="dashboard" items={navItems} />}
        bottomTabs={<BottomTabBar activeKey="challenge" items={navItems} />}
        content={
          <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
            <DashboardSection />
            <ChallengeFlowSection />
            <ResultAndProgressSection />
            <StatusStatesSection />
            <MascotHintCard hint="Mascot / XP / streak は補助情報として、CTAの視認性を優先して配置しています。" />
          </div>
        }
      />
    </PageContainer>
  );
}
