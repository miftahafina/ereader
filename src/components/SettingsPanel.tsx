import { defaultSettings, fontOptions } from '../lib/settings'
import type { ReaderSettings, ReaderTheme } from '../lib/types'

interface SettingsPanelProps {
  settings: ReaderSettings
  onChange: (patch: Partial<ReaderSettings>) => void
}

const themes: { value: ReaderTheme; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Gelap' },
]

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <div className="settings">
      <h2 className="sidebar-title">Tampilan</h2>
      
      <section className="setting-group">
        <span className="setting-label">Tema</span>
        <div className="segmented">
          {themes.map((theme) => (
            <button
              key={theme.value}
              className={settings.theme === theme.value ? 'active' : ''}
              onClick={() => onChange({ theme: theme.value })}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      <section className="setting-group">
        <div className="setting-row">
          <span className="setting-label">Ukuran huruf</span>
          <span className="setting-value">{settings.fontSize}%</span>
        </div>
        <input
          type="range"
          min={70}
          max={200}
          step={5}
          value={settings.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
        />
      </section>

      <section className="setting-group">
        <span className="setting-label">Jenis huruf</span>
        <select
          value={settings.fontFamily}
          onChange={(event) => onChange({ fontFamily: event.target.value })}
        >
          {fontOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="setting-group">
        <div className="setting-row">
          <span className="setting-label">Jarak baris</span>
          <span className="setting-value">{settings.lineHeight.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={1.2}
          max={2.4}
          step={0.1}
          value={settings.lineHeight}
          onChange={(event) => onChange({ lineHeight: Number(event.target.value) })}
        />
      </section>

      <section className="setting-group">
        <div className="setting-row">
          <span className="setting-label">Jarak antar paragraf</span>
          <span className="setting-value">{settings.paragraphSpacing.toFixed(1)}em</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={settings.paragraphSpacing}
          onChange={(event) => onChange({ paragraphSpacing: Number(event.target.value) })}
        />
      </section>

       <section className="setting-group">
         <div className="setting-row">
           <span className="setting-label">Mode baca</span>
           <div className="segmented">
             <button
               className={settings.flow === 'paginated' ? 'active' : ''}
               onClick={() => onChange({ flow: 'paginated' })}
             >
               Halaman
             </button>
             <button
               className={settings.flow === 'scrolled' ? 'active' : ''}
               onClick={() => onChange({ flow: 'scrolled' })}
             >
               Gulir
             </button>
           </div>
         </div>
       </section>

      <section className="setting-group">
        <div className="setting-row">
          <span className="setting-label">Lebar kolom</span>
          <span className="setting-value">{settings.maxWidth}px</span>
        </div>
        <input
          type="range"
          min={480}
          max={1200}
          step={20}
          value={settings.maxWidth}
          onChange={(event) => onChange({ maxWidth: Number(event.target.value) })}
        />
      </section>

       <section className="setting-group">
         <div className="setting-row">
           <span className="setting-label">Tekstur kertas</span>
           <span className="setting-value">{settings.grain}%</span>
         </div>
         <input
           type="range"
           min={0}
           max={100}
           step={5}
           value={settings.grain}
           onChange={(event) => onChange({ grain: Number(event.target.value) })}
         />
       </section>



       <h2 className="sidebar-title">Audiobook (beta)</h2>

       <section className="setting-group">
         <div className="setting-row">
           <span className="setting-label">Kecepatan</span>
           <span className="setting-value">{settings.ttsRate}x</span>
         </div>
         <input
           type="range"
           min={0.5}
           max={2}
           step={0.1}
           value={settings.ttsRate}
           onChange={(event) => onChange({ ttsRate: Number(event.target.value) })}
         />
       </section>
 
       <section className="setting-group">
         <div className="setting-row">
           <span className="setting-label">Nada</span>
           <span className="setting-value">{settings.ttsPitch}</span>
         </div>
         <input
           type="range"
           min={0}
           max={2}
           step={0.1}
           value={settings.ttsPitch}
           onChange={(event) => onChange({ ttsPitch: Number(event.target.value) })}
         />
       </section>
 
       <section className="setting-group">
         <span className="setting-label">Suara</span>
         <select
           value={settings.ttsVoice}
           onChange={(event) => onChange({ ttsVoice: event.target.value })}
         >
           <option value="">Default</option>
           {window.speechSynthesis.getVoices().map((voice) => (
             <option key={voice.voiceURI} value={voice.voiceURI}>
               {voice.name} ({voice.lang})
             </option>
           ))}
         </select>
       </section>


        <h2 className="sidebar-title">DEVELOPMENT</h2>

        <section className="setting-group">
          <div className="setting-row">
            <span className="setting-label">Mode Debug</span>
            <input 
              type="checkbox" 
              checked={settings.debugMode} 
              onChange={(e) => onChange({ debugMode: e.target.checked })} 
            />
          </div>
        </section>

        <button className="ghost-btn" onClick={() => onChange({ ...defaultSettings })}>
          Reset pengaturan
        </button>


    </div>
  )
}
