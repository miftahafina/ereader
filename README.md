# EPUB Reader Web

Pembaca EPUB yang berjalan **sepenuhnya di browser**. Cukup seret (drag & drop) file `.epub`, dan seluruh proses parsing, render, serta penyimpanan terjadi di perangkat — tidak ada file yang diunggah ke server. Cocok untuk deploy statis di Cloudflare Pages.

## Fitur

- Drag & drop file EPUB (bisa banyak sekaligus)
- Buku sampel bawaan siap baca (Alice in Wonderland, The Time Machine, Pride and Prejudice)
- Perpustakaan lokal: sampul, judul, penulis, dan progres (IndexedDB)
- Daftar isi (TOC) rekursif + lompat bab
- Simpan & lanjutkan posisi baca (CFI)
- Tema: terang, sepia, gelap
- Font **Literata** default, plus opsi font lain
- Pengaturan: ukuran huruf, jarak baris, jarak antar paragraf, lebar kolom, mode halaman/gulir
- Layout **2 kolom** otomatis di desktop/tablet landscape
- Navigasi mobile: tap kiri/kanan, swipe, tap tengah untuk sembunyikan toolbar, tombol volume (best-effort)
- Layar penuh (Fullscreen API) di perpustakaan & reader
- 100% client-side & offline-capable

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

Konfigurasi ada di `wrangler.jsonc`. File `public/_redirects` dan `public/_headers` otomatis tersalin ke `dist`.

## Struktur proyek

```
src/
  App.tsx                  state view library/reader, impor file, drop zone
  index.css                styling + CSS variables tema
  lib/                     types, db (IndexedDB), epub, settings, fontFaces
  hooks/useFileDrop.ts     deteksi drag & drop level window
  components/              Library, Reader, Toc, SettingsPanel
public/                    _redirects, _headers, favicon, samples/*.epub
wrangler.jsonc             konfigurasi Cloudflare Pages
```

Dokumentasi tambahan: [`AGENTS.md`](./AGENTS.md) (konvensi & catatan teknis) dan [`PLAN.md`](./PLAN.md) (arsitektur & roadmap).

## Teknologi

- React 19 + TypeScript + Vite
- [epub.js](https://github.com/futurepress/epub.js) — parsing & render EPUB
- [idb](https://github.com/jakearchibald/idb) — penyimpanan IndexedDB
- [@fontsource-variable/literata](https://fontsource.org/fonts/literata) — font baca (OFL-1.1)
- [oxlint](https://oxc.rs) — linting

## Lisensi

Kode proyek ini tersedia bebas. Font Literata berlisensi SIL Open Font License 1.1.
