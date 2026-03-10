import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { validateDto } from "../../utils/validation.js";
import { CreateStokBarangDto, UpdateStokBarangDto } from "./dto/stok-barang.dto.js";
import { requireAdmin } from "../../auth/index.js";

const stokBarangRoutes: RouteDefinitions = {
	"/stok-barang": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();
				
				// Get query parameters
				const search = req.query?.['search'] as string | undefined;
				const page = parseInt((req.query?.['page'] as string) || '1');
				const limit = parseInt((req.query?.['limit'] as string) || '10');
				const skip = (page - 1) * limit;

				// Build where clause
				const where = search
					? {
							nama: { contains: search },
					  }
					: {};

				// Get total count for pagination
				const total = await prisma.stokBarang.count({ where });

				// Get paginated data
				const stokBarang = await prisma.stokBarang.findMany({
					where,
					skip,
					take: limit,
					orderBy: { created_at: 'desc' },
				});

				return {
					success: true,
					data: { 
						stokBarang,
						pagination: {
							page,
							limit,
							total,
							totalPages: Math.ceil(total / limit),
						},
					},
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch stok barang",
				};
			}
		},

		post: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			const { dto, errors } = await validateDto(CreateStokBarangDto, req.body);
			if (errors) return errors;

			try {
				const prisma = await getPrismaClient();
				const newStokBarang = await prisma.stokBarang.create({
					data: {
						nama: dto.nama,
						harga_satuan: dto.harga_satuan,
						jumlah_stok: dto.jumlah_stok,
					},
				});

				return {
					success: true,
					statusCode: 201,
					data: { stokBarang: newStokBarang },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to create stok barang",
				};
			}
		},
	},

	"/stok-barang/:id": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const idParam = req.params['id'];
				const id = parseInt(Array.isArray(idParam) ? (idParam[0] || '') : (idParam || ''));
				if (isNaN(id)) {
					return {
						success: false,
						statusCode: 400,
						message: "Invalid stok barang ID",
					};
				}

				const prisma = await getPrismaClient();
				const stokBarang = await prisma.stokBarang.findUnique({
					where: { id },
				});

				if (!stokBarang) {
					return {
						success: false,
						statusCode: 404,
						message: "Stok barang not found",
					};
				}

				return {
					success: true,
					data: { stokBarang },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch stok barang",
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
						message: "Invalid stok barang ID",
					};
				}

				const { dto, errors } = await validateDto(UpdateStokBarangDto, req.body);
				if (errors) return errors;

				const prisma = await getPrismaClient();
				const updatedStokBarang = await prisma.stokBarang.update({
					where: { id },
					data: {
						...(dto.nama && { nama: dto.nama }),
						...(dto.harga_satuan !== undefined && { harga_satuan: dto.harga_satuan }),
						...(dto.jumlah_stok !== undefined && { jumlah_stok: dto.jumlah_stok }),
					},
				});

				return {
					success: true,
					data: { stokBarang: updatedStokBarang },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to update not found")) {
					return {
						success: false,
						statusCode: 404,
						message: "Stok barang not found",
					};
				}

				return {
					success: false,
					message: "Failed to update stok barang",
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
						message: "Invalid stok barang ID",
					};
				}

				const prisma = await getPrismaClient();
				await prisma.stokBarang.delete({
					where: { id },
				});

				return {
					success: true,
					data: { message: "Stok barang deleted successfully" },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
					return {
						success: false,
						statusCode: 404,
						message: "Stok barang not found",
					};
				}

				return {
					success: false,
					message: "Failed to delete stok barang",
				};
			}
		},
	},
};

export default stokBarangRoutes;
