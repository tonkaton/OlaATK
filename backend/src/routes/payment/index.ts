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

const paymentRoutes: RouteDefinitions = {
  "/payment/create-token": {
    post: async (req) => {
      try {
        const {
          nama_lengkap, nomor_telepon, alamat,
          jenis_layanan, nama_file, catatan_pesanan,
          mode_pesanan, specs
        } = req.body;

        if (!nama_lengkap || !nomor_telepon || !jenis_layanan || !specs) {
          return { success: false, statusCode: 400, message: "Data wajib tidak lengkap" };
        }

        const { paperSize, colorMode, totalPages, copies, bindingType, bwPages, colorPages } = specs;

        // Input range validation
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

        // Fetch harga dari DB
        const configs = await prisma.konfigurasi.findMany();
        const priceMap: Record<string, number> = {};
        configs.forEach(c => { priceMap[c.kunci] = parseInt(c.nilai) || 0 });

        // Recalculate harga & build items dari specs (Security First)
        const kertas = paperSize?.toLowerCase() || 'a4';
        const cp = parseInt(copies) || 1;
        let totalPerBundel = 0;
        const generatedItems: any[] = [];

        if (colorMode === 'Hitam Putih') {
          const harga = priceMap[`harga_cetak_${kertas}_bw`] || 0;
          totalPerBundel += (parseInt(totalPages) || 0) * harga;
          generatedItems.push({
            nama_barang: `Cetak ${paperSize} (${colorMode})`,
            harga_satuan: harga,
            jumlah: (parseInt(totalPages) || 1) * cp
          });
        } else if (colorMode === 'Berwarna') {
          const harga = priceMap[`harga_cetak_${kertas}_color`] || 0;
          totalPerBundel += (parseInt(totalPages) || 0) * harga;
          generatedItems.push({
            nama_barang: `Cetak ${paperSize} (${colorMode})`,
            harga_satuan: harga,
            jumlah: (parseInt(totalPages) || 1) * cp
          });
        } else if (colorMode === 'Campur') {
          const hargaBw = priceMap[`harga_cetak_${kertas}_bw`] || 0;
          const hargaColor = priceMap[`harga_cetak_${kertas}_color`] || 0;
          totalPerBundel += (parseInt(bwPages) || 0) * hargaBw;
          totalPerBundel += (parseInt(colorPages) || 0) * hargaColor;
          if (parseInt(bwPages) > 0) generatedItems.push({
            nama_barang: `Cetak ${paperSize} (Hitam Putih)`,
            harga_satuan: hargaBw,
            jumlah: parseInt(bwPages) * cp
          });
          if (parseInt(colorPages) > 0) generatedItems.push({
            nama_barang: `Cetak ${paperSize} (Berwarna)`,
            harga_satuan: hargaColor,
            jumlah: parseInt(colorPages) * cp
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

        const orderId = `OLA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

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
              midtrans_order_id: orderId,
              payment_status: 'pending',
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

        const snap = getSnapClient();
        const snapResponse = await snap.createTransaction({
          transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(calculatedTotal),
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

        await prisma.pesanan.update({
          where: { id: newPesanan.id },
          data: { snap_token: snapResponse.token },
        });

        return {
          success: true,
          statusCode: 201,
          data: {
            snap_token: snapResponse.token,
            order_id: orderId,
            pesanan_id: newPesanan.id,
          },
        };
      } catch (error) {
        console.error("Error creating payment token:", error);
        return { success: false, message: "Gagal membuat token pembayaran" };
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