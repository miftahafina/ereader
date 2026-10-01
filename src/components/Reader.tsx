import { useReaderSession } from '../hooks/useReaderSession'
import type { ReaderSettings } from '../lib/types'
import { SettingsPanel } from './SettingsPanel'
import { SearchPanel } from './SearchPanel'
import { Toc } from './Toc'
import { FullscreenButton } from './FullscreenButton'
import { WordPopup } from './WordPopup'
import { DebugPanel } from './DebugPanel'

interface ReaderProps {
  bookId: string
  settings: ReaderSettings
  onSettingsChange: (patch: Partial<ReaderSettings>) => void
  onClose: () => void
}

export function Reader({ bookId, settings, onSettingsChange, onClose }: ReaderProps) {
  const {
    record,
    toc,
    percentage,
    currentHref,
    loading,
    error,
    panel,
    togglePanel,
    chromeHidden,
    twoColumn,
    stageMaxWidth,
    goNext,
    goPrev,
    handleTocSelect,
    viewerRef,
    bodyRef,
    popup,
    closeWord,
    translateState,
    note,
    toggleTranslate,
    isPlaying,
    toggleTts,
    debugLog,
    isCoarse,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchStatus,
    searchProgress,
    runSearch,
    clearSearch,
    selectSearchResult,
  } = useReaderSession(bookId, settings)

  return (
    <div className={`reader${chromeHidden ? ' chrome-hidden' : ''}`}>
      <header className="reader-top">
        <button className="icon-btn" onClick={onClose} aria-label="Kembali ke perpustakaan">
          ←
        </button>
        <div className="reader-heading">
          <span className="reader-title">{record?.title ?? 'Memuat…'}</span>
          <span className="reader-author">{record?.author}</span>
        </div>
        <div className="reader-actions">
          <button
            className={`icon-btn ${panel === 'toc' ? 'active' : ''}`}
            onClick={() => togglePanel('toc')}
            aria-label="Daftar isi"
          >
            ☰
          </button>
          <button
            className={`icon-btn ${panel === 'search' ? 'active' : ''}`}
            onClick={() => togglePanel('search')}
            aria-label="Cari di dalam buku"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button
            className={`icon-btn ${panel === 'settings' ? 'active' : ''}`}
            onClick={() => togglePanel('settings')}
            aria-label="Pengaturan"
          >
            Aa
          </button>
          <FullscreenButton />
        </div>
      </header>

      <div className="reader-body" ref={bodyRef}>
        {panel === 'toc' && (
          <aside className="reader-sidebar">
            <Toc items={toc} currentHref={currentHref} onSelect={handleTocSelect} />
          </aside>
        )}

        {panel === 'search' && (
          <aside className="reader-sidebar">
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSearch={runSearch}
              onClear={clearSearch}
              results={searchResults}
              status={searchStatus}
              progress={searchProgress}
              onSelect={(result) => void selectSearchResult(result)}
            />
          </aside>
        )}

        <div className="reader-stage" style={{ maxWidth: `${stageMaxWidth}px` }}>
          {twoColumn && <div className="reader-spine" />}
          <div className="reader-viewer" ref={viewerRef} />
          {loading && <div className="reader-overlay">Memuat buku…</div>}
          {error && <div className="reader-overlay error">{error}</div>}
        </div>

        {panel === 'settings' && (
          <aside className="reader-sidebar settings-sidebar">
            <SettingsPanel settings={settings} onChange={onSettingsChange} />
          </aside>
        )}
      </div>

      <footer className="reader-bottom">
        <button
          className={`nav-btn ${translateState !== 'idle' ? 'active' : ''} ${translateState === 'loading' ? 'translating' : ''}`}
          onClick={toggleTranslate}
          aria-label="Terjemahkan bagian ini"
          style={{ padding: 0 }}
        >
          <img
            src={
              translateState === 'idle' && settings.theme !== 'dark'
                ? '/translate-icon-black.png'
                : '/translate-icon-white.png'
            }
            alt=""
            width={20}
            height={20}
            style={{ display: 'block' }}
          />
        </button>
        <button
          className={`nav-btn ${isPlaying ? 'active' : ''}`}
          onClick={toggleTts}
          aria-label={isPlaying ? 'Hentikan Audio' : 'Putar Audio'}
          style={{ padding: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isPlaying ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <>
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </>
            )}
          </svg>
        </button>
        <button className="nav-btn" onClick={goPrev} aria-label="Halaman sebelumnya">
          ‹
        </button>
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(percentage * 100)}>
          <div className="progress-fill" style={{ width: `${Math.min(100, percentage * 100)}%` }} />
        </div>
        <span className="progress-label">{Math.round(percentage * 100)}%</span>
        <button className="nav-btn" onClick={goNext} aria-label="Halaman berikutnya">
          ›
        </button>
      </footer>

      {settings.debugMode && <DebugPanel log={debugLog} />}

      {settings.grain > 0 && (
        <div
          className="reader-grain"
          style={{ opacity: (settings.grain / 100) * 0.55 }}
          aria-hidden="true"
        />
      )}

      {popup && <WordPopup popup={popup} isCoarse={isCoarse} onClose={closeWord} />}

      {note && <div className="reader-note">{note}</div>}
    </div>
  )
}
