import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { validateDto } from "../../utils/validation.js";
import { CreateBarangTerbeliDto, UpdateBarangTerbeliDto } from "./dto/barang-terbeli.dto.js";
import { requireAuth, requireAdmin } from "../../auth/index.js";

const barangTerbeliRoutes: RouteDefinitions = {
	"/barang-terbeli": {
		get: async (req) => {
			const authError = requireAuth(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();
				const barangTerbeli = await prisma.barangTerbeli.findMany({
					include: {
						pesanan: true,
					},
				});

				return {
					success: true,
					data: { barangTerbeli },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch barang terbeli",
				};
			}
		},

		post: async (req) => {
			const authError = requireAuth(req);
			if (authError) return authError;

			const { dto, errors } = await validateDto(CreateBarangTerbeliDto, req.body);
			if (errors) return errors;

			try {
				const prisma = await getPrismaClient();
				
				// Verify the order exists and user has access
				const pesanan = await prisma.pesanan.findUnique({
					where: { id: dto.id_pesanan },
				});

				if (!pesanan) {
					return {
						success: false,
						statusCode: 404,
						message: "Pesanan not found",
					};
				}

				// Users can only add items to their own orders
				if (req.authStatus?.userType === 'user' && pesanan.id_pelanggan !== req.authStatus.userId) {
					return {
						success: false,
						statusCode: 403,
						message: "Cannot add items to another user's order",
					};
				}

				const newBarangTerbeli = await prisma.barangTerbeli.create({
					data: {
						id_pesanan: dto.id_pesanan,
						nama_barang: dto.nama_barang,
						harga_satuan: dto.harga_satuan,
						jumlah: dto.jumlah,
					},
					include: {
						pesanan: true,
					},
				});

				return {
					success: true,
					statusCode: 201,
					data: { barangTerbeli: newBarangTerbeli },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to create barang terbeli",
				};
			}
		},
	},

	"/barang-terbeli/:id": {
		get: async (req) => {
			const authError = requireAuth(req);
			if (authError) return authError;

			try {
				const idParam = req.params['id'];
				const id = parseInt(Array.isArray(idParam) ? (idParam[0] || '') : (idParam || ''));
				if (isNaN(id)) {
					return {
						success: false,
						statusCode: 400,
						message: "Invalid barang terbeli ID",
					};
				}

				const prisma = await getPrismaClient();
				const barangTerbeli = await prisma.barangTerbeli.findUnique({
					where: { id },
					include: {
						pesanan: true,
					},
				});

				if (!barangTerbeli) {
					return {
						success: false,
						statusCode: 404,
						message: "Barang terbeli not found",
					};
				}

				return {
					success: true,
					data: { barangTerbeli },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch barang terbeli",
				};
			}
		},

		put: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const idParam = req.params['id'];
				const id = parseInt(Array.isArray(idParam) ? (idParam[0] || '') : (idParam || ''));
				if (isNaN(id)) {
					return {
						success: false,
						statusCode: 400,
						message: "Invalid barang terbeli ID",
					};
				}

				const { dto, errors } = await validateDto(UpdateBarangTerbeliDto, req.body);
				if (errors) return errors;

				const prisma = await getPrismaClient();
				const updatedBarangTerbeli = await prisma.barangTerbeli.update({
					where: { id },
					data: {
						...(dto.nama_barang && { nama_barang: dto.nama_barang }),
						...(dto.harga_satuan !== undefined && { harga_satuan: dto.harga_satuan }),
						...(dto.jumlah !== undefined && { jumlah: dto.jumlah }),
					},
					include: {
						pesanan: true,
					},
				});

				return {
					success: true,
					data: { barangTerbeli: updatedBarangTerbeli },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to update not found")) {
					return {
						success: false,
						statusCode: 404,
						message: "Barang terbeli not found",
					};
				}

				return {
					success: false,
					message: "Failed to update barang terbeli",
				};
			}
		},

		delete: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const idParam = req.params['id'];
				const id = parseInt(Array.isArray(idParam) ? (idParam[0] || '') : (idParam || ''));
				if (isNaN(id)) {
					return {
						success: false,
						statusCode: 400,
						message: "Invalid barang terbeli ID",
					};
				}

				const prisma = await getPrismaClient();
				await prisma.barangTerbeli.delete({
					where: { id },
				});

				return {
					success: true,
					data: { message: "Barang terbeli deleted successfully" },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
					return {
						success: false,
						statusCode: 404,
						message: "Barang terbeli not found",
					};
				}

				return {
					success: false,
					message: "Failed to delete barang terbeli",
				};
			}
		},
	},
};

export default barangTerbeliRoutes;
