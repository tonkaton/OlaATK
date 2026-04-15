import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { requireAdmin } from "../../auth/index.js";

const konfigurasiRoutes: RouteDefinitions = {
	// GET /konfigurasi/public - Get configs as key-value (public)
	"/konfigurasi/public": {
		get: async () => {
			try {
				const prisma = await getPrismaClient();
				const configs = await prisma.konfigurasi.findMany({
					select: {
						kunci: true,
						nilai: true
					}
				});

				const configObject: Record<string, string> = {};
				configs.forEach(config => {
					configObject[config.kunci] = config.nilai;
				});

				return {
					success: true,
					data: configObject
				};
			} catch (error) {
				console.error('Error fetching public configurations:', error);
				return {
					success: false,
					message: 'Failed to fetch configurations'
				};
			}
		}
	},

	// GET /konfigurasi - Get all configurations with details (admin only)
	"/konfigurasi": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();
				const configs = await prisma.konfigurasi.findMany({
					orderBy: [
						{ grup: 'asc' },
						{ urutan: 'asc' }
					]
				});

				// Also provide flat key-value for convenience
				const configObject: Record<string, string> = {};
				configs.forEach(config => {
					configObject[config.kunci] = config.nilai;
				});

				return {
					success: true,
					data: {
						konfigurasi: configs,
						config: configObject
					}
				};
			} catch (error) {
				console.error('Error fetching configurations:', error);
				return {
					success: false,
					message: 'Failed to fetch configurations'
				};
			}
		}
	},

	// PUT /konfigurasi/batch - Batch update configurations (admin only)
	"/konfigurasi/batch": {
		put: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const { configs } = req.body;

				if (!Array.isArray(configs)) {
					return {
						success: false,
						message: 'Configs must be an array'
					};
				}

				const prisma = await getPrismaClient();

				// Update all configs in a transaction
				const updates = configs.map((config: { id: number; nilai: string }) => 
					prisma.konfigurasi.update({
						where: { id: config.id },
						data: { nilai: config.nilai }
					})
				);

				await prisma.$transaction(updates);

				return {
					success: true,
					data: { message: 'Configurations updated successfully' }
				};
			} catch (error) {
				console.error('Error batch updating configurations:', error);
				return {
					success: false,
					message: 'Failed to update configurations'
				};
			}
		}
	},

	// GET /konfigurasi/:id - Get single configuration by ID (admin only)
	"/konfigurasi/:id": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const { id } = req.params;
				const prisma = await getPrismaClient();
				
				const config = await prisma.konfigurasi.findUnique({
					where: { id: Number(id) }
				});

				if (!config) {
					return {
						success: false,
						message: 'Configuration not found'
					};
				}

				return {
					success: true,
					data: { konfigurasi: config }
				};
			} catch (error) {
				console.error('Error fetching configuration:', error);
				return {
					success: false,
					message: 'Failed to fetch configuration'
				};
			}
		},

		// PUT /konfigurasi/:id - Update configuration (admin only)
		put: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const { id } = req.params;
				const { nilai, deskripsi, urutan } = req.body;

				// Build update data object
				const updateData: any = {};
				if (nilai !== undefined) updateData.nilai = nilai;
				if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
				if (urutan !== undefined) updateData.urutan = Number(urutan);

				const prisma = await getPrismaClient();
				const config = await prisma.konfigurasi.update({
					where: { id: Number(id) },
					data: updateData
				});

				return {
					success: true,
					data: { konfigurasi: config }
				};
			} catch (error) {
				console.error('Error updating configuration:', error);
				return {
					success: false,
					message: 'Failed to update configuration'
				};
			}
		}
	}
};

export default konfigurasiRoutes;
