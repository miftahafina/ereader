import type { PdfOutlineItem } from '../lib/pdf'

interface PdfTocProps {
  items: PdfOutlineItem[]
  currentPage: number
  onSelect: (page: number) => void
}

function PdfTocList({
  items,
  currentPage,
  onSelect,
  depth,
}: PdfTocProps & { depth: number }) {
  return (
    <ul className="toc-list" data-depth={depth}>
      {items.map((item) => (
        <li key={`${depth}-${item.title}-${item.page}`}>
          <button
            className={`toc-item ${item.page === currentPage ? 'active' : ''}`}
            onClick={() => onSelect(item.page)}
          >
            {item.title}
          </button>
          {item.items && item.items.length > 0 && (
            <PdfTocList
              items={item.items}
              currentPage={currentPage}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export function PdfToc({ items, currentPage, onSelect }: PdfTocProps) {
  if (items.length === 0) {
    return <p className="toc-empty">Dokumen ini tidak punya daftar isi.</p>
  }
  return <PdfTocList items={items} currentPage={currentPage} onSelect={onSelect} depth={0} />
}
