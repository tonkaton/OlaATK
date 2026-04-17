import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { validateDto } from "../../utils/validation.js";
import { CreatePesananDto, UpdatePesananDto, UpdateStatusPesananDto } from "./dto/pesanan.dto.js";
import { requireAuth, requireAdmin } from "../../auth/index.js";

const pesananRoutes: RouteDefinitions = {
  // ==========================================
  // 1. GET ALL & CREATE (AUTH REQUIRED)
  // ==========================================
  "/pesanan": {
    get: async (req) => {
      const authError = requireAuth(req);
      if (authError) return authError;

      try {
        const prisma = await getPrismaClient();

        const search = req.query?.['search'] as string | undefined;
        const status = req.query?.['status'] as string | undefined;
        const mode = req.query?.['mode'] as string | undefined;
        const page = parseInt((req.query?.['page'] as string) || "1");
        const limit = parseInt((req.query?.['limit'] as string) || "10");
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (req.authStatus?.userType === "user" && req.authStatus.userId) {
          whereClause.id_pelanggan = req.authStatus.userId;
        }

        if (status) whereClause.status = status;
        if (mode) whereClause.mode_pesanan = mode;

        if (search) {
          whereClause.OR = [
            { jenis_layanan: { contains: search } },
            { nama_file: { contains: search } },
            { pelanggan: { nama_lengkap: { contains: search } } },
          ];
        }

        const total = await prisma.pesanan.count({ where: whereClause });

        const pesanan = await prisma.pesanan.findMany({
          where: whereClause,
          include: {
            pelanggan: {
              select: { id: true, nama_lengkap: true, nomor_telepon: true, alamat: true },
            },
            barangTerbeli: true, // [PENTING] Biar detail item muncul di Admin
          },
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
        });

        return {
          success: true,
          data: {
            pesanan,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          },
        };
      } catch (error) {
        console.error("Error fetching pesanan:", error);
        return { success: false, message: "Gagal mengambil data pesanan" };
      }
    },

    post: async (req) => {
      const authError = requireAuth(req);
      if (authError) return authError;

      const { dto, errors } = await validateDto(CreatePesananDto, req.body);
      if (errors) return errors;

      if (req.authStatus?.userType === "user" && dto.id_pelanggan !== req.authStatus.userId) {
        return { success: false, statusCode: 403, message: "Tidak boleh membuat pesanan untuk orang lain" };
      }

      try {
        const prisma = await getPrismaClient();
        let finalNilaiPesanan = dto.nilai_pesanan;

        if (dto.items && dto.items.length > 0) {
          finalNilaiPesanan = dto.items.reduce((sum, item) => sum + item.harga_satuan * item.jumlah, 0);
        }

        const mode = dto.mode_pesanan || "ONLINE";

        const newPesanan = await prisma.$transaction(async (tx) => {
          const pesanan = await tx.pesanan.create({
            data: {
              id_pelanggan: dto.id_pelanggan,
              jenis_layanan: dto.jenis_layanan,
              nama_file: mode === "OFFLINE" ? null : (dto.nama_file ?? null),
              catatan_pesanan: dto.catatan_pesanan ?? null,
              nilai_pesanan: finalNilaiPesanan,
              status: "MENUNGGU",
              mode_pesanan: mode,
            },
            include: { pelanggan: true },
          });

          if (dto.items && dto.items.length > 0) {
            for (const item of dto.items) {
              // Cek apakah item ini produk dari stok_barang
              const stokBarang = (item as any).stok_barang_id
                ? await tx.stokBarang.findUnique({ where: { id: (item as any).stok_barang_id } })
                : null;

              // Validasi stok cukup
              if (stokBarang) {
                if (stokBarang.jumlah_stok < item.jumlah) {
                  throw new Error(`Stok ${stokBarang.nama} tidak cukup. Tersedia: ${stokBarang.jumlah_stok}`);
                }
                // Kurangi stok
                await tx.stokBarang.update({
                  where: { id: stokBarang.id },
                  data: { jumlah_stok: { decrement: item.jumlah } },
                });
              }

              await tx.barangTerbeli.create({
                data: {
                  id_pesanan: pesanan.id,
                  stok_barang_id: (item as any).stok_barang_id ?? null,
                  nama_barang: item.nama_barang,
                  harga_satuan: item.harga_satuan || 0,
                  jumlah: item.jumlah || 1,
                },
              });
            }
          }
          return pesanan;
        });

        const createdPesanan = await prisma.pesanan.findUnique({
          where: { id: newPesanan.id },
          include: { pelanggan: true, barangTerbeli: true },
        });

        return { success: true, statusCode: 201, data: { pesanan: createdPesanan } };
      } catch (error: any) {
        console.error("Error creating pesanan:", error);
        if (error.message?.includes("Stok")) {
          return { success: false, statusCode: 400, message: error.message };
        }
        return { success: false, message: "Gagal membuat pesanan" };
      }
    },
  },

  // ==========================================
  // 2. PUBLIC ENDPOINT (NO AUTH - FOR USER & OFFLINE POS)
  // ==========================================
  "/pesanan/public": {
    post: async (req) => {
      try {
        // [UPDATE] Ambil mode_pesanan dari body
        const { nama_lengkap, nomor_telepon, alamat, jenis_layanan, nama_file, catatan_pesanan, nilai_pesanan, items, mode_pesanan } = req.body;

        if (!nama_lengkap || !nomor_telepon || !jenis_layanan) {
          return { success: false, statusCode: 400, message: "Data wajib tidak lengkap" };
        }

        const prisma = await getPrismaClient();

        let pelanggan = await prisma.pelanggan.findFirst({ where: { nomor_telepon } });

        if (!pelanggan) {
          pelanggan = await prisma.pelanggan.create({
            data: { nama_lengkap, nomor_telepon, alamat: alamat ?? null },
          });
        } else {
          const updateData: any = {};
          if (pelanggan.nama_lengkap !== nama_lengkap) updateData.nama_lengkap = nama_lengkap;
          if (alamat && pelanggan.alamat !== alamat) updateData.alamat = alamat;

          if (Object.keys(updateData).length > 0) {
            pelanggan = await prisma.pelanggan.update({
              where: { id: pelanggan.id },
              data: updateData
            });
          }
        }

        // [LOGIC BARU] Tentukan Mode
        // Kalau dari Admin dikirim 'OFFLINE', pake itu. Kalau gak ada, default 'ONLINE'.
        const finalMode = (mode_pesanan === 'OFFLINE') ? 'OFFLINE' : 'ONLINE';

        const newPesanan = await prisma.$transaction(async (tx) => {
          const pesanan = await tx.pesanan.create({
            data: {
              id_pelanggan: pelanggan.id,
              jenis_layanan,
              nama_file: nama_file ?? null,
              catatan_pesanan: catatan_pesanan ?? null,
              nilai_pesanan: typeof nilai_pesanan === "number" ? nilai_pesanan : 0,
              status: "MENUNGGU",
              mode_pesanan: finalMode, // <--- Pakai logic dinamis
            }
          });

          if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
              // Cek apakah item ini produk dari stok_barang
              const stokBarang = item.stok_barang_id
                ? await tx.stokBarang.findUnique({ where: { id: item.stok_barang_id } })
                : null;

              // Validasi stok cukup
              if (stokBarang) {
                if (stokBarang.jumlah_stok < item.jumlah) {
                  throw new Error(`Stok ${stokBarang.nama} tidak cukup. Tersedia: ${stokBarang.jumlah_stok}`);
                }
                // Kurangi stok
                await tx.stokBarang.update({
                  where: { id: stokBarang.id },
                  data: { jumlah_stok: { decrement: item.jumlah } },
                });
              }

              await tx.barangTerbeli.create({
                data: {
                  id_pesanan: pesanan.id,
                  stok_barang_id: item.stok_barang_id ?? null,
                  nama_barang: item.nama_barang,
                  harga_satuan: item.harga_satuan || 0,
                  jumlah: item.jumlah || 1,
                },
              });
            }
          }

          return pesanan;
        });

        const finalPesanan = await prisma.pesanan.findUnique({
          where: { id: newPesanan.id },
          include: { pelanggan: true, barangTerbeli: true },
        });

        return { success: true, statusCode: 201, data: { pesanan: finalPesanan } };
      } catch (error: any) {
        console.error("Error public pesanan:", error);
        if (error.message?.includes("Stok")) {
          return { success: false, statusCode: 400, message: error.message };
        }
        return { success: false, message: "Gagal membuat pesanan public" };
      }
    },
  },

  // ==========================================
  // 3. GET, UPDATE, DELETE BY ID
  // ==========================================
  "/pesanan/:id": {
    get: async (req) => {
      const authError = requireAuth(req);
      if (authError) return authError;

      try {
        const rawId = req.params?.['id'];
        const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
        const id = parseInt(idStr || '0');

        if (isNaN(id) || id === 0) return { success: false, statusCode: 400, message: "ID pesanan tidak valid" };

        const prisma = await getPrismaClient();
        const pesanan = await prisma.pesanan.findUnique({
          where: { id },
          include: { pelanggan: true, barangTerbeli: true },
        });

        if (!pesanan) return { success: false, statusCode: 404, message: "Pesanan tidak ditemukan" };

        if (req.authStatus?.userType === "user" && pesanan.id_pelanggan !== req.authStatus.userId) {
          return { success: false, statusCode: 403, message: "Akses ditolak" };
        }

        return { success: true, data: { pesanan } };
      } catch (error) {
        return { success: false, message: "Gagal mengambil detail pesanan" };
      }
    },

    put: async (req) => {
      const authError = requireAdmin(req);
      if (authError) return authError;

      const rawId = req.params?.['id'];
      const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
      const id = parseInt(idStr || '0');

      if (isNaN(id) || id === 0) return { success: false, statusCode: 400, message: "ID pesanan tidak valid" };

      const { dto, errors } = await validateDto(UpdatePesananDto, req.body);
      if (errors) return errors;

      try {
        const prisma = await getPrismaClient();
        const updatedPesanan = await prisma.pesanan.update({
          where: { id },
          data: {
            ...(dto.jenis_layanan && { jenis_layanan: dto.jenis_layanan }),
            ...(dto.nama_file !== undefined && { nama_file: dto.nama_file }),
            ...(dto.catatan_pesanan !== undefined && { catatan_pesanan: dto.catatan_pesanan }),
            ...(dto.nilai_pesanan !== undefined && { nilai_pesanan: dto.nilai_pesanan }),
          },
          include: { pelanggan: true, barangTerbeli: true },
        });

        return { success: true, data: { pesanan: updatedPesanan } };
      } catch (error: any) {
        if (error.code === "P2025") return { success: false, statusCode: 404, message: "Pesanan tidak ditemukan" };
        return { success: false, message: "Gagal memperbarui pesanan" };
      }
    },

    delete: async (req) => {
      const authError = requireAdmin(req);
      if (authError) return authError;

      const rawId = req.params?.['id'];
      const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
      const id = parseInt(idStr || '0');

      if (isNaN(id) || id === 0) return { success: false, statusCode: 400, message: "ID pesanan tidak valid" };

      try {
        const prisma = await getPrismaClient();
        await prisma.pesanan.delete({ where: { id } });
        return { success: true, data: { message: "Pesanan berhasil dihapus" } };
      } catch (error: any) {
        if (error.code === "P2025") return { success: false, statusCode: 404, message: "Pesanan tidak ditemukan" };
        return { success: false, message: "Gagal menghapus pesanan" };
      }
    },
  },

  // ==========================================
  // 4. UPDATE STATUS (WITH STOK ROLLBACK)
  // ==========================================
  "/pesanan/:id/status": {
    put: async (req) => {
      const authError = requireAdmin(req);
      if (authError) return authError;

      const rawId = req.params?.['id'];
      const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
      const id = parseInt(idStr || '0');

      if (isNaN(id) || id === 0) return { success: false, statusCode: 400, message: "ID pesanan tidak valid" };

      const { dto, errors } = await validateDto(UpdateStatusPesananDto, req.body);
      if (errors) return errors;

      try {
        const prisma = await getPrismaClient();
        const updatedPesanan = await prisma.$transaction(async (tx) => {
          // Kalau status BATAL, rollback stok produk
          if (dto.status === 'BATAL') {
            const pesanan = await tx.pesanan.findUnique({
              where: { id },
              include: { barangTerbeli: true },
            });

            if (pesanan) {
              for (const item of pesanan.barangTerbeli) {
                if (item.stok_barang_id) {
                  await tx.stokBarang.update({
                    where: { id: item.stok_barang_id },
                    data: { jumlah_stok: { increment: item.jumlah } },
                  });
                }
              }
            }
          }

          return tx.pesanan.update({
            where: { id },
            data: { status: dto.status },
            include: { pelanggan: true, barangTerbeli: true },
          });
        });

        return { success: true, data: { pesanan: updatedPesanan }, message: `Status diubah menjadi ${dto.status}` };
      } catch (error: any) {
        if (error.code === "P2025") return { success: false, statusCode: 404, message: "Pesanan tidak ditemukan" };
        if (error.message?.includes("Stok")) return { success: false, statusCode: 400, message: error.message };
        return { success: false, message: "Gagal memperbarui status pesanan" };
      }
    },
  },

  // ==========================================
  // 5. STATS (SUPPORT ?mode=ONLINE)
  // ==========================================
  "/pesanan/stats/today": {
    get: async (req) => {
      try {
        const prisma = await getPrismaClient();

        // Ambil query param 'mode'
        const mode = req.query?.['mode'] as string | undefined;

        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        // Bikin filter
        const whereClause: any = {
          created_at: { gte: startOfDay, lte: endOfDay }
        };

        // Kalau ada ?mode=..., tambahin ke filter
        if (mode) {
          whereClause.mode_pesanan = mode;
        }

        const count = await prisma.pesanan.count({
          where: whereClause,
        });

        return { success: true, data: { count } };
      } catch (error) {
        return { success: false, message: "Gagal mengambil statistik hari ini" };
      }
    },
  },
};

export default pesananRoutes;