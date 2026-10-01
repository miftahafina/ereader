# EPUB & PDF Reader Web

Pembaca **EPUB & PDF** yang berjalan **sepenuhnya di browser**. Cukup seret (drag & drop) file `.epub`/`.pdf`, dan seluruh proses parsing, render, serta penyimpanan terjadi di perangkat — tidak ada file yang diunggah ke server. Cocok untuk deploy statis di Cloudflare Pages.

## Fitur

### Umum
- Drag & drop file EPUB & PDF (bisa banyak sekaligus)
- Buku sampel bawaan siap baca (Alice in Wonderland, The Time Machine, Pride and Prejudice)
- Perpustakaan lokal: sampul, judul, penulis, dan progres (IndexedDB)
- Simpan & lanjutkan posisi baca
- Tema: terang, sepia, gelap
- Font **Literata** default, plus opsi font lain
- Layar penuh (Fullscreen API) di perpustakaan & reader
- 100% client-side & offline-capable

### EPUB
- Daftar isi (TOC) rekursif + lompat bab
- Pencarian teks di seluruh buku dengan daftar hasil & sorotan lompatan
- Pengaturan: ukuran huruf, jarak baris, jarak antar paragraf, rata teks (bawaan/kiri/tengah/kanan/rata), lebar kolom, mode halaman/gulir, bahasa tujuan terjemahan
- Layout **2 kolom** otomatis di desktop/tablet landscape
- Navigasi mobile: tap kiri/kanan, swipe, tap tengah untuk sembunyikan toolbar, tombol volume (best-effort)
- **Terjemahan** teks saat ini (per bagian, in-place, tidak mengubah file) ke bahasa pilihan via Google Translate
- **Text-to-speech** (Web Speech API): kecepatan, nada, dan pilihan suara
- **Popup kamus** Wiktionary: tap sebuah kata untuk melihat arti, dengan bottom sheet di mobile

### PDF
- Render halaman ke canvas via **pdf.js** (termasuk scan JBIG2/JPX & teks CJK)
- Tampilan **2 halaman** berdampingan (Otomatis/1/2) + zoom
- **Crop margin** otomatis dengan deteksi konten yang tahan bintik scan, plus pengaturan sisa margin
- Warna halaman mengikuti tema reader (terang/sepia/gelap) dengan pengaturan transparansi
- Opsi **"Tema untuk halaman scan"** agar halaman hasil scan ikut mengikuti tema
- **Mode reflow** (khusus halaman berteks): mengekstrak teks jadi alineal mengalir, diatur ukuran huruf/jenis huruf/rata teks
- Daftar isi (outline) PDF rekursif

## Buku sampel

Tiga buku public domain dari [Project Gutenberg](https://www.gutenberg.org) ikut dibundel di `public/samples/` dan bisa dimuat lewat tombol **"Baca buku sampel"** saat perpustakaan masih kosong:

- *Alice's Adventures in Wonderland* — Lewis Carroll
- *The Time Machine* — H. G. Wells
- *Pride and Prejudice* — Jane Austen

## Pengembangan

```bash
npm install
npm run dev      # dev server (Vite)
npm run lint     # oxlint
npm run build    # tsc -b && vite build -> dist/
npm run preview  # pratinjau hasil build
```

## Deploy ke Cloudflare Pages

Build command: `npm run build`
Build output directory: `dist`

Atau via Wrangler:

```bash
npx wrangler pages deploy dist
```

Konfigurasi ada di `wrangler.jsonc`. File `public/_redirects` dan `public/_headers` otomatis tersalin ke `dist`. Asset pdf.js (`public/pdfjs`) dihasilkan saat build dan ikut ke `dist/pdfjs`.

## Struktur proyek

```
src/
  main.tsx                  entry React
  App.tsx                   routing view library/reader + drop zone (pilih Reader vs PdfReader)
  index.css                 entry styling (@import ke src/styles/*)
  styles/                   CSS modular (theme, base, library, reader, pdf, dll)
  lib/
    types.ts                tipe bersama
    db.ts                   IndexedDB (store books & progress)
    epub.ts                 ekstraksi metadata & sampul EPUB
    pdf.ts                  loader pdf.js, metadata/sampul/outline, deteksi halaman scan
    pdf-color.ts            remap warna halaman PDF ke tema reader
    pdf-crop.ts             deteksi batas konten (tahan bintik scan) + crop margin
    pdf-reflow.ts           ekstraksi blok teks per halaman untuk reflow
    reader-theme.ts         CSS tema/font reader untuk iframe
    reader-constants.ts     konstanta reader (SPREAD_*, IS_WEBKIT)
    tts-text.ts             ekstraksi teks terlihat dari iframe -> chunk TTS
    search.ts               pencarian teks lintas section (Section.find)
    samples.ts              buku sampel bawaan
    settings.ts             default & persist pengaturan (localStorage)
    translate.ts            penerjemahan (Google Translate endpoint)
    translate-dom.ts        injeksi hasil terjemahan ke iframe
    dictionary.ts           definisi kata (Wiktionary API)
    fontFaces.ts            @font-face Literata untuk iframe
  hooks/                    useFileDrop, useFullscreen, useMediaQuery, useLatest,
                            useVoices, useReaderSession, useEpubRendition,
                            useReadingProgress, useReaderChrome, useReaderLayout,
                            useReaderNavigation, useReaderTts, useSectionTranslation,
                            useWordLookup, useBookSearch, useLibrary, useReaderSettings,
                            useTheme, usePdfDocument, usePdfView, usePdfProgress,
                            usePdfReflow, usePdfReflowPager
  components/
    Library.tsx, Reader.tsx, Toc.tsx, SearchPanel.tsx, SettingsPanel.tsx,
    SettingsControls.tsx, SettingsIcon.tsx, FullscreenButton.tsx, WordPopup.tsx,
    DebugPanel.tsx, PdfReader.tsx, PdfPage.tsx, PdfSettingsPanel.tsx, PdfToc.tsx
public/                     _redirects, _headers, favicon, icons, translate icons, samples/*.epub
                            (pdfjs/ dihasilkan saat build, gitignored)
wrangler.jsonc              konfigurasi Cloudflare Pages
```

Dokumentasi tambahan: [`AGENTS.md`](./AGENTS.md) (konvensi & catatan teknis) dan [`PLAN.md`](./PLAN.md) (arsitektur & roadmap).

## Teknologi

- React 19 + TypeScript + Vite
- [epub.js](https://github.com/futurepress/epub.js) — parsing & render EPUB
- [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) — parsing & render PDF (worker + WASM/font/CMap)
- [idb](https://github.com/jakearchibald/idb) — penyimpanan IndexedDB
- [@fontsource-variable/literata](https://fontsource.org/fonts/literata) — font baca (OFL-1.1)
- Web Speech API — text-to-speech (`window.speechSynthesis`)
- API Google Translate & Wiktionary — terjemahan & kamus (fetch langsung, tanpa dependency)
- [oxlint](https://oxc.rs) — linting

## Lisensi

Kode proyek ini tersedia bebas. Font Literata berlisensi SIL Open Font License 1.1.
