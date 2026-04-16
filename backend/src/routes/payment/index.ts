import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { requireAuth } from "../../auth/index.js";
import midtransClient from "midtrans-client";

const getSnapClient = () => {
  return new midtransClient.Snap({
    isProduction: process.env['MIDTRANS_IS_PRODUCTION'] === 'true',
    serverKey: process.env['MIDTRANS_SERVER_KEY'] || '',
    clientKey: process.env['MIDTRANS_CLIENT_KEY'] || '',
  });
};

const paymentRoutes: RouteDefinitions = {
  // ==========================================
  // 1. CREATE SNAP TOKEN
  // ==========================================
  "/payment/create-token": {
    post: async (req) => {
      try {
        const {
          nama_lengkap, nomor_telepon, alamat,
          jenis_layanan, nama_file, catatan_pesanan,
          nilai_pesanan, items, mode_pesanan
        } = req.body;

        if (!nama_lengkap || !nomor_telepon || !jenis_layanan) {
          return { success: false, statusCode: 400, message: "Data wajib tidak lengkap" };
        }

        if (!nilai_pesanan || nilai_pesanan <= 0) {
          return { success: false, statusCode: 400, message: "Nilai pesanan tidak valid" };
        }

        const prisma = await getPrismaClient();

        // Cari atau buat pelanggan
        let pelanggan = await prisma.pelanggan.findFirst({ where: { nomor_telepon } });
        if (!pelanggan) {
          pelanggan = await prisma.pelanggan.create({
            data: { nama_lengkap, nomor_telepon, alamat: alamat ?? null },
          });
        }

        // Buat pesanan dengan status MENUNGGU
        const orderId = `OLA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const newPesanan = await prisma.$transaction(async (tx) => {
          const pesanan = await tx.pesanan.create({
            data: {
              id_pelanggan: pelanggan.id,
              jenis_layanan,
              nama_file: nama_file ?? null,
              catatan_pesanan: catatan_pesanan ?? null,
              nilai_pesanan,
              status: 'MENUNGGU',
              mode_pesanan: 'ONLINE',
              midtrans_order_id: orderId,
              payment_status: 'pending',
            },
          });

          if (items && Array.isArray(items) && items.length > 0) {
            await tx.barangTerbeli.createMany({
              data: items.map((item: any) => ({
                id_pesanan: pesanan.id,
                nama_barang: item.nama_barang,
                harga_satuan: item.harga_satuan || 0,
                jumlah: item.jumlah || 1,
              })),
            });
          }

          return pesanan;
        });

        // Generate Snap token
        const snap = getSnapClient();
        const snapResponse = await snap.createTransaction({
          transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(nilai_pesanan),
          },
          customer_details: {
            first_name: nama_lengkap,
            phone: nomor_telepon,
          },
          item_details: [{
            id: 'pesanan',
            price: Math.round(nilai_pesanan),
            quantity: 1,
            name: jenis_layanan,
          }],
        } as any); // Bypass TS error karena definisi type Midtrans tidak lengkap

        // Simpan snap_token ke pesanan
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

  // ==========================================
  // 2. WEBHOOK DARI MIDTRANS
  // ==========================================
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
          // Verifikasi notifikasi dari Midtrans
          statusResponse = await (apiClient as any).transaction.notification(req.body);
        } catch (midtransError: any) {
          // Midtrans test ping pakai dummy order ID - return 200 biar dashboard happy
          if (midtransError?.ApiResponse?.status_code === '404') {
            return { success: true, data: { message: "Test notification received" } };
          }
          throw midtransError; // Lempar error lain selain 404 dummy test
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

        // Mapping status Midtrans ke status pesanan
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
          data: {
            status: newStatus,
            payment_status: newPaymentStatus,
          },
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