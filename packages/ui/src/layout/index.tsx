import type { ReactNode } from 'react';

export function TopHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return <header><h1>{title}</h1>{actions}</header>;
}

export function SidebarNavigation({ items }: { items: { key: string; label: string }[] }) {
  return <nav aria-label="sidebar">{items.map((item) => <a key={item.key} href="#">{item.label}</a>)}</nav>;
}

export function BottomTabBar({ items }: { items: { key: string; label: string }[] }) {
  return <nav aria-label="bottom-tab">{items.map((item) => <button key={item.key}>{item.label}</button>)}</nav>;
}

export function ContentLayout({ sidebar, main }: { sidebar: ReactNode; main: ReactNode }) {
  return <div data-layout="content"><aside>{sidebar}</aside><main>{main}</main></div>;
}

export function AppShell({ header, sidebar, bottomTabs, content }: { header: ReactNode; sidebar: ReactNode; bottomTabs: ReactNode; content: ReactNode }) {
  return (
    <div>
      {header}
      <ContentLayout sidebar={sidebar} main={content} />
      {bottomTabs}
    </div>
  );
}
