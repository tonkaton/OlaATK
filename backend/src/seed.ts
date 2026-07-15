import { config } from "dotenv";
import { getPrismaClient } from "./prisma/index.js";
import bcrypt from "bcrypt";

config({ path: [".env"] });

const NOW = new Date();
const START_DATE = new Date(2026, 3, 1);

const CUSTOMERS = [
  { nama: "Aisyah Putri", telepon: "081234567801", alamat: "Jl. Merdeka No. 10, Balaraja" },
  { nama: "Bambang Suprapto", telepon: "081234567802", alamat: "Jl. Sudirman No. 25, Balaraja" },
  { nama: "Citra Dewi Lestari", telepon: "081234567803", alamat: "Perum Griya Indah Blok A3, Balaraja" },
  { nama: "Deni Firmansyah", telepon: "081234567804", alamat: "Kp. Cikaret RT 02/05, Balaraja" },
  { nama: "Endang Sulistyowati", telepon: "081234567805", alamat: "Jl. Raya Serang Km 15, Balaraja" },
  { nama: "Fajar Hidayat", telepon: "081234567806", alamat: "Perum Mutiara Bintaro Blok C5, Balaraja" },
  { nama: "Gina Nuraini", telepon: "081234567807", alamat: "Kp. Babakan RT 01/03, Balaraja" },
  { nama: "Hendra Gunawan", telepon: "081234567808", alamat: "Jl. Pahlawan No. 45, Balaraja" },
  { nama: "Indah Permata Sari", telepon: "081234567809", alamat: "Perum Permata Hijau Blok B2, Balaraja" },
  { nama: "Joko Prasetyo", telepon: "081234567810", alamat: "Kp. Sawah RT 03/02, Balaraja" },
  { nama: "Kartika Sari Dewi", telepon: "081234567811", alamat: "Jl. Diponegoro No. 8, Balaraja" },
  { nama: "Lukman Hakim", telepon: "081234567812", alamat: "Perum Bukit Indah Blok D1, Balaraja" },
  { nama: "Maya Anggraini", telepon: "081234567813", alamat: "Kp. Jati RT 04/01, Balaraja" },
  { nama: "Nurul Hidayah", telepon: "081234567814", alamat: "Jl. Ahmad Yani No. 12, Balaraja" },
  { nama: "Oka Saputra", telepon: "081234567815", alamat: "Perum Garden City Blok E6, Balaraja" },
];

const LAYANAN = ["Penjualan Produk", "Print", "Fotokopi", "Jilid", "Laminating", "Scan"];

const STATUSES = [
  { status: "SELESAI", weight: 70 },
  { status: "DIPROSES", weight: 10 },
  { status: "MENUNGGU", weight: 10 },
  { status: "BATAL", weight: 10 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function weightedRandom(weights: { status: string; weight: number }[]): string {
  const total = weights.reduce((s: number, w: { weight: number }) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.status;
  }
  return weights[weights.length - 1]!.status;
}

function ordersOnDate(d: Date): number {
  const day = d.getDay();
  if (day === 0) return randomInt(0, 1);
  if (day === 6) return randomInt(3, 5);
  return randomInt(2, 4);
}

function randomTimeOn(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), randomInt(7, 20), randomInt(0, 59), randomInt(0, 59));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function calculateCashPayment(total: number): { uangDiterima: number; kembalian: number } {
  const notes = [100000, 50000, 20000, 10000, 5000, 2000];

  // Ambil pecahan terkecil yang >= total
  let uang = notes.find(n => n >= total) ?? 0;

  // Kalo total > 100rb, bayar pake kelipatan 100rb
  if (uang === 0) {
    uang = Math.ceil(total / 100000) * 100000;
  }

  // 25% chance: bayar lebih 1 tingkat (misal 87rb → bayar 100rb, atau 187rb → bayar 300rb)
  if (Math.random() < 0.25) {
    if (total <= 100000) {
      const idx = notes.indexOf(uang);
      if (idx > 0) uang = notes[idx - 1]!;
    } else {
      uang += 100000;
    }
  }
  // Kalo total pas sama nominal (misal 50rb pas), 90% bayar pas
  if (notes.includes(total) && Math.random() < 0.9) {
    uang = total;
  }

  return { uangDiterima: uang, kembalian: uang - total };
}

async function seed() {
  const prisma = await getPrismaClient();

  console.log("Starting database seeding...");

  // ── 1. Hapus data transaksional ──
  console.log("Clearing old transactional data...");
  await prisma.barangTerbeli.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.akunPelanggan.deleteMany();
  await prisma.pelanggan.deleteMany();

  // ── 2. Reseed konfigurasi ──
  console.log("Reseeding konfigurasi...");
  await prisma.konfigurasi.deleteMany();
  await prisma.konfigurasi.createMany({
    data: [
      { kunci: "APP_NAME", nilai: "OLA ATK", deskripsi: "Nama aplikasi", tipe: "text", grup: "umum", urutan: 1 },
      { kunci: "APP_TAGLINE", nilai: "Cetak Online & ATK", deskripsi: "Tagline", tipe: "text", grup: "umum", urutan: 2 },
      { kunci: "CONTACT_PHONE", nilai: "+62 852-1638-8303", deskripsi: "Nomor telepon", tipe: "tel", grup: "kontak", urutan: 3 },
      { kunci: "CONTACT_INSTAGRAM", nilai: "ola.atk.balaraja", deskripsi: "Instagram", tipe: "text", grup: "kontak", urutan: 4 },
      { kunci: "CONTACT_ADDRESS", nilai: "RFF3+J97, Saga, Kec. Balaraja, Kabupaten Tangerang, Banten 15610", deskripsi: "Alamat", tipe: "textarea", grup: "kontak", urutan: 5 },
      { kunci: "CONTACT_HOURS", nilai: "Senin - Sabtu: 06:00 - 21:00", deskripsi: "Jam operasional", tipe: "text", grup: "kontak", urutan: 6 },
      { kunci: "harga_cetak_a4_80gr_bw", nilai: "500", deskripsi: "Harga Cetak A4 80gr B/W", tipe: "number", grup: "harga", urutan: 7 },
      { kunci: "harga_cetak_a4_80gr_color", nilai: "1500", deskripsi: "Harga Cetak A4 80gr Warna", tipe: "number", grup: "harga", urutan: 8 },
      { kunci: "harga_cetak_a4_70gr_bw", nilai: "400", deskripsi: "Harga Cetak A4 70gr B/W", tipe: "number", grup: "harga", urutan: 9 },
      { kunci: "harga_cetak_a4_70gr_color", nilai: "1000", deskripsi: "Harga Cetak A4 70gr Warna", tipe: "number", grup: "harga", urutan: 10 },
      { kunci: "harga_cetak_f4_80gr_bw", nilai: "600", deskripsi: "Harga Cetak F4 80gr B/W", tipe: "number", grup: "harga", urutan: 11 },
      { kunci: "harga_cetak_f4_80gr_color", nilai: "2000", deskripsi: "Harga Cetak F4 80gr Warna", tipe: "number", grup: "harga", urutan: 12 },
      { kunci: "harga_cetak_f4_70gr_bw", nilai: "500", deskripsi: "Harga Cetak F4 70gr B/W", tipe: "number", grup: "harga", urutan: 13 },
      { kunci: "harga_cetak_f4_70gr_color", nilai: "1500", deskripsi: "Harga Cetak F4 70gr Warna", tipe: "number", grup: "harga", urutan: 14 },
      { kunci: "harga_cetak_a4_bw", nilai: "500", deskripsi: "Harga Cetak A4 B/W (legacy)", tipe: "number", grup: "harga", urutan: 15 },
      { kunci: "harga_cetak_a4_color", nilai: "1500", deskripsi: "Harga Cetak A4 Warna (legacy)", tipe: "number", grup: "harga", urutan: 16 },
      { kunci: "harga_cetak_f4_bw", nilai: "600", deskripsi: "Harga Cetak F4 B/W (legacy)", tipe: "number", grup: "harga", urutan: 17 },
      { kunci: "harga_cetak_f4_color", nilai: "2000", deskripsi: "Harga Cetak F4 Warna (legacy)", tipe: "number", grup: "harga", urutan: 18 },
      { kunci: "harga_jilid_lakban", nilai: "3000", deskripsi: "Biaya Jilid Lakban", tipe: "number", grup: "harga", urutan: 19 },
      { kunci: "harga_jilid_softcover", nilai: "15000", deskripsi: "Biaya Jilid Softcover", tipe: "number", grup: "harga", urutan: 20 },
      { kunci: "harga_jilid_hardcover", nilai: "35000", deskripsi: "Biaya Jilid Hardcover", tipe: "number", grup: "harga", urutan: 21 },
      { kunci: "harga_jilid_spiral", nilai: "10000", deskripsi: "Biaya Jilid Spiral", tipe: "number", grup: "harga", urutan: 22 },
      { kunci: "harga_fotokopi_a4", nilai: "300", deskripsi: "Harga Fotokopi A4", tipe: "number", grup: "harga", urutan: 23 },
      { kunci: "harga_fotokopi_f4", nilai: "500", deskripsi: "Harga Fotokopi F4", tipe: "number", grup: "harga", urutan: 24 },
      { kunci: "harga_fotokopi_a4_color", nilai: "2000", deskripsi: "Harga Fotokopi A4 Warna", tipe: "number", grup: "harga", urutan: 25 },
      { kunci: "harga_fotokopi_f4_color", nilai: "2500", deskripsi: "Harga Fotokopi F4 Warna", tipe: "number", grup: "harga", urutan: 26 },
      { kunci: "harga_laminating_a4", nilai: "5000", deskripsi: "Harga Laminating A4", tipe: "number", grup: "harga", urutan: 27 },
      { kunci: "harga_laminating_f4", nilai: "6000", deskripsi: "Harga Laminating F4", tipe: "number", grup: "harga", urutan: 28 },
      { kunci: "harga_scan", nilai: "1500", deskripsi: "Harga Scan", tipe: "number", grup: "harga", urutan: 29 },
    ],
  });

  // ── 3. Seed data_layanan ──
  console.log("Seeding data_layanan...");
  await prisma.dataLayanan.deleteMany();
  await prisma.dataLayanan.createMany({
    data: [
      { nama: "Print", deskripsi: "PDF, DOCX — A4/A3 — B/W & Warna", nama_icon: "printer", status_layanan: true },
      { nama: "Fotokopi", deskripsi: "Cepat untuk satuan atau banyak", nama_icon: "copy", status_layanan: true },
      { nama: "Jilid", deskripsi: "Jilid spiral, jahit, lem", nama_icon: "book", status_layanan: true },
      { nama: "Laminating", deskripsi: "Matte / Glossy untuk proteksi", nama_icon: "layers", status_layanan: true },
      { nama: "Scan", deskripsi: "Resolusi tinggi, banyak format", nama_icon: "scan", status_layanan: true },
    ],
  });

  // ── 4. Seed stok_barang ──
  console.log("Seeding stok_barang...");
  await prisma.stokBarang.deleteMany();
  const RAW_STOK = [
    // [nama, harga, satuan, isi_per_satuan]
    ["Buku Gambar Sidu", 5000, "PCS"],
    ["Pensil", 4000, "PCS"],
    ["Penghapus joyko", 2000, "PCS"],
    ["Buku Kuramas kecil", 5000, "PCS"],
    ["Buku kuramas sedang", 10000, "PCS"],
    ["Buku Kuramas Besar", 20000, "PCS"],
    ["Buku Kuramas Panjang", 7000, "PCS"],
    ["Tinta Spidol Merah", 18000, "PCS"],
    ["Tinta Spidol Hitam", 18000, "PCS"],
    ["Stampad", 15000, "PCS"],
    ["Lem Fox", 12000, "PCS"],
    ["Isi Steples Etona eceran", 5000, "PCS"],
    ["Steples Besar", 20000, "PCS"],
    ["Buku Gambar Sidu Besar", 10000, "PCS"],
    ["Lem Aibon", 15000, "PCS"],
    ["Lem Glue Panjang Eceran", 7000, "PCS"],
    ["Lem Glue Pendek Eceran", 5000, "PCS"],
    ["Lem Stick Eceran", 5000, "PCS"],
    ["Stick Eskrim Berwarna", 5000, "PAK"],
    ["Stick Eskrim Polos", 3000, "PAK"],
    ["Tipex Panjang Eceran", 5000, "PCS"],
    ["Juz Amma", 15000, "PCS"],
    ["Iqro Kertas A4", 15000, "PCS"],
    ["Iqro Kertas Lks", 10000, "PCS"],
    ["Batre Alkaline AA eceran", 17000, "PCS"],
    ["Batre Alkaline AAA Eceran", 30000, "PCS"],
    ["Penggaris 30 Cm eceran", 5000, "PCS"],
    ["Penggaris 15 Cm Eceran", 3000, "PCS"],
    ["Buku Sidu 38 LBR", 35000, "PCS"],
    ["Buku Sidu 38 LBR Eceran", 6000, "PCS"],
    ["Buku Sidu 58 LBR", 50000, "PCS"],
    ["Buku Sidu 58 LBR Eceran", 9000, "PCS"],
    ["Buku BMC 36 LBR", 42000, "PCS"],
    ["Buku BMC 36 LBR Eceran", 7000, "PCS"],
    ["Buku BMC 50 LBR", 55000, "PCS"],
    ["Buku BMC 50 LBR Eceran", 10000, "PCS"],
    ["Buku BIG BOZZ", 36000, "PCS"],
    ["Buku BIG BOZZ Eceran", 8000, "PCS"],
    ["Kertas HVS A4 70gr RIM", 40000, "RIM", 500],
    ["Kertas HVS A4 70gr Eceran", 500, "LBR"],
    ["Kertas HVS F4/Folio 70gr RIM", 45000, "RIM", 500],
    ["Kertas HVS F4/Folio 70gr Eceran", 1000, "LBR"],
    ["Pulpen Standard AE7 Hitam Eceran", 2000, "PCS"],
    ["Pulpen Standard AE7 Biru Eceran", 2000, "PCS"],
    ["Pulpen Standard AE7 Merah Eceran", 2000, "PCS"],
    ["Pulpen Pilot Hitam Eceran", 2000, "PCS"],
    ["Pulpen Pilot Biru Eceran", 2000, "PCS"],
    ["Pulpen Pilot Merah Eceran", 2000, "PCS"],
    ["Pulpen Gel Joyko/Kenko Hitam Eceran", 3000, "PCS"],
    ["Pulpen Gel Joyko/Kenko biru Eceran", 3000, "PCS"],
    ["Pulpen Gel Joyko/Kenko Merah Eceran", 30000, "PCS"],
    ["Spidol Hitam Eceran", 10000, "PCS"],
    ["Spidol Permanent Eceran", 15000, "PCS"],
    ["Spidol Emas Eceran", 20000, "PCS"],
    ["Spidol Silver Eceran", 15000, "PCS"],
    ["Spidol Biru Eceran", 12000, "PCS"],
    ["Stabilo Eceran", 5000, "PCS"],
    ["Spidol Kecil Biru", 2000, "PCS"],
    ["Spidol Kecil Hitam", 2000, "PCS"],
    ["Spidol Kecil Hijau", 2000, "PCS"],
    ["Spidol Kecil Merah", 2000, "PCS"],
    ["Nota 1 ply", 5000, "PAK"],
    ["Nota 2 ply", 8000, "PAK"],
    ["Kwitansi Besar", 15000, "PCS"],
    ["Kwitansi Sedang", 10000, "PCS"],
    ["Kwitansi Kecil", 5000, "PCS"],
    ["Bola Plastik", 5000, "PCS"],
    ["Gunting besar", 10000, "PCS"],
    ["Gunting Sedang", 7000, "PCS"],
    ["Gunting Kecil", 5000, "PCS"],
    ["Buku Binder", 15000, "PCS"],
    ["Isi Buku Binder B5", 10000, "PCS"],
    ["Isi Buku Binder A5", 7000, "PCS"],
    ["Karton", 3000, "LBR"],
    ["Kertas Marmer", 3000, "LBR"],
    ["Karton Coklat", 5000, "LBR"],
    ["Label Ukuran 121", 7500, "PCS"],
    ["Label Ukuran 105", 7000, "PCS"],
    ["Label Ukuran 99", 7000, "PCS"],
    ["Kertas Kado", 1500, "LBR"],
    ["Kertas Folio", 2000, "LBR"],
    ["Materai", 12000, "LBR"],
    ["Krayon besar", 25000, "PCS"],
    ["Krayon sedang", 20000, "PCS"],
    ["Krayon Kecil", 15000, "PCS"],
    ["Lilin Mainan", 3000, "PAK"],
    ["Cat Air", 15000, "PCS"],
    ["Kuas paket", 10000, "PAK"],
    ["kuas eceran", 2000, "PCS"],
    ["Tisue Wajah", 8000, "PCS"],
    ["Penghapus Kenko", 1000, "PCS"],
    ["Penghapus FarbelCastle", 5000, "PCS"],
    ["Penggaris Besi 30 Cm", 15000, "PCS"],
    ["Penggaris Besi 15 Cm", 10000, "PCS"],
    ["Pulpen 6 Warna", 6000, "PCS"],
    ["Pulpen Hapus", 25000, "PCS"],
    ["Label NO 99", 7500, "PCS"],
    ["Label NO 123", 7500, "PCS"],
    ["Label NO 121", 7500, "PCS"],
    ["Cutter Kenko L-500", 15000, "PCS"],
    ["Cutter Kenko A-300", 8500, "PCS"],
    ["Raket", 50000, "PCS"],
    ["Sterofom", 7000, "PCS"],
    ["Isi Steples Joyko", 3000, "PCS"],
    ["gunting kuku", 5000, "PCS"],
    ["Lakbang 3M", 12000, "PCS"],
    ["Palet Plastik", 2000, "PCS"],
    ["Lakban Coklat Besar", 20000, "PCS"],
    ["Paku Payung", 3000, "PAK"],
    ["Solasi Putih kecil", 5000, "PCS"],
    ["Pulpen Faster", 3000, "PCS"],
    ["Cutter biasa yg kecil", 6000, "PCS"],
    ["Lakban Putih Besar", 12000, "PCS"],
  ];
  const createdStok = await Promise.all(
    RAW_STOK.map((r) => {
      const [nama, harga] = r as [string, number];
      const satuan: string = (r[2] as string) || "PCS";
      const isi: number | null = (r[3] as number | undefined) ?? null;
      return prisma.stokBarang.create({ data: { nama, harga_satuan: harga, jumlah_stok: 0, satuan, isi_per_satuan: isi } });
    })
  );

  // ── 5. Reset stok ke jumlah awal yang besar ──
  console.log("Resetting stok barang to initial large quantities...");
  for (const barang of createdStok) {
    const nama = barang.nama.toLowerCase();
    let qty;
    if (nama.includes("eceran") || nama.includes("kertas") || nama.includes("tisu")) {
      qty = randomInt(500, 2000);
    } else if (nama.includes("rim")) {
      qty = randomInt(30, 100);
    } else if (barang.harga_satuan >= 30000) {
      qty = randomInt(50, 150);
    } else {
      qty = randomInt(100, 500);
    }
    await prisma.stokBarang.update({ where: { id: barang.id }, data: { jumlah_stok: qty } });
  }

  // ── 6. Buat pelanggan ──
  console.log("Creating 15 customers...");
  const hash = await bcrypt.hash("password123", 10);
  const pelangganIds: number[] = [];
  for (const c of CUSTOMERS) {
    const p = await prisma.pelanggan.create({
      data: { nama_lengkap: c.nama, nomor_telepon: c.telepon, alamat: c.alamat },
    });
    pelangganIds.push(p.id);
    await prisma.akunPelanggan.create({
      data: {
        id_pelanggan: p.id,
        email: c.nama.toLowerCase().replace(/\s+/g, ".") + "@email.com",
        nomor_telepon: c.telepon,
        hashed_password: hash,
        alamat: c.alamat,
      },
    });
  }

  // Re-read stok setelah reset biar stokMap punya nilai awal yang benar
  const stokFinal = await prisma.stokBarang.findMany({ orderBy: { id: "asc" } });
  const stokMap = new Map(stokFinal.map(s => [s.id, s]));

  // ── 7. Generate orders ──
  console.log("Generating orders from April 2026...");
  let totalOrders = 0;
  let cur = new Date(START_DATE);
  const totalDays = Math.floor((NOW.getTime() - START_DATE.getTime()) / 86400000) + 1;

  while (cur <= NOW) {
    const count = ordersOnDate(cur);
    for (let i = 0; i < count; i++) {
      const tgl = randomTimeOn(cur);
      const idPel: number = pickRandom(pelangganIds);
      const mode: string = Math.random() < 0.3 ? "ONLINE" : "OFFLINE";
      const status: string = weightedRandom(STATUSES);
      const jenis: string = Math.random() < 0.7 ? "Penjualan Produk" : pickRandom(LAYANAN.filter(l => l !== "Penjualan Produk"));

      const itemCount = randomInt(1, 5);
      const chosen = new Set<number>();
      const items: { stokId: number; nama: string; harga: number; qty: number; satuan_beli: string }[] = [];

      for (let j = 0; j < itemCount; j++) {
        let sid: number;
        do { sid = pickRandom(stokFinal).id; } while (chosen.has(sid));
        chosen.add(sid);
        const stok = stokMap.get(sid)!;
        const baseSatuan = stok.satuan || "PCS";
        let satuanBeli = baseSatuan;
        let qty: number;
        let harga: number;

        if (stok.isi_per_satuan && Math.random() < 0.5) {
          // Jual per PCS dari produk bulk (RIM/PAK/BOX)
          satuanBeli = "PCS";
          qty = randomInt(10, Math.min(500, stok.jumlah_stok * stok.isi_per_satuan));
          harga = stok.harga_satuan / stok.isi_per_satuan;
        } else {
          // Jual native (RIM/PCS/LBR/PAK)
          qty = randomInt(1, jenis === "Penjualan Produk" ? 5 : 3);
          harga = stok.harga_satuan;
        }

        items.push({ stokId: sid, nama: stok.nama, harga, qty, satuan_beli: satuanBeli });
      }

      const total = items.reduce((s: number, it) => s + it.harga * it.qty, 0);

      let uangDiterima: number | null = null;
      let kembalian: number | null = null;
      if (mode === "OFFLINE" && (status === "SELESAI" || status === "DIPROSES")) {
        const payment = calculateCashPayment(total);
        uangDiterima = payment.uangDiterima;
        kembalian = payment.kembalian;
      }

      const pesanan = await prisma.pesanan.create({
        data: {
          id_pelanggan: idPel,
          created_at: tgl,
          jenis_layanan: jenis,
          nilai_pesanan: total,
          uang_diterima: uangDiterima,
          kembalian: kembalian,
          status: status as any,
          mode_pesanan: mode as any,
          catatan_pesanan: Math.random() < 0.2 ? `Pesanan ${tgl.toLocaleDateString("id-ID")}` : null,
        },
      });

      for (const it of items) {
        await prisma.barangTerbeli.create({
          data: {
            id_pesanan: pesanan.id,
            stok_barang_id: it.stokId,
            nama_barang: it.nama,
            harga_satuan: it.harga,
            jumlah: it.qty,
            satuan_beli: it.satuan_beli,
          },
        });

        if (status !== "BATAL") {
          const stok = stokMap.get(it.stokId)!;
          const decQty = (it.satuan_beli !== stok.satuan && stok.isi_per_satuan)
            ? Math.ceil(it.qty / stok.isi_per_satuan)
            : it.qty;
          stok.jumlah_stok = Math.max(0, stok.jumlah_stok - decQty);
          await prisma.stokBarang.update({
            where: { id: it.stokId },
            data: { jumlah_stok: stok.jumlah_stok },
          });
        }
      }

      totalOrders++;
    }

    cur = addDays(cur, 1);
  }

  console.log(`Generated ${totalOrders} orders across ${totalDays} days`);
  console.log("Database seeding completed!");
}

seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
