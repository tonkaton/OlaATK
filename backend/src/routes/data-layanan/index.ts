import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { validateDto } from "../../utils/validation.js";
import { CreateDataLayananDto, UpdateDataLayananDto } from "./dto/data-layanan.dto.js";
import { requireAdmin } from "../../auth/index.js";

const dataLayananRoutes: RouteDefinitions = {
	"/data-layanan": {
		get: async (req) => {
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
								{ nama: { contains: search } },
								{ deskripsi: { contains: search } },
							],
					  }
					: {};

				// Get total count for pagination
				const total = await prisma.dataLayanan.count({ where });

				// Get paginated data
				const dataLayanan = await prisma.dataLayanan.findMany({
					where,
					skip,
					take: limit,
					orderBy: { created_at: 'desc' },
				});

				return {
					success: true,
					data: { 
						dataLayanan,
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
					message: "Failed to fetch data layanan",
				};
			}
		},

		post: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			const { dto, errors } = await validateDto(CreateDataLayananDto, req.body);
			if (errors) return errors;

			try {
				const prisma = await getPrismaClient();
				const newDataLayanan = await prisma.dataLayanan.create({
					data: {
						nama: dto.nama,
						deskripsi: dto.deskripsi,
						nama_icon: dto.nama_icon,
						status_layanan: dto.status_layanan,
					},
				});

				return {
					success: true,
					statusCode: 201,
					data: { dataLayanan: newDataLayanan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to create data layanan",
				};
			}
		},
	},

	"/data-layanan/active": {
		get: async () => {
			try {
				const prisma = await getPrismaClient();
				const dataLayanan = await prisma.dataLayanan.findMany({
					where: { status_layanan: true },
					orderBy: { created_at: 'asc' },
					select: {
						id: true,
						nama: true,
						deskripsi: true,
						nama_icon: true,
					},
				});

				return {
					success: true,
					data: { dataLayanan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch active data layanan",
				};
			}
		},
	},

	"/data-layanan/:id": {
		get: async (req) => {
			try {
				const idParam = req.params['id'];
				const id = parseInt(Array.isArray(idParam) ? (idParam[0] || '') : (idParam || ''));
				if (isNaN(id)) {
					return {
						success: false,
						statusCode: 400,
						message: "Invalid data layanan ID",
					};
				}

				const prisma = await getPrismaClient();
				const dataLayanan = await prisma.dataLayanan.findUnique({
					where: { id },
				});

				if (!dataLayanan) {
					return {
						success: false,
						statusCode: 404,
						message: "Data layanan not found",
					};
				}

				return {
					success: true,
					data: { dataLayanan },
				};
			} catch (error) {
				return {
					success: false,
					message: "Failed to fetch data layanan",
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
						message: "Invalid data layanan ID",
					};
				}

				const { dto, errors } = await validateDto(UpdateDataLayananDto, req.body);
				if (errors) return errors;

				const prisma = await getPrismaClient();
				const updatedDataLayanan = await prisma.dataLayanan.update({
					where: { id },
					data: {
						...(dto.nama && { nama: dto.nama }),
						...(dto.deskripsi && { deskripsi: dto.deskripsi }),
						...(dto.nama_icon && { nama_icon: dto.nama_icon }),
						...(dto.status_layanan !== undefined && { status_layanan: dto.status_layanan }),
					},
				});

				return {
					success: true,
					data: { dataLayanan: updatedDataLayanan },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to update not found")) {
					return {
						success: false,
						statusCode: 404,
						message: "Data layanan not found",
					};
				}

				return {
					success: false,
					message: "Failed to update data layanan",
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
						message: "Invalid data layanan ID",
					};
				}

				const prisma = await getPrismaClient();
				await prisma.dataLayanan.delete({
					where: { id },
				});

				return {
					success: true,
					data: { message: "Data layanan deleted successfully" },
				};
			} catch (error) {
				if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
					return {
						success: false,
						statusCode: 404,
						message: "Data layanan not found",
					};
				}

				return {
					success: false,
					message: "Failed to delete data layanan",
				};
			}
		},
	},
};

export default dataLayananRoutes;
