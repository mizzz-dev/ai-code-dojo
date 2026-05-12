import type { CSSProperties, ReactNode } from 'react';

export function TopHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return <header style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header)' as unknown as number, padding: 'clamp(var(--spacing-3), 2vw, var(--spacing-4))', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}><h1 style={{ margin: 0, fontSize: 'var(--font-size-lg)', lineHeight: 1.4 }}>{title}</h1>{actions}</header>;
}

export function Sidebar({ items, activeKey }: { items: { key: string; label: string }[]; activeKey?: string }) {
  return <nav aria-label="sidebar" style={{ display: 'grid', gap: 'var(--spacing-2)' }}>{items.map((item) => <a key={item.key} href="#" aria-current={item.key === activeKey ? 'page' : undefined} style={{ textDecoration: 'none', color: item.key === activeKey ? 'var(--color-primary-strong)' : 'var(--color-text)', background: item.key === activeKey ? 'var(--color-bg-elevated)' : 'transparent', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-2) var(--spacing-3)', minHeight: 44, display: 'flex', alignItems: 'center' }}>{item.label}</a>)}</nav>;
}

export function BottomTabBar({ items, activeKey }: { items: { key: string; label: string }[]; activeKey?: string }) {
  return <nav aria-label="bottom-tab" style={{ position: 'sticky', bottom: 0, zIndex: 'var(--z-bottom-tab)' as unknown as number, display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 'var(--spacing-2)', padding: 'var(--spacing-2)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>{items.map((item) => <button key={item.key} aria-current={item.key === activeKey ? 'page' : undefined} style={{ border: 'none', background: item.key === activeKey ? 'var(--color-bg-elevated)' : 'transparent', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-2)', color: item.key === activeKey ? 'var(--color-primary-strong)' : 'var(--color-text)', minHeight: 44, fontWeight: item.key === activeKey ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)' }}>{item.label}</button>)}</nav>;
}

export function ContentLayout({ sidebar, main, showSidebar = true }: { sidebar: ReactNode; main: ReactNode; showSidebar?: boolean }) {
  const layoutStyle: CSSProperties = { display: 'grid', gap: 'var(--spacing-4)', gridTemplateColumns: showSidebar ? 'minmax(200px, 240px) minmax(0, 1fr)' : 'minmax(0, 1fr)' };
  return <div data-layout="content" style={layoutStyle}><aside style={{ display: showSidebar ? 'block' : 'none' }}>{sidebar}</aside><main>{main}</main></div>;
}

export function AppShell({ header, sidebar, bottomTabs, content, showSidebar = true, theme = 'learner' }: { header: ReactNode; sidebar: ReactNode; bottomTabs: ReactNode; content: ReactNode; showSidebar?: boolean; theme?: 'learner' | 'admin' }) {
  return (
    <div data-theme={theme}>
      {header}
      <div style={{ padding: 'clamp(var(--spacing-2), 2vw, var(--spacing-4))' }}>
        <ContentLayout sidebar={sidebar} main={content} showSidebar={showSidebar} />
      </div>
      {bottomTabs}
    </div>
  );
}
