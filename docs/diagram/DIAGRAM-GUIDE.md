# Panduan Diagram draw.io — OlaATK

Dokumentasi *style guide* dan *workflow* pembuatan diagram DFD & ERD menggunakan draw.io MCP.  
Dibuat untuk proyek OlaATK (Manajemen Percetakan & ATK), bisa dipakai ulang untuk proyek lain.

---

## Daftar Isi

1. [Konvensi Umum](#1-konvensi-umum)
2. [Struktur File](#2-struktur-file)
3. [Style Sheet — Hitam-Putih](#3-style-sheet--hitam-putih)
4. [DFD — Data Flow Diagram](#4-dfd--data-flow-diagram)
5. [ERD — Entity Relationship Diagram](#5-erd--entity-relationship-diagram)
6. [draw.io XML Tips & Trik](#6-drawio-xml-tips--trik)
7. [Layout & Tata Letak](#7-layout--tata-letak)
8. [Proyek Lain: Template Cepat](#8-proyek-lain-template-cepat)

---

## 1. Konvensi Umum

| Aturan | Nilai |
|--------|-------|
| Warna | **Hitam-putih** (`#FFFFFF` fill, `#000000` stroke/font) |
| Sudut | **Tidak dibulatkan** (`rounded=0`) |
| Garis | **Siku-siku/orthogonal** (`edgeStyle=orthogonalEdgeStyle`, `curved=0`, `rounded=0`) |
| Font | `fontSize=10`, `fontColor=#000000` |
| Border | `strokeWidth=2` untuk shape, `strokeWidth=1` default untuk edge |
| HTML label | Selalu sertakan `html=1;whiteSpace=wrap;` di style |
| Bahasa | **Indonesia** untuk semua label, dokumentasi, komentar |

### Rationale

- Hitam-putih: cocok untuk **laporan akademik/cetak**, tidak bergantung pada printer warna.
- `rounded=0`: tampilan formal, konsisten dengan notasi DFD tradisional.
- `orthogonalEdgeStyle`: garis siku-siku lebih mudah dibaca daripada garis diagonal/curve.

---

## 2. Struktur File

```
docs/diagram/
  d1.drawio    — Diagram Konteks (DFD Level 0)
  d2.drawio    — Diagram Nol / Level 0
  d3.drawio    — Diagram Rinci Proses 2 (Pesanan)
  d4.drawio    — Diagram Rinci Proses 3 (Pelanggan & Akun)
  d5.drawio    — Diagram Rinci Proses 4 (POS & Laporan)
  d6.drawio    — Diagram Rinci Proses 5 (Stok Barang)
  d7.drawio    — Diagram Rinci Proses 6 (Layanan)
  d8.drawio    — Entity Relationship Diagram (ERD)
```

### Aturan penamaan

- `d{N}.drawio` — urut sesuai gambar di laporan.
- `d1` = diagram konteks, `d2` = level 0, `d3`–`d7` = diagram rinci per proses, `d8` = ERD.
- Setiap file bisa punya 1 diagram di dalam `<diagram>` (tidak perlu multi-tab dalam 1 file).

---

## 3. Style Sheet — Hitam-Putih

Semua style berikut konsisten dipakai di **semua** diagram.

### 3.1 External Entity (Actor)

```xml
style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;strokeWidth=2;"
```

- Ukuran standar: `w="100" h="80"`
- Label pake `<b>NAMA</b>` bold

### 3.2 Proses

```xml
style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;strokeWidth=2;"
```

- Ukuran standar level 0: `w="140" h="46"`
- Ukuran standar rinci: `w="150" h="46"`

### 3.3 Data Store

```xml
style="shape=datastore;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;strokeWidth=2;"
```

- Ukuran standar: `w="120" h="46"`
- Label: `<b>DS{N}</b> Nama`

### 3.4 Edge (Data Flow / Relationship)

```xml
style="html=1;fontColor=#000000;strokeColor=#000000;fontSize=10;edgeStyle=orthogonalEdgeStyle;curved=0;rounded=0;"
```

- Label flow ditulis di `value` edge.
- Untuk garis dengan waypoint, gunakan `<Array as="points">` di dalam `<mxGeometry>`.

### 3.5 Tabel Entity (ERD)

Untuk ERD dengan atribut detail, pakai `shape=table`:

```xml
<!-- Container table -->
style="shape=table;childLayout=tableLayout;startSize=0;collapsible=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;fontColor=#000000;"

<!-- Header row -->
style="shape=tableRow;horizontal=0;startSize=0;collapsible=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;"
  <!-- Header cell -->
  style="shape=partialRectangle;html=1;whiteSpace=wrap;overflow=hidden;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontStyle=1;align=center;verticalAlign=middle;strokeWidth=2;"

<!-- Body row -->
style="shape=tableRow;horizontal=0;startSize=0;collapsible=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;"
  <!-- Body cell -->
  style="shape=partialRectangle;html=1;whiteSpace=wrap;overflow=hidden;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;align=left;verticalAlign=top;strokeWidth=2;spacingLeft=4;spacingTop=4;fontSize=10;"
```

---

## 4. DFD — Data Flow Diagram

### 4.1 Leveling

| Level | Diagram | Konten |
|-------|---------|--------|
| **Konteks** (Level 0) | `d1.drawio` | 1 proses pusat + external entities |
| **Nol** (Level 1) | `d2.drawio` | Dekomposisi proses konteks jadi 6 proses |
| **Rinci** (Level 2) | `d3`–`d7` | Dekomposisi per proses jadi sub-proses |

### 4.2 Notasi

| Elemen | Bentuk draw.io | Style |
|--------|---------------|-------|
| **External Entity** | Rectangle (`rounded=0`) | Lihat §3.1 |
| **Proses** | Rectangle (`rounded=0`) | Lihat §3.2. Label: `{N}. {Nama}"` |
| **Data Store** | `shape=datastore` | Lihat §3.3. Label: `DS{N} Nama` |
| **Data Flow** | Edge | Lihat §3.4. Setiap data flow jadi satu garis terpisah |

### 4.3 Penomoran Proses

```
Level 0:     1             2             3          ...   6
             Verifikasi    Pengolahan    Pengolahan        Pengolahan
             Login         Data Pesanan  Data Pelanggan    Data Layanan
                                        & Akun

Level Rinci: 2.1 Tambah    2.2 Lihat    2.3 Edit    2.4 Hapus    2.5 Ubah Status
             Data Pesanan  Data Pesanan Data Pesanan Data Pesanan Pesanan
```

### 4.4 Aturan Data Flow

- Setiap data flow **satu label per garis** (tidak digabung).
- Untuk proses dengan multi-arah, buat edge terpisah (misal: Admin→Proses = satu edge, Proses→Admin = edge lain).
- Label flow menggunakan **huruf kecil** (kecuali nama proper), ditempatkan di tengah edge.
- Gunakan waypoint `<Array as="points">` untuk routing manual supaya garis tidak tabrakan.

### 4.5 Tata Letak Level 0 — 1 Kolom Vertikal

```
┌─────────┐
│  ADMIN  │──────→ 1. Verifikasi Login
└─────────┘        ┌──────────────────┐
  │                │ 2. Pesanan       │──→ DS3 Pesanan
  │                ├──────────────────┤
  ├───────────────→│ 3. Pelanggan     │──→ DS1 Pelanggan
  │                │    & Akun        │──→ DS2 AkunPelanggan
  ├───────────────→│ 4. POS & Laporan │──→ DS3 Pesanan
  │                ├──────────────────┤
  ├───────────────→│ 5. Stok Barang   │──→ DS4 StokBarang
  │                ├──────────────────┤
  └───────────────→│ 6. Layanan       │──→ DS6 DataLayanan
                   └──────────────────┘
```

Semua proses di satu kolom vertikal (x sama) supaya garis dari/tuju lurus.  
External entities (Admin/Pelanggan) di kiri/kanan.

### 4.6 Tata Letak Rinci

```
        ┌─────────┐
        │  ADMIN  │
        └────┬────┘
     ┌───────┼───────────────────────┐
     │       │                       │
     ↓       ↓                       ↓
┌──────────┐  ┌──────────┐    ┌──────────┐
│ 2.1      │  │ 2.2      │    │ 2.5      │
│ Tambah   │  │ Lihat    │    │ Ubah     │
│ Pesanan  │  │ Pesanan  │    │ Status   │
└────┬─────┘  └────┬─────┘    └────┬─────┘
     │             │               │
     └──────┬──────┴───────┬───────┘
            │              │
         ┌──▼──┐     ┌─────┴──────┐
         │ DS3 │     │ PELANGGAN  │
         │     │     │ (USER)     │
         └─────┘     └────────────┘
```

Setiap sub-proses di baris yang sama, data store di kanan, external entity di kanan bawah.

---

## 5. ERD — Entity Relationship Diagram

### 5.1 Tabel Entity

Setiap entity digambar sebagai `shape=table` dengan 2 baris:

```
┌─────────────────────┐
│      Pelanggan       │  ← Header row (entity name, bold, centered, 28px)
├─────────────────────┤
│ # id : Int (PK)     │
│ nama_lengkap : Str  │  ← Body row (attributes, left-aligned, fontSize=10)
│ nomor_telepon : Str │     spacingLeft=4, spacingTop=4
│ alamat : String?    │
│ created_at : DT     │
│ updated_at : DT     │
└─────────────────────┘
```

### 5.2 Atribut Labeling

| Prefix | Arti | Contoh |
|--------|------|--------|
| `#` + `(PK)` | Primary Key | `# id : Int (PK)` |
| `*` + `(FK)` | Foreign Key | `* id_pelanggan : Int (FK)` |
| `?` | Nullable field | `alamat : String?` |
| `[enum]` | Enum type | `status : StatusPesanan [enum]` |
| `[unique]` | Unique constraint | `kunci : String [unique]` |

### 5.3 Relasi & Crow's Foot

Gunakan `edgeStyle=orthogonalEdgeStyle` (bukan `entityRelationEdgeStyle`) dengan properti `startArrow` dan `endArrow`:

| Kardinalitas | Arrow draw.io | Contoh Relasi |
|-------------|---------------|---------------|
| **1** (exactly one) | `ERone` | Satu Pelanggan memiliki banyak Pesanan |
| **N** (one or many) | `ERmany` | Banyak Pesanan dimiliki satu Pelanggan |
| **0..1** (zero or one) | `ERzeroToOne` | Satu Pelanggan punya 0 atau 1 AkunPelanggan |
| **0..N** (zero or many) | `ERzeroToMany` | Satu StokBarang tercatat di 0 atau banyak BarangTerbeli |

### 5.4 Field-Level Connection

Garis relasi harus **nempel ke field spesifik**, bukan ke entity box doang.  
Caranya: hitung `exitY` / `entryY` berdasarkan posisi field di body tabel.

**Rumus:**

```
exitY (atau entryY) = (header_height + spacingTop + (line_index * line_height) + line_height/2) / total_entity_height
```

Parameter:
- `header_height` = 28px
- `spacingTop` = 4px
- `line_height` ≈ 14px (fontSize=10)
- `line_index` = 0-based (0 = baris pertama body)
- `total_entity_height` = header + body

**Contoh — `* id_pelanggan` di AkunPelanggan (line index = 1):**

```
total_y = 28 + 4 + (1 * 14) + 7 = 53
exitY = 53 / 178 = 0.298
```

### 5.5 Contoh Edge dengan Field-Level Connection

```xml
<!-- AkunPelanggan.id_pelanggan (FK) → Pelanggan.id (PK) -->
<mxCell id="r1" edge="1" parent="1" source="akun_tbl" target="pel_tbl"
  style="html=1;fontColor=#000000;strokeColor=#000000;fontSize=10;
         edgeStyle=orthogonalEdgeStyle;
         startArrow=ERone;endArrow=ERzeroToOne;
         rounded=0;curved=0;
         exitX=0;exitY=0.298;exitDx=0;exitDy=0;
         entryX=0;entryY=0.264;entryDx=0;entryDy=0;"
  value="&lt;i&gt;memiliki&lt;/i&gt;">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="8" y="73" />
      <mxPoint x="8" y="289" />
    </Array>
  </mxGeometry>
</mxCell>
```

---

## 6. draw.io XML Tips & Trik

### 6.1 Struktur Dasar File

```xml
<mxfile host="app.diagrams.net">
  <diagram name="Halaman-1" id="d1">
    <mxGraphModel dx="1030" dy="1008" grid="0" gridSize="10"
                  pageWidth="900" pageHeight="700" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- ... shapes & edges ... -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 6.2 Waypoints untuk Routing Manual

Gunakan `<Array as="points">` ketika garis perlu belok menghindari shape lain:

```xml
<mxGeometry relative="1" as="geometry">
  <Array as="points">
    <mxPoint x="160" y="174" />  <!-- titik belok 1 -->
    <mxPoint x="160" y="73" />   <!-- titik belok 2 -->
  </Array>
</mxGeometry>
```

**Aturan waypoint untuk DFD 1 kolom vertikal:**

- Garis dari Admin (kiri) ke proses: exit Admin di berbagai `exitY` (0.25 / 0.42 / 0.55 / 0.68 / 0.82) → waypoint x bervariasi (160/175/190) supaya garis vertikal gak numpuk.
- Garis dari proses ke data store (kanan): exit proses di `exitX=1` → waypoint di x=420 (antara proses dan data store) → masuk data store di kiri.

### 6.3 HTML di Label

- Semua shape harus punya `html=1` di style.
- Gunakan `<b>`, `<br>`, `<hr>`, `<i>` untuk format.
- Di nilai atribut XML: `&lt;b&gt;` untuk `<b>`, `&lt;br&gt;` untuk `<br>`.

```xml
value="&lt;b&gt;2.1 Tambah&lt;br&gt;Data Pesanan&lt;/b&gt;"
```

- Untuk teks dengan tanda `&`, gunakan `&amp;` (misal: `Pelanggan &amp; Akun`).

### 6.4 entityRelationEdgeStyle vs orthogonalEdgeStyle

| Style | Kegunaan |
|-------|----------|
| `entityRelationEdgeStyle` | ERD dengan crow's foot — tapi kadang sulit dikombinasikan dengan waypoint |
| `orthogonalEdgeStyle` | **Rekomendasi**: lebih fleksibel dengan waypoint, dan tetap bisa pake `startArrow`/`endArrow` untuk ER notation |

Untuk ERD, **gunakan `orthogonalEdgeStyle`** dengan arrow ER manual.

### 6.5 exitX/exitY dan entryX/entryY

Properti untuk menentukan titik keluar/masuk edge dari shape, dalam koordinat relatif (0–1):

| Properti | 0 | 0.5 | 1 |
|----------|---|---|---|
| `exitX` | Kiri shape | Tengah horizontal | Kanan shape |
| `exitY` | Atas shape | Tengah vertikal | Bawah shape |

Kombinasi:

| exitX, exitY | Posisi |
|--------------|--------|
| 1, 0.5 | Kanan, tengah vertikal |
| 0.5, 1 | Bawah, tengah horizontal |
| 0, 0.3 | Kiri, 30% dari atas |
| 0.75, 0 | Atas, 75% dari kiri |

---

## 7. Layout & Tata Letak

### 7.1 Grid Referensi (DFD)

```
Kolom: x = col * 180 + offset
        col 0 = 40 (untuk shapes di kiri)
        col 1 = 228 (proses)
        col 2 = 488 (data store)
        col 3 = 708 (external entity)

Baris: y = row * 75 + offset
        row 0 = 50 (proses pertama)
        row 1 = 125
        row 2 = 200
        row 3 = 275
        ...
        Gap antar proses = 29px (75 - 46)
```

### 7.2 Ukuran Shape Standar

| Shape | Width | Height |
|-------|-------|--------|
| External Entity | 100 | 80 |
| Proses (level 0) | 140 | 46 |
| Proses (rinci) | 150 | 46 |
| Data Store | 120 | 46 |
| ERD Header Row | — | 28 |
| ERD Body per ~6 field | — | ~120 |

### 7.3 Canvas Size

| Diagram | pageWidth | pageHeight |
|---------|-----------|------------|
| Konteks (d1) | 700 | 400 |
| Level 0 (d2) | 1169 | 1169 |
| Rinci (d3-d7) | 900 | 500-600 |
| ERD (d8) | 950 | 700 |

---

## 8. Proyek Lain: Template Cepat

Untuk bikin diagram baru dari awal, cukup copy-paste template berikut:

### DFD — Satu Proses dengan CRUD

```xml
<!-- Admin -->
<mxCell id="admin" vertex="1" parent="1"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;strokeWidth=2;"
  value="&lt;b&gt;ADMIN&lt;/b&gt;">
  <mxGeometry x="-95" y="185" width="100" height="80" as="geometry" />
</mxCell>

<!-- Proses 1 -->
<mxCell id="p1" vertex="1" parent="1"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;strokeWidth=2;"
  value="&lt;b&gt;1. Nama Proses&lt;/b&gt;">
  <mxGeometry x="228" y="170" width="150" height="46" as="geometry" />
</mxCell>

<!-- Edge: Admin → Proses -->
<mxCell id="e1" edge="1" parent="1" source="admin" target="p1"
  style="html=1;fontColor=#000000;strokeColor=#000000;fontSize=10;edgeStyle=orthogonalEdgeStyle;curved=0;rounded=0;"
  value="aksi">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="175" y="219" />
      <mxPoint x="175" y="193" />
    </Array>
  </mxGeometry>
</mxCell>
```

### ERD — Satu Entity

```xml
<mxCell id="ent_tbl" vertex="1" parent="1"
  style="shape=table;childLayout=tableLayout;startSize=0;collapsible=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;fontColor=#000000;">
  <mxGeometry x="30" y="20" width="240" height="150" as="geometry"/>
</mxCell>
<mxCell id="ent_hdr" vertex="1" parent="ent_tbl"
  style="shape=tableRow;horizontal=0;startSize=0;collapsible=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;">
  <mxGeometry width="240" height="28" as="geometry"/>
</mxCell>
<mxCell id="ent_hdr_cell" vertex="1" parent="ent_hdr"
  style="shape=partialRectangle;html=1;whiteSpace=wrap;overflow=hidden;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontStyle=1;align=center;verticalAlign=middle;strokeWidth=2;"
  value="&lt;b&gt;NamaEntity&lt;/b&gt;">
  <mxGeometry width="240" height="28" as="geometry"/>
</mxCell>
<mxCell id="ent_body" vertex="1" parent="ent_tbl"
  style="shape=tableRow;horizontal=0;startSize=0;collapsible=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;">
  <mxGeometry y="28" width="240" height="122" as="geometry"/>
</mxCell>
<mxCell id="ent_body_cell" vertex="1" parent="ent_body"
  style="shape=partialRectangle;html=1;whiteSpace=wrap;overflow=hidden;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;align=left;verticalAlign=top;strokeWidth=2;spacingLeft=4;spacingTop=4;fontSize=10;"
  value="&lt;b&gt;#&lt;/b&gt; id : Int (PK)&lt;br&gt;nama_field : String&lt;br&gt;...">
  <mxGeometry width="240" height="122" as="geometry"/>
</mxCell>
```

---

## Referensi

- **draw.io style reference:** https://github.com/jgraph/drawio-mcp/blob/main/shared/style-reference.md
- **draw.io XML schema:** https://github.com/jgraph/drawio-mcp/blob/main/shared/mxfile.xsd
- **Kode sumber OlaATK:** `backend/src/prisma/schema/` untuk referensi model database
- **Laporan akademik:** `docs/tulisan.txt` untuk konteks deskripsi diagram

---

*Dibuat dengan draw.io MCP untuk proyek OlaATK — 23 Juni 2026*
