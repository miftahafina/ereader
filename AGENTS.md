# AGENTS.md

Panduan untuk AI coding agent yang bekerja di repo ini.

## Ringkasan proyek

EPUB Reader Web — pembaca **EPUB & PDF** yang berjalan **sepenuhnya di browser** (100% client-side). Pengguna drag & drop file `.epub`/`.pdf`; parsing, render, dan penyimpanan (IndexedDB) terjadi di perangkat. Tidak ada backend. Ditujukan untuk deploy statis di Cloudflare Pages.

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
- `pdfjs-dist` (parsing & render PDF; worker + asset WASM/font/CMap)
- `idb` (wrapper IndexedDB)
- `@fontsource-variable/literata` (font baca default, OFL-1.1)
- `oxlint` (linting)

## Peta file

```
src/
  main.tsx                 entry, render <App/> (tanpa StrictMode, sengaja)
  App.tsx                  routing view library/reader + drop zone (pilih Reader vs PdfReader)
  index.css                entry styling, @import ke src/styles/*
  styles/                  CSS modular: theme, base, buttons, library,
                           reader, reader-popup, reader-chrome, toc,
                           search, settings, overlays, pdf, responsive
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
    pdf.ts                 loader pdf.js: metadata/sampul/outline + pageHasText
    pdf-color.ts           recolorForTheme: remap warna halaman PDF ke tema reader
    pdf-crop.ts            deteksi batas konten (tahan bintik scan) + crop margin
    pdf-reflow.ts          ekstraksi blok teks (heading/paragraf) per halaman
  hooks/
    useFileDrop.ts         deteksi drag & drop file level window
    useFullscreen.ts       state & toggle Fullscreen API
    useMediaQuery.ts       media query reaktif (mis. `pointer: coarse`)
    useLatest.ts           ref yang selalu berisi nilai terbaru
    useVoices.ts           daftar suara SpeechSynthesis (reaktif)
    useReaderSession.ts    merangkai seluruh hook reader jadi satu kontrak
    useEpubRendition.ts    siklus hidup epub.js, event, resize, locations
    useReadingProgress.ts  debounce simpan + flush progres baca
    useReaderChrome.ts     state panel (TOC/settings) & chrome tersembunyi (dipakai EPUB & PDF)
    useReaderLayout.ts     lebar area baca, spread 2 kolom, stageMaxWidth
    useReaderNavigation.ts keyboard, tap zone, swipe
    useReaderTts.ts        text-to-speech (Web Speech API)
    useSectionTranslation.ts terjemahan per bagian in-place
    useWordLookup.ts       popup kamus Wiktionary
    useBookSearch.ts       pencarian teks dalam buku (status, hasil, progres)
    useLibrary.ts          data perpustakaan (IndexedDB), impor EPUB/PDF, sampel, hapus
    useReaderSettings.ts   state + persist pengaturan
    useTheme.ts            tulis data-theme & meta[theme-color]
    usePdfDocument.ts      buka dokumen pdf.js, outline, cleanup loadingTask
    usePdfView.ts          halaman aktif, spread auto/single/double, persentase
    usePdfProgress.ts      debounce simpan + flush progres PDF (halaman)
    usePdfReflow.ts        ekstraksi seluruh halaman untuk mode reflow
    usePdfReflowPager.ts   paginasi reflow via CSS multi-column
  components/
    Library.tsx            grid buku + impor EPUB/PDF + hapus
    Reader.tsx             tampilan reader EPUB (orkestrasi useReaderSession + JSX)
    Toc.tsx                daftar isi EPUB rekursif
    SettingsPanel.tsx      kontrol tampilan EPUB
    SettingsControls.tsx   primitif form setelan (slider, segmented, select) + dukungan ikon
    SettingsIcon.tsx       set ikon SVG inline untuk label setelan
    SearchPanel.tsx        panel pencarian teks dalam buku
    FullscreenButton.tsx   tombol layar penuh (hidden bila tidak didukung)
    WordPopup.tsx          popup definisi kata
    DebugPanel.tsx         panel debug TTS (aktif bila `debugMode`)
    PdfReader.tsx          tampilan reader PDF (orkestrasi usePdf* + JSX)
    PdfPage.tsx            render canvas pdf.js, crop, recolor, fit ke pane
    PdfSettingsPanel.tsx   kontrol tampilan PDF
    PdfToc.tsx             daftar isi PDF rekursif
public/
  _redirects, _headers     konfigurasi Cloudflare Pages
  samples/*.epub           buku sampel public domain (Alice, Time Machine, Pride & Prejudice)
  pdfjs/                   asset pdf.js hasil salin Vite (gitignored)
wrangler.jsonc             konfigurasi deploy Pages
```

## Konvensi kode

- **Jangan tambahkan komentar** kecuali diminta.
- Type-only import wajib: `import type { X } from '...'` (`verbatimModuleSyntax: true`).
- `noUnusedLocals` & `noUnusedParameters` aktif; `erasableSyntaxOnly` aktif (tanpa `enum`, `namespace`, parameter properties).
- Styling modular di `src/styles/*`, diimpor oleh `src/index.css`. Tema memakai CSS variables di `:root[data-theme="light|sepia|dark"]`; `data-theme` di-set di `document.documentElement` oleh `App.tsx`.
- Ikon setelan adalah SVG inline di `src/components/SettingsIcon.tsx` (`SettingIcon name=...`), dipakai lewat primitif `SettingsControls.tsx`. Tidak ada library ikon.
- Bahasa UI: Indonesia.

## Catatan penting epub.js (jangan diubah tanpa alasan)

- Isi buku dirender di `<iframe srcdoc sandbox="allow-same-origin">`. CSS/font dari dokumen induk **tidak** otomatis tembus ke iframe.
- **Safari/WebKit** tidak meneruskan event `selectionchange`/`mouseup` ke iframe `sandbox="allow-same-origin"` tanpa `allow-scripts`. Karena popup kamus bergantung pada event `selected` epub.js, `allowScriptedContent` aktif **khusus WebKit** (`IS_WEBKIT` di `src/hooks/useReaderSession.ts`); browser lain tetap `false` demi keamanan konten.
- Tema, font, & rata teks disuntik lewat **content hook** `rendition.hooks.content.register(...)` + `contents.addStylesheetCss(css, 'ereader')` (lihat `buildReaderCss`/`applyReaderTheme` di `src/lib/reader-theme.ts`). Jangan hanya pakai `themes.registerCss` + `select` — epub.js melewati tema `serialized` saat konten pertama dimuat. Rata teks `default` tidak menimpa gaya asli EPUB (rule `text-align` hanya disuntik bila bukan `default`).
- Font di iframe butuh `@font-face` dengan URL absolut (`src/lib/fontFaces.ts`).
- Koordinat event yang diteruskan dari iframe (mis. `click`) relatif terhadap viewport iframe yang **lebih lebar dari layar** (konten kolom). Untuk tap zone, konversi dengan `frame.getBoundingClientRect()` dikurangi rect `.reader-viewer` (`handleTap` di `src/hooks/useReaderNavigation.ts`).
- Layout 2 kolom (spread) aktif otomatis bila lebar area baca ≥ `SPREAD_MIN_WIDTH` (1000px) dan mode `paginated`. `stageMaxWidth` dihitung di `src/hooks/useReaderSession.ts`.
- Lebar iframe = total lebar kolom (bisa ribuan px); `contents.window.innerWidth` **bukan** lebar yang terlihat.

## Catatan penting PDF (pdf.js)

- Konten PDF dirender ke `<canvas>`, **bukan** iframe. Tema/font EPUB tidak berlaku untuk halaman PDF; warna halaman di-remap lewat `recolorForTheme` (`src/lib/pdf-color.ts`) setelah render.
- Worker dimuat via `pdfjs-dist/build/pdf.worker.min.mjs?url`; `GlobalWorkerOptions.workerSrc` di-set di `src/lib/pdf.ts`.
- pdf.js butuh `wasmUrl`/`standardFontDataUrl`/`cMapUrl` agar scan (JBIG2/JPX) & teks CJK ter-decode. Plugin `pdfjsAssets` di `vite.config.ts` menyalin folder `wasm`, `standard_fonts`, `cmaps` dari `node_modules/pdfjs-dist` ke `public/pdfjs/` (gitignored, ikut tersalin ke `dist/pdfjs`).
- **Jangan** pakai `PDFDocumentProxy.destroy()` (tidak tersedia). Pakai `doc.loadingTask.destroy()` (lihat `usePdfDocument.ts`).
- `pageHasText()` (`src/lib/pdf.ts`) mendeteksi halaman scan (tanpa teks). Halaman image-only diwarnai tanpa remap kecuali `pdfScanTheme` aktif; `fontOpacity` tetap berlaku di kedua kasus (lihat `PdfPage.tsx`).
- Crop margin (`detectContentBounds`, `src/lib/pdf-crop.ts`): downscale ke lebar 360, binarisasi vs latar (median 4 sudut), lalu **dilasi** mask dan buang komponen dengan tinta < ambang. Tujuannya agar bintik scan terisolasi tidak memperlebar kotak crop. `cropCanvas` menambahkan `pdfCropMargin`.
- Reflow hanya untuk halaman berteks: `extractReflowBlocks` (`src/lib/pdf-reflow.ts`) mengelompokkan item teks jadi heading/paragraf; paginasi memakai CSS multi-column di `usePdfReflowPager`. Halaman scan ditampilkan sebagai catatan, bukan teks.

## Data & penyimpanan

- IndexedDB: db `ereader-web` v1, store `books` (keyPath `id`, index `by-addedAt`) dan `progress` (keyPath `id`).
- File EPUB/PDF disimpan sebagai `ArrayBuffer` di store `books`; `BookRecord.format` (`'epub' | 'pdf'`) menentukan reader mana yang dibuka. Saat ekstraksi metadata, oper `data.slice(0)` agar buffer asli tidak dikonsumsi.
- Pengaturan di `localStorage` key `ereader-web:settings`; `loadSettings()` melakukan merge dengan `defaultSettings` sehingga field baru aman untuk user lama. Field PDF: `pdfSpread`, `pdfCrop`, `pdfCropMargin`, `pdfZoom`, `pdfReflow`, `pdfScanTheme`.
- Progres EPUB disimpan per CFI; progres PDF per `page` + `percentage` (`ProgressRecord`). Keduanya di-flush saat reader di-unmount.

## Deploy

- Cloudflare Pages: build command `npm run build`, output `dist`.
- `public/_redirects` (SPA fallback) & `public/_headers` (cache `/assets/*` immutable) ikut tersalin ke `dist`.
- Asset pdf.js (`public/pdfjs`) dihasilkan plugin Vite saat build dan ikut ke `dist/pdfjs`; folder sumber di `public/` gitignored.
- Alternatif: `npx wrangler pages deploy dist`.

## Batasan yang diketahui

- Tombol volume hanya *best-effort* (`AudioVolumeUp`/`AudioVolumeDown`); umumnya tidak terkirim ke web di Chrome Android/Safari iOS.
- Spacing paragraf menyasar elemen `<p>`; EPUB yang memakai `<div>` tidak terpengaruh.
- Bookerly proprietary — dipakai Literata sebagai alternatif open-source.
- Reflow PDF hanya mengekstrak teks: tata letak, gambar, dan kolom tidak dipertahankan; halaman scan tidak bisa direflow.
- Crop PDF berbasis ambang tinta; bintik/gumpalan noise yang saling menempel sampai melewati ambang bisa tetap dianggap konten.
- PDF terproteksi/rusak dilaporkan sebagai pesan error (bukan crash); halaman scan besar (JBIG2) bisa lambat dirender di perangkat kelas bawah.
