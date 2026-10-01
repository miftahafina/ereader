import type { ReactNode } from 'react'
import type { SearchResult } from '../lib/search'
import type { SearchStatus } from '../hooks/useBookSearch'

interface SearchPanelProps {
  query: string
  onQueryChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
  results: SearchResult[]
  status: SearchStatus
  progress: { scanned: number; total: number }
  onSelect: (result: SearchResult) => void
}

function HighlightedExcerpt({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase()
  if (!needle) return <>{text}</>

  const lower = text.toLowerCase()
  const parts: ReactNode[] = []
  let start = 0
  let index = lower.indexOf(needle)
  let key = 0

  while (index !== -1) {
    if (index > start) parts.push(text.slice(start, index))
    parts.push(<mark key={key}>{text.slice(index, index + needle.length)}</mark>)
    key += 1
    start = index + needle.length
    index = lower.indexOf(needle, start)
  }
  if (start < text.length) parts.push(text.slice(start))
  return <>{parts}</>
}

export function SearchPanel({
  query,
  onQueryChange,
  onSearch,
  onClear,
  results,
  status,
  progress,
  onSelect,
}: SearchPanelProps) {
  return (
    <div className="search-panel">
      <h2 className="sidebar-title">Pencarian</h2>

      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch()
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cari di dalam buku…"
          autoFocus
          aria-label="Kata kunci pencarian"
        />
        {query && (
          <button
            type="button"
            className="search-input-clear"
            onClick={onClear}
            aria-label="Bersihkan"
          >
            ×
          </button>
        )}
      </form>

      {status === 'searching' && (
        <p className="search-status">
          Mencari… {progress.total > 0 ? `(${progress.scanned}/${progress.total})` : ''}
        </p>
      )}
      {status === 'error' && <p className="search-status">Pencarian gagal.</p>}
      {status === 'done' && results.length === 0 && (
        <p className="search-status">Tidak ada hasil.</p>
      )}
      {status === 'done' && results.length > 0 && (
        <p className="search-status">{results.length} hasil ditemukan</p>
      )}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((result, index) => (
            <li key={`${result.cfi}-${index}`}>
              <button className="search-result" onClick={() => onSelect(result)}>
                <HighlightedExcerpt text={result.excerpt} query={query} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
