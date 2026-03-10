import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { validateDto } from "../../utils/validation.js";
import { CreateAkunPelangganDto, UpdateAkunPelangganDto } from "./dto/akun-pelanggan.dto.js";
import { requireAdmin } from "../../auth/index.js";

const akunPelangganRoutes: RouteDefinitions = {
	"/akun-pelanggan": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const search = req.query?.['search'] as string | undefined;
				const page = parseInt((req.query?.['page'] as string) || '1');
				const limit = parseInt((req.query?.['limit'] as string) || '10');
				const skip = (page - 1) * limit;

				const where = search
					? {
							OR: [
								{ email: { contains: search } },
								{ nomor_telepon: { contains: search } },
								{ pelanggan: { nama_lengkap: { contains: search } } },
							],
					  }
					: {};

				const prisma = await getPrismaClient();
				const total = await prisma.akunPelanggan.count({ where });
				const akunPelanggan = await prisma.akunPelanggan.findMany({
					where,
					skip,
					take: limit,
					include: {
						pelanggan: true,
					},
					orderBy: {
						created_at: 'desc',
					},
				});

				return {
					success: true,
					data: {
						akunPelanggan,
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
					message: "Failed to fetch akun pelanggan",
				};
			}
		},

		post: async (req) => {
			// No auth required - this is used for user registration
			// Note: In production, consider adding rate limiting or CAPTCHA
			const { dto, errors } = await validateDto(CreateAkunPelangganDto, req.body);
			if (errors) return errors;

			try {
				const prisma = await getPrismaClient();
				const newAkunPelanggan = await prisma.akunPelanggan.create({
					data: {
						id_pelanggan: dto.id_pelanggan,
						email: dto.email,
						nomor_telepon: dto.nomor_telepon,
						hashed_password: dto.hashed_password,
						alamat: dto.alamat ?? null,
					},
					include: {
						pelanggan: true,
					},
				});

				return {
					success: true,
					statusCode: 201,
					data: { akunPelanggan: newAkunPelanggan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to create akun pelanggan",
				};
			}
		},
	},

	"/akun-pelanggan/:id": {
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
						message: "Invalid akun pelanggan ID",
					};
				}

				const prisma = await getPrismaClient();
				const akunPelanggan = await prisma.akunPelanggan.findUnique({
					where: { id },
					include: {
						pelanggan: true,
					},
				});

				if (!akunPelanggan) {
					return {
						success: false,
						statusCode: 404,
						message: "Akun pelanggan not found",
					};
				}

				return {
					success: true,
					data: { akunPelanggan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch akun pelanggan",
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
						message: "Invalid akun pelanggan ID",
					};
				}

				const { dto, errors } = await validateDto(UpdateAkunPelangganDto, req.body);
				if (errors) return errors;

				const prisma = await getPrismaClient();
				const updatedAkunPelanggan = await prisma.akunPelanggan.update({
					where: { id },
					data: {
						...(dto.email && { email: dto.email }),
						...(dto.nomor_telepon && { nomor_telepon: dto.nomor_telepon }),
						...(dto.hashed_password && { hashed_password: dto.hashed_password }),
						...(dto.alamat !== undefined && { alamat: dto.alamat }),
					},
					include: {
						pelanggan: true,
					},
				});

				return {
					success: true,
					data: { akunPelanggan: updatedAkunPelanggan },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to update not found")) {
					return {
						success: false,
						statusCode: 404,
						message: "Akun pelanggan not found",
					};
				}

				return {
					success: false,
					message: "Failed to update akun pelanggan",
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
						message: "Invalid akun pelanggan ID",
					};
				}

				const prisma = await getPrismaClient();
				await prisma.akunPelanggan.delete({
					where: { id },
				});

				return {
					success: true,
					data: { message: "Akun pelanggan deleted successfully" },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
					return {
						success: false,
						statusCode: 404,
						message: "Akun pelanggan not found",
					};
				}

				return {
					success: false,
					message: "Failed to delete akun pelanggan",
				};
			}
		},
	},
};

export default akunPelangganRoutes;
