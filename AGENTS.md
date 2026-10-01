# AGENTS.md

Panduan untuk AI coding agent yang bekerja di repo ini.

## Ringkasan proyek

EPUB Reader Web — pembaca EPUB yang berjalan **sepenuhnya di browser** (100% client-side). Pengguna drag & drop file `.epub`; parsing, render, dan penyimpanan (IndexedDB) terjadi di perangkat. Tidak ada backend. Ditujukan untuk deploy statis di Cloudflare Pages.

## Perintah

```bash
npm install        # pasang dependency
npm run dev        # dev server (Vite)
npm run build      # tsc -b && vite build -> dist/
npm run lint       # oxlint (harus bersih sebelum commit)
npm run preview    # pratinjau hasil build
```

Selalu jalankan `npm run lint` dan `npm run build` setelah mengubah kode. Tidak ada framework test; verifikasi manual lewat browser (atau Playwright bila tersedia).

## Stack

- React 19 + TypeScript + Vite
- `epubjs` (parsing & render EPUB)
- `idb` (wrapper IndexedDB)
- `@fontsource-variable/literata` (font baca default, OFL-1.1)
- `oxlint` (linting)

## Peta file

```
src/
  main.tsx                 entry, render <App/> (tanpa StrictMode, sengaja)
  App.tsx                  routing view library/reader + drop zone (data via hooks)
  index.css                entry styling, @import ke src/styles/*
  styles/                  CSS modular: theme, base, buttons, library,
                           reader, reader-popup, reader-chrome, toc,
                           search, settings, overlays, responsive
  lib/
    types.ts               tipe bersama (BookRecord, ReaderSettings, dll)
    db.ts                  IndexedDB: store `books` & `progress`
    epub.ts                ekstraksi metadata + sampul dari file EPUB
    samples.ts             manifest buku sampel bawaan (public domain)
    settings.ts            default, palette tema, opsi font & rata teks, persist localStorage
    reader-theme.ts        buildReaderCss + applyReaderTheme untuk iframe
    reader-constants.ts    konstanta reader (SPREAD_*, IS_WEBKIT)
    tts-text.ts            ekstraksi teks terlihat dari iframe -> chunk TTS
    search.ts              pencarian teks lintas section (Section.find)
    translate.ts           penerjemahan (Google Translate endpoint)
    translate-dom.ts       injeksi hasil terjemahan ke iframe
    dictionary.ts          definisi kata (Wiktionary API)
    fontFaces.ts           @font-face Literata (URL absolut) untuk iframe
  hooks/
    useFileDrop.ts         deteksi drag & drop file level window
    useFullscreen.ts       state & toggle Fullscreen API
    useMediaQuery.ts       media query reaktif (mis. `pointer: coarse`)
    useLatest.ts           ref yang selalu berisi nilai terbaru
    useVoices.ts           daftar suara SpeechSynthesis (reaktif)
    useReaderSession.ts    merangkai seluruh hook reader jadi satu kontrak
    useEpubRendition.ts    siklus hidup epub.js, event, resize, locations
    useReadingProgress.ts  debounce simpan + flush progres baca
    useReaderChrome.ts     state panel (TOC/settings) & chrome tersembunyi
    useReaderLayout.ts     lebar area baca, spread 2 kolom, stageMaxWidth
    useReaderNavigation.ts keyboard, tap zone, swipe
    useReaderTts.ts        text-to-speech (Web Speech API)
    useSectionTranslation.ts terjemahan per bagian in-place
    useWordLookup.ts       popup kamus Wiktionary
    useBookSearch.ts       pencarian teks dalam buku (status, hasil, progres)
    useLibrary.ts          data perpustakaan (IndexedDB), impor, sampel, hapus
    useReaderSettings.ts   state + persist pengaturan
    useTheme.ts            tulis data-theme & meta[theme-color]
  components/
    Library.tsx            grid buku + impor + hapus
    Reader.tsx             tampilan reader (orkestrasi useReaderSession + JSX)
    Toc.tsx                daftar isi rekursif
    SettingsPanel.tsx      kontrol tampilan
    SettingsControls.tsx   primitif form setelan (slider, segmented, select)
    SearchPanel.tsx        panel pencarian teks dalam buku
    FullscreenButton.tsx   tombol layar penuh (hidden bila tidak didukung)
    WordPopup.tsx          popup definisi kata
    DebugPanel.tsx         panel debug TTS (aktif bila `debugMode`)
public/
  _redirects, _headers     konfigurasi Cloudflare Pages
  samples/*.epub           buku sampel public domain (Alice, Time Machine, Pride & Prejudice)
wrangler.jsonc             konfigurasi deploy Pages
```

## Konvensi kode

- **Jangan tambahkan komentar** kecuali diminta.
- Type-only import wajib: `import type { X } from '...'` (`verbatimModuleSyntax: true`).
- `noUnusedLocals` & `noUnusedParameters` aktif; `erasableSyntaxOnly` aktif (tanpa `enum`, `namespace`, parameter properties).
- Styling modular di `src/styles/*`, diimpor oleh `src/index.css`. Tema memakai CSS variables di `:root[data-theme="light|sepia|dark"]`; `data-theme` di-set di `document.documentElement` oleh `App.tsx`.
- Bahasa UI: Indonesia.

## Catatan penting epub.js (jangan diubah tanpa alasan)

- Isi buku dirender di `<iframe srcdoc sandbox="allow-same-origin">`. CSS/font dari dokumen induk **tidak** otomatis tembus ke iframe.
- **Safari/WebKit** tidak meneruskan event `selectionchange`/`mouseup` ke iframe `sandbox="allow-same-origin"` tanpa `allow-scripts`. Karena popup kamus bergantung pada event `selected` epub.js, `allowScriptedContent` aktif **khusus WebKit** (`IS_WEBKIT` di `src/hooks/useReaderSession.ts`); browser lain tetap `false` demi keamanan konten.
- Tema, font, & rata teks disuntik lewat **content hook** `rendition.hooks.content.register(...)` + `contents.addStylesheetCss(css, 'ereader')` (lihat `buildReaderCss`/`applyReaderTheme` di `src/lib/reader-theme.ts`). Jangan hanya pakai `themes.registerCss` + `select` — epub.js melewati tema `serialized` saat konten pertama dimuat. Rata teks `default` tidak menimpa gaya asli EPUB (rule `text-align` hanya disuntik bila bukan `default`).
- Font di iframe butuh `@font-face` dengan URL absolut (`src/lib/fontFaces.ts`).
- Koordinat event yang diteruskan dari iframe (mis. `click`) relatif terhadap viewport iframe yang **lebih lebar dari layar** (konten kolom). Untuk tap zone, konversi dengan `frame.getBoundingClientRect()` dikurangi rect `.reader-viewer` (`handleTap` di `src/hooks/useReaderNavigation.ts`).
- Layout 2 kolom (spread) aktif otomatis bila lebar area baca ≥ `SPREAD_MIN_WIDTH` (1000px) dan mode `paginated`. `stageMaxWidth` dihitung di `src/hooks/useReaderSession.ts`.
- Lebar iframe = total lebar kolom (bisa ribuan px); `contents.window.innerWidth` **bukan** lebar yang terlihat.

## Data & penyimpanan

- IndexedDB: db `ereader-web` v1, store `books` (keyPath `id`, index `by-addedAt`) dan `progress` (keyPath `id`).
- File EPUB disimpan sebagai `ArrayBuffer` di store `books`. Saat ekstraksi metadata, oper `data.slice(0)` agar buffer asli tidak dikonsumsi.
- Pengaturan di `localStorage` key `ereader-web:settings`; `loadSettings()` melakukan merge dengan `defaultSettings` sehingga field baru aman untuk user lama.
- Progres baca disimpan per CFI, dengan flush saat reader di-unmount.

## Deploy

- Cloudflare Pages: build command `npm run build`, output `dist`.
- `public/_redirects` (SPA fallback) & `public/_headers` (cache `/assets/*` immutable) ikut tersalin ke `dist`.
- Alternatif: `npx wrangler pages deploy dist`.

## Batasan yang diketahui

- Tombol volume hanya *best-effort* (`AudioVolumeUp`/`AudioVolumeDown`); umumnya tidak terkirim ke web di Chrome Android/Safari iOS.
- Spacing paragraf menyasar elemen `<p>`; EPUB yang memakai `<div>` tidak terpengaruh.
- Bookerly proprietary — dipakai Literata sebagai alternatif open-source.
