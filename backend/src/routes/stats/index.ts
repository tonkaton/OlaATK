import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { requireAdmin } from "../../auth/index.js";

const statsRoutes: RouteDefinitions = {
	"/stats/dashboard": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();

				// Get start and end of today
				const startOfDay = new Date();
				startOfDay.setHours(0, 0, 0, 0);
				
				const endOfDay = new Date();
				endOfDay.setHours(23, 59, 59, 999);

				// Count orders today (All status - raw traffic)
				const ordersToday = await prisma.pesanan.count({
					where: {
						created_at: {
							gte: startOfDay,
							lte: endOfDay,
						},
					},
				});

				// Count total customers
				const totalCustomers = await prisma.pelanggan.count();

				// Calculate total revenue (HANYA YANG SELESAI)
				const revenueResult = await prisma.pesanan.aggregate({
					where: { status: 'SELESAI' },
					_sum: {
						nilai_pesanan: true,
					},
				});

				const totalRevenue = revenueResult._sum.nilai_pesanan || 0;

				// Count total products
				const totalProducts = await prisma.stokBarang.count();

				// Count total orders (all time)
				const totalOrders = await prisma.pesanan.count();

				// Get weekly sales data (last 7 days - HANYA YANG SELESAI)
				const weeklySales = [];
				const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
				const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
				
				for (let i = 6; i >= 0; i--) {
					const date = new Date();
					date.setDate(date.getDate() - i);
					date.setHours(0, 0, 0, 0);
					
					const nextDate = new Date(date);
					nextDate.setDate(nextDate.getDate() + 1);
					
					const dailyRevenue = await prisma.pesanan.aggregate({
						where: {
							created_at: {
								gte: date,
								lt: nextDate,
							},
							status: 'SELESAI', // Filter uang riil
						},
						_sum: {
							nilai_pesanan: true,
						},
						_count: true,
					});

					weeklySales.push({
						day: dayNames[date.getDay()],
						date: date.toISOString().split('T')[0],
						dateLabel: `${date.getDate()} ${monthNames[date.getMonth()]}`,
						sales: dailyRevenue._sum.nilai_pesanan || 0,
						orders: dailyRevenue._count,
					});
				}

				return {
					success: true,
					data: {
						ordersToday,
						totalCustomers,
						totalRevenue,
						totalProducts,
						totalOrders,
						weeklySales,
					},
				};
			} catch (error) {
				console.error("Error fetching dashboard stats:", error);
				return {
					success: false,
					message: "Failed to fetch dashboard statistics",
				};
			}
		},
	},
};

export default statsRoutes;