import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { validateDto } from "../../utils/validation.js";
import { CreatePelangganDto, UpdatePelangganDto } from "./dto/pelanggan.dto.js";
import { requireAdmin } from "../../auth/index.js";

const pelangganRoutes: RouteDefinitions = {
	"/pelanggan": {
		// Get all pelanggan
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
							OR: [
								{ nama_lengkap: { contains: search } },
								{ nomor_telepon: { contains: search } },
							],
					  }
					: {};

				// Get total count for pagination
				const total = await prisma.pelanggan.count({ where });

				// Get paginated data
				const pelanggan = await prisma.pelanggan.findMany({
					where,
					include: {
						akunPelanggan: true,
						pesanan: true,
					},
					skip,
					take: limit,
					orderBy: { created_at: 'desc' },
				});

				return {
					success: true,
					data: { 
						pelanggan,
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
					message: "Failed to fetch pelanggan",
				};
			}
		},

		// Create new pelanggan (public for registration, but admin can also create)
		post: async (req) => {
			// No auth required - this is used for user registration
			const { dto, errors } = await validateDto(CreatePelangganDto, req.body);
			if (errors) return errors;

			try {
				const prisma = await getPrismaClient();
				const newPelanggan = await prisma.pelanggan.create({
					data: {
						nama_lengkap: dto.nama_lengkap,
						nomor_telepon: dto.nomor_telepon,
						alamat: dto.alamat ?? null,
					},
				});

				return {
					success: true,
					statusCode: 201,
					data: { pelanggan: newPelanggan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to create pelanggan",
				};
			}
		},
	},

	"/pelanggan/:id": {
		// Get single pelanggan by ID
		get: async (req) => {
			try {
				const idParam = req.params['id'];
				const id = parseInt(Array.isArray(idParam) ? (idParam[0] || '') : (idParam || ''));
				if (isNaN(id)) {
					return {
						success: false,
						statusCode: 400,
						message: "Invalid pelanggan ID",
					};
				}

				const prisma = await getPrismaClient();
				const pelanggan = await prisma.pelanggan.findUnique({
					where: { id },
					include: {
						akunPelanggan: true,
						pesanan: true,
					},
				});

				if (!pelanggan) {
					return {
						success: false,
						statusCode: 404,
						message: "Pelanggan not found",
					};
				}

				return {
					success: true,
					data: { pelanggan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch pelanggan",
				};
			}
		},

		// Update pelanggan
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
						message: "Invalid pelanggan ID",
					};
				}

				const { dto, errors } = await validateDto(UpdatePelangganDto, req.body);
				if (errors) return errors;

				const prisma = await getPrismaClient();
				const updatedPelanggan = await prisma.pelanggan.update({
					where: { id },
					data: {
						...(dto.nama_lengkap && { nama_lengkap: dto.nama_lengkap }),
						...(dto.nomor_telepon && { nomor_telepon: dto.nomor_telepon }),
						...(dto.alamat !== undefined && { alamat: dto.alamat }),
					},
				});

				return {
					success: true,
					data: { pelanggan: updatedPelanggan },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to update not found")) {
					return {
						success: false,
						statusCode: 404,
						message: "Pelanggan not found",
					};
				}

				return {
					success: false,
					message: "Failed to update pelanggan",
				};
			}
		},

		// Delete pelanggan
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
						message: "Invalid pelanggan ID",
					};
				}

				const prisma = await getPrismaClient();
				
				// Check if pelanggan exists
				const pelanggan = await prisma.pelanggan.findUnique({
					where: { id },
					include: {
						akunPelanggan: true,
						pesanan: {
							include: {
								barangTerbeli: true,
							},
						},
					},
				});

				if (!pelanggan) {
					return {
						success: false,
						statusCode: 404,
						message: "Pelanggan not found",
					};
				}

				// Delete in transaction to ensure cascade deletion
				await prisma.$transaction(async (tx) => {
					// Delete all barangTerbeli related to pesanan
					for (const pesanan of pelanggan.pesanan) {
						if (pesanan.barangTerbeli.length > 0) {
							await tx.barangTerbeli.deleteMany({
								where: { id_pesanan: pesanan.id },
							});
						}
					}

					// Delete all pesanan
					if (pelanggan.pesanan.length > 0) {
						await tx.pesanan.deleteMany({
							where: { id_pelanggan: id },
						});
					}

					// Delete akun pelanggan if exists
					if (pelanggan.akunPelanggan) {
						await tx.akunPelanggan.delete({
							where: { id: pelanggan.akunPelanggan.id },
						});
					}

					// Finally delete pelanggan
					await tx.pelanggan.delete({
						where: { id },
					});
				});

				return {
					success: true,
					data: { message: "Pelanggan deleted successfully" },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
					return {
						success: false,
						statusCode: 404,
						message: "Pelanggan not found",
					};
				}

				return {
					success: false,
					message: "Failed to delete pelanggan",
				};
			}
		},
	},
};

export default pelangganRoutes;
