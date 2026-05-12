import type { CSSProperties, ReactNode } from 'react';

export type Status = 'success' | 'warning' | 'fail' | 'info';

export function PageContainer({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(var(--spacing-3), 3vw, var(--spacing-6))' }}>{children}</div>;
}

const buttonVariantStyles: Record<'primary' | 'secondary' | 'ghost', CSSProperties> = {
  primary: { background: 'var(--gradient-brand)', color: 'var(--color-primary-contrast)', border: '1px solid transparent' },
  secondary: { background: 'var(--color-surface)', color: 'var(--color-primary-strong)', border: '1px solid var(--color-border)' },
  ghost: { background: 'transparent', color: 'var(--color-text)' , border: '1px solid transparent' }
};

export function Button({ children, variant = 'primary', size = 'md', disabled }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean }) {
  const paddingBySize = size === 'sm' ? 'var(--spacing-2) var(--spacing-3)' : size === 'lg' ? 'var(--spacing-4) var(--spacing-6)' : 'var(--spacing-3) var(--spacing-4)';
  return <button disabled={disabled} data-variant={variant} style={{ ...buttonVariantStyles[variant], borderRadius: 'var(--radius-pill)', padding: paddingBySize, minHeight: 44, minWidth: 44, fontWeight: 'var(--font-weight-semibold)', lineHeight: 1.4, transition: `all var(--motion-base) var(--easing-standard)`, opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>;
}

export function Card({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'soft' }) {
  return <section style={{ background: tone === 'soft' ? 'var(--color-surface-soft)' : 'var(--gradient-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'clamp(var(--spacing-3), 2vw, var(--spacing-4))' }}>{children}</section>;
}

export function Badge({ label, status = 'info' }: { label: string; status?: Status }) {
  const statusColor = status === 'success' ? 'var(--color-success)' : status === 'warning' ? 'var(--color-warning)' : status === 'fail' ? 'var(--color-fail)' : 'var(--color-info)';
  return <span data-status={status} style={{ display: 'inline-flex', borderRadius: 'var(--radius-pill)', border: `1px solid ${statusColor}`, color: statusColor, padding: '2px var(--spacing-2)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>{label}</span>;
}

export function DifficultyBadge({ difficulty }: { difficulty: 'beginner' | 'intermediate' | 'advanced' }) {
  return <Badge label={difficulty} status={difficulty === 'advanced' ? 'warning' : difficulty === 'intermediate' ? 'info' : 'success'} />;
}

export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return <Card><p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{label}</p><strong style={{ fontSize: 'var(--font-size-xl)' }}>{value}</strong>{trend ? <p style={{ marginBottom: 0 }}>{trend}</p> : null}</Card>;
}

export function ProgressRing({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return <div role="img" aria-label={`progress ${clamped}%`} style={{ width: 88, height: 88, borderRadius: '50%', border: `8px solid var(--color-bg-elevated)`, borderTopColor: 'var(--color-primary)', display: 'grid', placeItems: 'center', fontWeight: 'var(--font-weight-semibold)' }}>{clamped}%</div>;
}

export function MascotHintCard({ hint, mascot = '💡' }: { hint: string; mascot?: string }) {
  return <Card tone="soft"><p style={{ margin: 0 }}>{mascot} {hint}</p></Card>;
}

export function ReviewPreviewCard({ title, excerpt, reviewedAt, score }: { title: string; excerpt: string; reviewedAt: string; score?: string }) {
  return <Card><h3 style={{ marginTop: 0 }}>{title}</h3><p>{excerpt}</p><p style={{ color: 'var(--color-text-muted)', marginBottom: 0 }}>{reviewedAt}{score ? ` / ${score}` : ''}</p></Card>;
}

export function ResultSummaryCard({ title, status, description }: { title: string; status: Status; description: string }) {
  return <Card><Badge label={status} status={status} /><h3>{title}</h3><p>{description}</p></Card>;
}
