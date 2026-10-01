# Third-Party Notices

Aplikasi ini mendistribusikan perangkat lunak dan aset pihak ketiga. Daftar berikut berlaku untuk hasil build (`dist/`) maupun source.

## Dependensi runtime

| Komponen | Lisensi | Situs |
| --- | --- | --- |
| [React](https://react.dev) & React DOM | MIT | https://github.com/facebook/react |
| [epub.js](https://github.com/futurepress/epub.js) | BSD-2-Clause | https://github.com/futurepress/epub.js |
| [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) | Apache-2.0 | https://github.com/mozilla/pdf.js |
| [idb](https://github.com/jakearchibald/idb) | ISC | https://github.com/jakearchibald/idb |
| [Literata](https://fontsource.org/fonts/literata) (`@fontsource-variable/literata`) | SIL OFL-1.1 | https://github.com/fontsource/font-files |

## Aset pdf.js

pdf.js memuat aset tambahan untuk mendekode scan (JBIG2/JPX) dan teks CJK. Aset ini disalin dari `node_modules/pdfjs-dist` ke `public/pdfjs/` (dan ikut ke `dist/pdfjs/`) oleh plugin Vite di `vite.config.ts`. Salinan teks lisensi aslinya ikut tersalin di lokasi berikut:

| Aset | Lisensi | Teks lisensi |
| --- | --- | --- |
| Inti pdf.js | Apache-2.0 | `public/pdfjs/LICENSE` |
| `wasm/` — JBIG2 | Apache-2.0 | `public/pdfjs/wasm/LICENSE_JBIG2`, `LICENSE_PDFJS_JBIG2` |
| `wasm/` — OpenJPEG | BSD-2-Clause | `public/pdfjs/wasm/LICENSE_OPENJPEG`, `LICENSE_PDFJS_OPENJPEG` |
| `wasm/` — QCMS | MIT | `public/pdfjs/wasm/LICENSE_QCMS`, `LICENSE_PDFJS_QCMS` |
| `standard_fonts/` — Foxit | BSD-style (PDFium) | `public/pdfjs/standard_fonts/LICENSE_FOXIT` |
| `standard_fonts/` — Liberation | GPL-2.0 dengan pengecualian font | `public/pdfjs/standard_fonts/LICENSE_LIBERATION` |
| `cmaps/` | BSD-3-Clause (Adobe) | `public/pdfjs/cmaps/LICENSE` |

Teks lisensi lengkap untuk dependensi runtime tersedia di masing-masing paket di `node_modules/`.
