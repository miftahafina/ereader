import type { NavItem } from 'epubjs'

interface TocProps {
  items: NavItem[]
  currentHref?: string
  onSelect: (href: string) => void
}

function baseHref(href: string): string {
  return href.split('#')[0]
}

interface TocListProps extends TocProps {
  depth: number
}

function TocList({ items, currentHref, onSelect, depth }: TocListProps) {
  if (items.length === 0) return null

  return (
    <ul className="toc-list" data-depth={depth}>
      {items.map((item) => {
        const isActive =
          currentHref !== undefined && baseHref(item.href) === baseHref(currentHref)
        return (
          <li key={item.id || item.href}>
            <button
              className={`toc-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(item.href)}
            >
              {item.label.trim()}
            </button>
            {item.subitems && item.subitems.length > 0 && (
              <TocList
                items={item.subitems}
                currentHref={currentHref}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function Toc(props: TocProps) {
  if (props.items.length === 0) {
    return <p className="toc-empty">Daftar isi tidak tersedia.</p>
  }
  return (
    <nav className="toc" aria-label="Daftar isi">
      <h2 className="sidebar-title">Daftar Isi</h2>
      <TocList {...props} depth={0} />
    </nav>
  )
}
