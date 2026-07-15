import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import midtransClient from "midtrans-client";

const getSnapClient = () => {
  return new midtransClient.Snap({
    isProduction: process.env['MIDTRANS_IS_PRODUCTION'] === 'true',
    serverKey: process.env['MIDTRANS_SERVER_KEY'] || '',
    clientKey: process.env['MIDTRANS_CLIENT_KEY'] || '',
  });
};

// Shared: hitung harga & items dari specs (tanpa DB write)
function calculateOrder(specs: any, priceMap: Record<string, number>) {
  const { paperSize, colorMode, totalPages, copies, bindingType, bwPages, colorPages, sisiCetak, gramasi } = specs;
  const finalSisiCetak = sisiCetak === 'DUA_SISI' ? 'DUA_SISI' : 'SATU_SISI';
  const finalGramasi = gramasi || '80gr';
  const cetakPrefix = finalSisiCetak === 'DUA_SISI' ? 'Cetak Bolak-Balik' : 'Cetak';
  const kertas = paperSize?.toLowerCase() || 'a4';
  const cp = parseInt(copies) || 1;
  const getPrice = (k: string, bw: string) => priceMap[`harga_cetak_${k}_${finalGramasi}_${bw}`] || priceMap[`harga_cetak_${k}_${bw}`] || 0;

  let totalPerBundel = 0;
  const generatedItems: any[] = [];

  if (colorMode === 'Hitam Putih') {
    const harga = getPrice(kertas, 'bw');
    totalPerBundel += (parseInt(totalPages) || 0) * harga;
    generatedItems.push({
      nama_barang: `${cetakPrefix} ${paperSize} (${colorMode})`,
      harga_satuan: harga,
      jumlah: (parseInt(totalPages) || 1) * cp
    });
  } else if (colorMode === 'Berwarna') {
    const harga = getPrice(kertas, 'color');
    totalPerBundel += (parseInt(totalPages) || 0) * harga;
    generatedItems.push({
      nama_barang: `${cetakPrefix} ${paperSize} (${colorMode})`,
      harga_satuan: harga,
      jumlah: (parseInt(totalPages) || 1) * cp
    });
  } else if (colorMode === 'Campur') {
    const hargaBw = getPrice(kertas, 'bw');
    const hargaColor = getPrice(kertas, 'color');
    const bw = parseInt(bwPages) || 0;
    const color = parseInt(colorPages) || 0;
    totalPerBundel += bw * hargaBw;
    totalPerBundel += color * hargaColor;
    if (bw > 0) generatedItems.push({
      nama_barang: `${cetakPrefix} ${paperSize} (Hitam Putih)`,
      harga_satuan: hargaBw,
      jumlah: bw * cp
    });
    if (color > 0) generatedItems.push({
      nama_barang: `${cetakPrefix} ${paperSize} (Berwarna)`,
      harga_satuan: hargaColor,
      jumlah: color * cp
    });
  }

  if (bindingType && bindingType !== 'Tidak Ada') {
    const type = bindingType.toLowerCase().split(' ')[0];
    const hargaJilid = priceMap[`harga_jilid_${type}`] || 0;
    totalPerBundel += hargaJilid;
    generatedItems.push({
      nama_barang: `Jilid ${bindingType}`,
      harga_satuan: hargaJilid,
      jumlah: cp
    });
  }

  const calculatedTotal = totalPerBundel * cp;
  return { calculatedTotal, generatedItems, finalSisiCetak, finalGramasi, cetakPrefix };
}

const paymentRoutes: RouteDefinitions = {
  "/payment/create-token": {
    post: async (req) => {
      try {
        const {
          nama_lengkap, nomor_telepon, redirect_url,
          jenis_layanan, specs
        } = req.body;

        if (!nama_lengkap || !nomor_telepon || !jenis_layanan || !specs) {
          return { success: false, statusCode: 400, message: "Data wajib tidak lengkap" };
        }

        const { totalPages, copies, bwPages, colorPages } = specs;
        const MAX_PAGES = 1000;
        const MAX_COPIES = 100;
        if (
          (parseInt(totalPages) || 0) > MAX_PAGES ||
          (parseInt(copies) || 0) > MAX_COPIES ||
          (parseInt(bwPages) || 0) > MAX_PAGES ||
          (parseInt(colorPages) || 0) > MAX_PAGES
        ) {
          return { success: false, statusCode: 400, message: "Nilai spesifikasi melebihi batas wajar" };
        }

        const prisma = await getPrismaClient();
        const configs = await prisma.konfigurasi.findMany();
        const priceMap: Record<string, number> = {};
        configs.forEach(c => { priceMap[c.kunci] = parseInt(c.nilai) || 0 });

        const { calculatedTotal } = calculateOrder(specs, priceMap);

        if (calculatedTotal <= 0) {
          return { success: false, statusCode: 400, message: "Spesifikasi pesanan tidak valid atau harga Rp0" };
        }

        const orderId = `OLA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const snap = getSnapClient();
        const snapResponse = await snap.createTransaction({
          transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(calculatedTotal),
          },
          callbacks: {
            finish: redirect_url,
          },
          customer_details: {
            first_name: nama_lengkap,
            phone: nomor_telepon,
          },
          item_details: [{
            id: 'pesanan',
            price: Math.round(calculatedTotal),
            quantity: 1,
            name: jenis_layanan,
          }],
        } as any);

        return {
          success: true,
          statusCode: 201,
          data: {
            snap_token: snapResponse.token,
            order_id: orderId,
          },
        };
      } catch (error) {
        console.error("Error creating payment token:", error);
        return { success: false, message: "Gagal membuat token pembayaran" };
      }
    },
  },

  "/payment/confirm": {
    post: async (req) => {
      try {
        const {
          nama_lengkap, nomor_telepon, alamat, alamat_pengiriman,
          jenis_layanan, nama_file, catatan_pesanan,
          metode_pengiriman, specs,
          order_id, snap_token
        } = req.body;

        if (!order_id || !snap_token || !nama_lengkap || !nomor_telepon || !jenis_layanan || !specs) {
          return { success: false, statusCode: 400, message: "Data wajib tidak lengkap" };
        }

        const prisma = await getPrismaClient();

        // Cek order_id ga double
        const existing = await prisma.pesanan.findFirst({ where: { midtrans_order_id: order_id } });
        if (existing) {
          return { success: false, statusCode: 409, message: "Pesanan sudah dikonfirmasi" };
        }

        // Hitung harga
        const configs = await prisma.konfigurasi.findMany();
        const priceMap: Record<string, number> = {};
        configs.forEach(c => { priceMap[c.kunci] = parseInt(c.nilai) || 0 });
        const { calculatedTotal, generatedItems, finalSisiCetak, finalGramasi } = calculateOrder(specs, priceMap);

        if (calculatedTotal <= 0) {
          return { success: false, statusCode: 400, message: "Spesifikasi pesanan tidak valid atau harga Rp0" };
        }

        // Cari atau buat pelanggan
        let pelanggan = await prisma.pelanggan.findFirst({ where: { nomor_telepon } });
        if (!pelanggan) {
          pelanggan = await prisma.pelanggan.create({
            data: { nama_lengkap, nomor_telepon, alamat: alamat ?? null },
          });
        }

        // Buat pesanan
        const newPesanan = await prisma.$transaction(async (tx) => {
          const pesanan = await tx.pesanan.create({
            data: {
              id_pelanggan: pelanggan.id,
              jenis_layanan,
              nama_file: nama_file ?? null,
              catatan_pesanan: catatan_pesanan ?? null,
              nilai_pesanan: calculatedTotal,
              status: 'MENUNGGU',
              mode_pesanan: 'ONLINE',
              sisi_cetak: finalSisiCetak,
              gramasi: finalGramasi,
              metode_pengiriman: metode_pengiriman || "AMBIL",
              alamat_pengiriman: alamat_pengiriman ?? null,
              midtrans_order_id: order_id,
              payment_status: 'pending',
              snap_token,
            },
          });

          if (generatedItems.length > 0) {
            await tx.barangTerbeli.createMany({
              data: generatedItems.map((item) => ({
                id_pesanan: pesanan.id,
                nama_barang: item.nama_barang,
                harga_satuan: item.harga_satuan,
                jumlah: item.jumlah,
              })),
            });
          }

          return pesanan;
        });

        // Verify status ke Midtrans langsung
        try {
          const apiClient = new midtransClient.CoreApi({
            isProduction: process.env['MIDTRANS_IS_PRODUCTION'] === 'true',
            serverKey: process.env['MIDTRANS_SERVER_KEY'] || '',
            clientKey: process.env['MIDTRANS_CLIENT_KEY'] || '',
          });
          const statusResponse = await (apiClient as any).transaction.status(order_id);
          const txnStatus = statusResponse.transaction_status;
          if (['settlement', 'capture'].includes(txnStatus)) {
            await prisma.pesanan.update({
              where: { id: newPesanan.id },
              data: { payment_status: 'settlement', status: 'DIPROSES' },
            });
          }
        } catch (verifyError: any) {
          if (verifyError?.ApiResponse?.status_code !== '404') {
            console.error("Midtrans verify error (non-fatal):", verifyError);
          }
        }

        return {
          success: true,
          statusCode: 201,
          data: {
            pesanan_id: newPesanan.id,
            order_id,
          },
        };
      } catch (error) {
        console.error("Error confirming payment:", error);
        return { success: false, message: "Gagal mengkonfirmasi pembayaran" };
      }
    },
  },

  "/payment/notification": {
    post: async (req) => {
      try {
        const apiClient = new midtransClient.CoreApi({
          isProduction: process.env['MIDTRANS_IS_PRODUCTION'] === 'true',
          serverKey: process.env['MIDTRANS_SERVER_KEY'] || '',
          clientKey: process.env['MIDTRANS_CLIENT_KEY'] || '',
        });

        let statusResponse: any;
        try {
          statusResponse = await (apiClient as any).transaction.notification(req.body);
        } catch (midtransError: any) {
          if (midtransError?.ApiResponse?.status_code === '404') {
            return { success: true, data: { message: "Test notification received" } };
          }
          throw midtransError;
        }

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        const prisma = await getPrismaClient();
        const pesanan = await prisma.pesanan.findFirst({
          where: { midtrans_order_id: orderId },
        });

        if (!pesanan) {
          return { success: false, statusCode: 404, message: "Pesanan tidak ditemukan" };
        }

        let newStatus = pesanan.status;
        let newPaymentStatus = transactionStatus;
        if (transactionStatus === 'capture') {
          if (fraudStatus === 'accept') {
            newStatus = 'DIPROSES';
            newPaymentStatus = 'settlement';
          }
        } else if (transactionStatus === 'settlement') {
          newStatus = 'DIPROSES';
          newPaymentStatus = 'settlement';
        } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
          newStatus = 'BATAL';
          newPaymentStatus = transactionStatus;
        } else if (transactionStatus === 'pending') {
          newPaymentStatus = 'pending';
        }

        await prisma.pesanan.update({
          where: { id: pesanan.id },
          data: { status: newStatus, payment_status: newPaymentStatus },
        });

        return { success: true, data: { message: "Notification processed" } };
      } catch (error) {
        console.error("Error processing notification:", error);
        return { success: false, message: "Gagal memproses notifikasi" };
      }
    },
  },
};

export default paymentRoutes;
