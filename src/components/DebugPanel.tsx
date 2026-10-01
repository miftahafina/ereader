export function DebugPanel({ log }: { log: string[] }) {
  if (log.length === 0) return null

  return (
    <div className="debug-panel" aria-hidden="true">
      {log.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  )
}
