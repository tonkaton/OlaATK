import { config } from "dotenv";
import { getPrismaClient } from "./prisma/index.js";
import type { Prisma } from "./prisma/generated/client.js";

// Load environment variables
config({ path: [".env"] });

async function seed() {
  const prisma = await getPrismaClient();

  console.log("🌱 Starting database seeding...");

  // Clear existing data
  console.log("🗑️  Clearing existing data_layanan...");
  await prisma.dataLayanan.deleteMany();
  
  console.log("🗑️  Clearing existing konfigurasi...");
  await prisma.konfigurasi.deleteMany();

  // Seed konfigurasi
  console.log("⚙️  Seeding konfigurasi...");
  await prisma.konfigurasi.createMany({
    data: [
      // Umum Group
      {
        kunci: "APP_NAME",
        nilai: "Ola ATK",
        deskripsi: "Nama aplikasi yang ditampilkan di frontend",
        tipe: "text",
        grup: "umum",
        urutan: 1
      },
      {
        kunci: "APP_TAGLINE",
        nilai: "Cetak Online & ATK",
        deskripsi: "Tagline atau slogan aplikasi",
        tipe: "text",
        grup: "umum",
        urutan: 2
      },
      // Kontak Group
      {
        kunci: "CONTACT_PHONE",
        nilai: "+62 852-1638-8303",
        deskripsi: "Nomor telepon kontak",
        tipe: "tel",
        grup: "kontak",
        urutan: 3
      },
      {
        kunci: "CONTACT_INSTAGRAM",
        nilai: "ola.atk.balaraja",
        deskripsi: "Username Instagram (tanpa @)",
        tipe: "text",
        grup: "kontak",
        urutan: 4
      },
      {
        kunci: "CONTACT_ADDRESS",
        nilai: "RFF3+J97, Saga, Kec. Balaraja, Kabupaten Tangerang, Banten 15610",
        deskripsi: "Alamat fisik toko",
        tipe: "textarea",
        grup: "kontak",
        urutan: 5
      },
      {
        kunci: "CONTACT_HOURS",
        nilai: "Senin - Sabtu: 06:00 - 21:00",
        deskripsi: "Jam operasional",
        tipe: "text",
        grup: "kontak",
        urutan: 6
      }
    ]
  });

  // Seed data_layanan based on frontend Services.jsx
  console.log("📝 Seeding data_layanan...");

	await prisma.dataLayanan.createMany({
		data: [{
			nama: "Cetak Dokumen",
			deskripsi: "PDF, DOCX — A4/A3 — B/W & Warna",
			nama_icon: "printer",
			status_layanan: true,
		},
		{
			nama: "Fotokopi",
			deskripsi: "Cepat untuk satuan atau banyak",
			nama_icon: "copy",
			status_layanan: true,
		},
		{
			nama: "Jilid",
			deskripsi: "Jilid spiral, jahit, lem",
			nama_icon: "book",
			status_layanan: true,
		},
		{
			nama: "Laminating",
			deskripsi: "Matte / Glossy untuk proteksi",
			nama_icon: "layers",
			status_layanan: true,
		},
		{
			nama: "Scan",
			deskripsi: "Resolusi tinggi, banyak format",
			nama_icon: "scan",
			status_layanan: true,
		}],
	});

  console.log("🎉 Database seeding completed!");
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
