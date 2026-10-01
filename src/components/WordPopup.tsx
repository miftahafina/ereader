import type { WordPopupState } from '../hooks/useWordLookup'

interface WordPopupProps {
  popup: WordPopupState
  isCoarse: boolean
  onClose: () => void
}

export function WordPopup({ popup, isCoarse, onClose }: WordPopupProps) {
  const half = Math.min(160, Math.max(72, (window.innerWidth - 24) / 2))
  const left = Math.min(Math.max(popup.x, half), window.innerWidth - half)

  return (
    <div
      className={`word-popup${isCoarse ? ' mobile' : ''}${popup.below ? ' below' : ''}`}
      style={isCoarse ? {} : { left: `${left}px`, top: `${popup.y}px` }}
      role="tooltip"
    >
      <div className="word-popup-head">
        <span className="word-popup-word">{popup.word}</span>
        {popup.status === 'done' && popup.definition?.phonetic && (
          <span className="word-popup-phonetic">{popup.definition.phonetic}</span>
        )}
        <button className="word-popup-close" onClick={onClose} aria-label="Tutup">
          ×
        </button>
      </div>
      {popup.status === 'loading' && (
        <div className="word-popup-skeleton" aria-hidden="true">
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      )}
      {popup.status === 'error' && <p className="word-popup-note">Definisi tidak ditemukan.</p>}
      {popup.status === 'done' && popup.definition && (
        <ul className="word-popup-list">
          {popup.definition.definitions.map((item, index) => (
            <li key={index}>
              {item.partOfSpeech && <em className="word-popup-pos">{item.partOfSpeech}</em>}
              <span>{item.meaning}</span>
              {item.example && <span className="word-popup-example">“{item.example}”</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
