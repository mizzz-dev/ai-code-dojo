import type { ReactNode } from 'react';

export type Status = 'success' | 'warning' | 'fail' | 'info';

export function PageContainer({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--spacing-6)' }}>{children}</div>;
}

export function Button({ children, variant = 'primary' }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button data-variant={variant}>{children}</button>;
}

export function Card({ children }: { children: ReactNode }) { return <section>{children}</section>; }
export function Badge({ label, status = 'info' }: { label: string; status?: Status }) { return <span data-status={status}>{label}</span>; }
export function Tabs({ tabs, activeKey }: { tabs: { key: string; label: string }[]; activeKey: string }) {
  return <div>{tabs.map((t) => <button key={t.key} aria-current={t.key === activeKey}>{t.label}</button>)}</div>;
}

export function DifficultyBadge({ difficulty }: { difficulty: 'beginner' | 'intermediate' | 'advanced' }) {
  return <Badge label={difficulty} status={difficulty === 'advanced' ? 'warning' : 'info'} />;
}

export function StatCard({ label, value }: { label: string; value: string }) { return <Card><p>{label}</p><strong>{value}</strong></Card>; }
export function ProgressRing({ progress }: { progress: number }) { return <div role="img" aria-label={`progress ${progress}%`}>{progress}%</div>; }
export function ResultSummaryCard({ title, status, description }: { title: string; status: Status; description: string }) { return <Card><Badge label={status} status={status} /><h3>{title}</h3><p>{description}</p></Card>; }
export function MascotHintCard({ hint }: { hint: string }) { return <Card><p>💡 {hint}</p></Card>; }
export function SectionHeader({ title, description }: { title: string; description?: string }) { return <header><h2>{title}</h2>{description ? <p>{description}</p> : null}</header>; }
export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) { return <Card><h3>{title}</h3><p>{body}</p>{cta}</Card>; }
