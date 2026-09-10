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
  App.tsx                  state view library/reader, impor file, drop zone
  index.css                seluruh styling + CSS variables tema
  lib/
    types.ts               tipe bersama (BookRecord, ReaderSettings, dll)
    db.ts                  IndexedDB: store `books` & `progress`
    epub.ts                ekstraksi metadata + sampul dari file EPUB
    settings.ts            default, palette tema, opsi font, persist localStorage
    fontFaces.ts           @font-face Literata (URL absolut) untuk iframe
  hooks/
    useFileDrop.ts         deteksi drag & drop file level window
  components/
    Library.tsx            grid buku + impor + hapus
    Reader.tsx             integrasi epub.js, navigasi, tema, gesture
    Toc.tsx                daftar isi rekursif
    SettingsPanel.tsx      kontrol tampilan
public/
  _redirects, _headers     konfigurasi Cloudflare Pages
wrangler.jsonc             konfigurasi deploy Pages
```

## Konvensi kode

- **Jangan tambahkan komentar** kecuali diminta.
- Type-only import wajib: `import type { X } from '...'` (`verbatimModuleSyntax: true`).
- `noUnusedLocals` & `noUnusedParameters` aktif; `erasableSyntaxOnly` aktif (tanpa `enum`, `namespace`, parameter properties).
- Styling terpusat di `src/index.css`. Tema memakai CSS variables di `:root[data-theme="light|sepia|dark"]`; `data-theme` di-set di `document.documentElement` oleh `App.tsx`.
- Bahasa UI: Indonesia.

## Catatan penting epub.js (jangan diubah tanpa alasan)

- Isi buku dirender di `<iframe srcdoc sandbox="allow-same-origin">`. CSS/font dari dokumen induk **tidak** otomatis tembus ke iframe.
- Tema & font disuntik lewat **content hook** `rendition.hooks.content.register(...)` + `contents.addStylesheetCss(css, 'ereader')` (lihat `buildReaderCss`/`applyReaderTheme` di `Reader.tsx`). Jangan hanya pakai `themes.registerCss` + `select` — epub.js melewati tema `serialized` saat konten pertama dimuat.
- Font di iframe butuh `@font-face` dengan URL absolut (`src/lib/fontFaces.ts`).
- Koordinat event yang diteruskan dari iframe (mis. `click`) relatif terhadap viewport iframe yang **lebih lebar dari layar** (konten kolom). Untuk tap zone, konversi dengan `frame.getBoundingClientRect()` dikurangi rect `.reader-viewer` (lihat `onTap`).
- Layout 2 kolom (spread) aktif otomatis bila lebar area baca ≥ `SPREAD_MIN_WIDTH` (1000px) dan mode `paginated`. `stageMaxWidth` dihitung di `Reader.tsx`.
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
