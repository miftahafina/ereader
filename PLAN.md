# PLAN

Rencana & arsitektur EPUB & PDF Reader Web.

## Tujuan

Pembaca EPUB & PDF yang ringan, privat, dan bisa dipakai offline — seluruh proses di browser, tanpa server, deploy statis.

## Prinsip

1. **100% client-side** — tidak ada unggahan file ke mana pun.
2. **Offline-first** — file & progres tersimpan lokal (IndexedDB), font self-host.
3. **Statis** — hasil build hanya HTML/CSS/JS, cocok untuk Cloudflare Pages.
4. **Aksesibel & nyaman dibaca** — kontrol tema, font, dan tata letak.

## Arsitektur

```
File .epub / .pdf (drag & drop)
        │
        ▼
  ArrayBuffer ──► extractMetadata() / extractPdfMetadata() ──► BookRecord (+format)
        │
        ▼
   IndexedDB (store `books`)
        │
        ├─ format = epub ─► Reader (epub.js) ─► iframe (srcdoc) ─► konten buku
        │                        ▲
        │                        └── tema/font disuntik via content hook
        │
        └─ format = pdf ──► PdfReader (pdf.js) ─► <canvas> per halaman
                                 │
                                 ├── recolorForTheme (tema reader)
                                 ├── detectContentBounds + crop (margin)
                                 └── extractReflowBlocks (mode reflow)
        │
        ▼
   IndexedDB (store `progress`) ──► CFI (EPUB) atau page + persentase (PDF)
```

### Alur state (React)

- `App.tsx` memegang: `settings`, daftar `books`, `progress`, dan `view` (`library` | `reader` + `format`).
- `Reader` (epub.js) & `PdfReader` (pdf.js) di-*lazy-load* agar library cepat dibuka dan bundle terpisah.
- Setiap perubahan `settings` langsung diterapkan ke reader yang aktif.
- Hook `useReaderChrome` dipakai bersama EPUB & PDF (panel TOC/settings, chrome tersembunyi).

### Titik integrasi epub.js

| Kebutuhan | Mekanisme |
| --- | --- |
| Render isi | `book.renderTo(...)` + `<iframe srcdoc>` |
| Tema/font | `rendition.hooks.content` + `contents.addStylesheetCss` |
| Daftar isi | `book.loaded.navigation.toc` |
| Progres | event `relocated` + `book.locations.percentageFromCfi` |
| Layout 2 kolom | opsi `spread: 'auto'` + `minSpreadWidth` |
| Navigasi mobile | event `click`/`touch*` yang diteruskan dari iframe |

### Titik integrasi pdf.js

| Kebutuhan | Mekanisme |
| --- | --- |
| Muat dokumen | `getDocument({ data, wasmUrl, standardFontDataUrl, cMapUrl })` |
| Worker | `pdf.worker.min.mjs?url` + `GlobalWorkerOptions.workerSrc` |
| Render halaman | `page.render({ canvas, viewport })` |
| Deteksi scan | `page.getTextContent()` (`pageHasText`) |
| Metadata & sampul | `doc.getMetadata()` + render halaman 1 ke data URL |
| Daftar isi | `doc.getOutline()` + `getDestination`/`getPageIndex` |
| Progres | halaman aktif + persentase |
| Crop margin | `detectContentBounds` + `cropCanvas` (canvas) |
| Tema | `recolorForTheme` (remap warna canvas) |
| Reflow | `extractReflowBlocks` + paginasi CSS multi-column |

## Status fitur

### Selesai
- [x] Drag & drop & impor banyak file `.epub` dan `.pdf`
- [x] Buku sampel bawaan (Alice, The Time Machine, Pride & Prejudice) + cover
- [x] Perpustakaan lokal (sampul, judul, penulis, progres) di IndexedDB
- [x] Reader EPUB: navigasi halaman, keyboard, tap zone, swipe
- [x] Daftar isi rekursif + lompat bab (EPUB & PDF)
- [x] Simpan & lanjutkan posisi baca (CFI EPUB, halaman PDF), flush saat keluar
- [x] Tema terang/sepia/gelap
- [x] Font Literata sebagai default + opsi font lain
- [x] Ukuran huruf, jarak baris, jarak antar paragraf, rata teks, lebar kolom
- [x] Mode halaman / gulir
- [x] Layout 2 kolom otomatis di desktop/tablet landscape
- [x] Tombol volume (best-effort) & toggle toolbar via tap tengah
- [x] Layar penuh (Fullscreen API) di library & reader
- [x] Pencarian teks lintas bagian dengan daftar hasil & sorotan
- [x] Terjemahan per bagian & popup kamus Wiktionary
- [x] Text-to-speech (Web Speech API)
- [x] Ikon pada setiap label setelan (SVG inline)
- [x] Reader PDF: spread 1/2 halaman otomatis, zoom
- [x] Crop margin otomatis (tahan bintik scan) + sisa margin
- [x] Warna halaman PDF mengikuti tema + transparansi, termasuk halaman scan
- [x] Mode reflow PDF (halaman berteks)
- [x] Konfigurasi Cloudflare Pages

### Roadmap (belum)
- [ ] Bookmark & anotasi (highlight) per CFI/halaman
- [ ] OCR untuk halaman PDF hasil scan agar bisa direflow
- [ ] Upload font kustom (disimpan di IndexedDB)
- [ ] Ekspor/impor data perpustakaan & progres (JSON)
- [ ] Statistik baca (waktu, halaman) & target harian
- [ ] Dukungan lebih baik untuk EPUB fixed-layout (komik/manga)
- [ ] Indentasi baris pertama & kontrol margin halaman
- [ ] PWA (service worker, install ke home screen)
- [ ] Sinkronisasi progres antar perangkat (opsional, butuh backend)

## Keputusan teknis

- **epub.js** dipilih karena matang dan mendukung iframe render; risiko utamanya quirk tema (lihat `AGENTS.md`).
- **pdf.js** (`pdfjs-dist`) dipilih karena lengkap (scan JBIG2/JPX, CJK), client-side, dan tanpa backend. Asset WASM/font/CMap disalin ke `public/pdfjs` lewat plugin Vite.
- **Crop PDF** memakai binarisasi sederhana + morfologi (dilasi lalu filter komponen) agar bintik scan tidak memperlebar kotak crop.
- **Reflow PDF** mengekstrak teks per halaman lalu dipaginasi memakai CSS multi-column (bukan scroll kontinu) agar cocok dengan navigasi halaman.
- **Literata** menggantikan Bookerly (proprietary) karena lisensi OFL-1.1 dan karakter mirip.
- **idb** dipakai sebagai wrapper IndexedDB yang tipis.
- **Lazy-load reader** untuk memisahkan bundle epub.js & pdf.js dari bundle awal.
- **Tanpa StrictMode** untuk menghindari inisialisasi ganda rendition epub.js saat dev.

## Batasan yang diketahui

- Tombol volume tidak dapat diandalkan di web (OS menahannya).
- Paragraf `<div>` tidak kena pengaturan jarak paragraf.
- EPUB dengan layout tetap kompleks belum dioptimalkan.
- Reflow PDF hanya teks: tata letak, gambar, dan kolom tidak dipertahankan; halaman scan tidak bisa direflow (butuh OCR).
- Crop PDF berbasis ambang tinta; noise yang menggumpal melewati ambang bisa tetap dianggap konten.
