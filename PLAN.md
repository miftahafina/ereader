# PLAN

Rencana & arsitektur EPUB Reader Web.

## Tujuan

Pembaca EPUB yang ringan, privat, dan bisa dipakai offline — seluruh proses di browser, tanpa server, deploy statis.

## Prinsip

1. **100% client-side** — tidak ada unggahan file ke mana pun.
2. **Offline-first** — file & progres tersimpan lokal (IndexedDB), font self-host.
3. **Statis** — hasil build hanya HTML/CSS/JS, cocok untuk Cloudflare Pages.
4. **Aksesibel & nyaman dibaca** — kontrol tema, font, dan tata letak.

## Arsitektur

```
File .epub (drag & drop)
        │
        ▼
  ArrayBuffer ──► extractMetadata() ──► BookRecord (metadata + sampul)
        │
        ▼
   IndexedDB (store `books`)
        │
        ▼
  Reader (epub.js) ──► iframe (srcdoc) ──► konten buku
        │                    ▲
        │                    └── tema/font disuntik via content hook
        ▼
   IndexedDB (store `progress`) ──► CFI + persentase
```

### Alur state (React)

- `App.tsx` memegang: `settings`, daftar `books`, `progress`, dan `view` (`library` | `reader`).
- `Reader` di-*lazy-load* (epub.js di chunk terpisah) agar library cepat dibuka.
- Setiap perubahan `settings` langsung diterapkan ke rendition yang aktif.

### Titik integrasi epub.js

| Kebutuhan | Mekanisme |
| --- | --- |
| Render isi | `book.renderTo(...)` + `<iframe srcdoc>` |
| Tema/font | `rendition.hooks.content` + `contents.addStylesheetCss` |
| Daftar isi | `book.loaded.navigation.toc` |
| Progres | event `relocated` + `book.locations.percentageFromCfi` |
| Layout 2 kolom | opsi `spread: 'auto'` + `minSpreadWidth` |
| Navigasi mobile | event `click`/`touch*` yang diteruskan dari iframe |

## Status fitur

### Selesai
- [x] Drag & drop & impor banyak file `.epub`
- [x] Perpustakaan lokal (sampul, judul, penulis, progres) di IndexedDB
- [x] Reader: navigasi halaman, keyboard, tap zone, swipe
- [x] Daftar isi rekursif + lompat bab
- [x] Simpan & lanjutkan posisi baca (CFI), flush saat keluar
- [x] Tema terang/sepia/gelap
- [x] Font Literata (mirip Bookerly) sebagai default + opsi font lain
- [x] Ukuran huruf, jarak baris, jarak antar paragraf, lebar kolom
- [x] Mode halaman / gulir
- [x] Layout 2 kolom otomatis di desktop/tablet landscape
- [x] Tombol volume (best-effort) & toggle toolbar via tap tengah
- [x] Konfigurasi Cloudflare Pages

### Roadmap (belum)
- [ ] Bookmark & anotasi (highlight) per CFI
- [ ] Pencarian teks di dalam buku
- [ ] Upload font kustom (disimpan di IndexedDB)
- [ ] Ekspor/impor data perpustakaan & progres (JSON)
- [ ] Statistik baca (waktu, halaman) & target harian
- [ ] Dukungan lebih baik untuk EPUB fixed-layout (komik/manga)
- [ ] Indentasi baris pertama & kontrol margin halaman
- [ ] PWA (service worker, install ke home screen)
- [ ] Sinkronisasi progres antar perangkat (opsional, butuh backend)

## Keputusan teknis

- **epub.js** dipilih karena matang dan mendukung iframe render; risiko utamanya quirk tema (lihat `AGENTS.md`).
- **Literata** menggantikan Bookerly (proprietary) karena lisensi OFL-1.1 dan karakter mirip.
- **idb** dipakai sebagai wrapper IndexedDB yang tipis.
- **Lazy-load Reader** untuk memisahkan bundle epub.js (~104 KB gzip) dari bundle awal (~73 KB gzip).
- **Tanpa StrictMode** untuk menghindari inisialisasi ganda rendition epub.js saat dev.

## Batasan yang diketahui

- Tombol volume tidak dapat diandalkan di web (OS menahannya).
- Paragraf `<div>` tidak kena pengaturan jarak paragraf.
- EPUB dengan layout tetap kompleks belum dioptimalkan.
