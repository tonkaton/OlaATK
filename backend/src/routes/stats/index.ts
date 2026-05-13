import type { RouteDefinitions } from "../../types/index.js";
import { getPrismaClient } from "../../prisma/index.js";
import { requireAdmin } from "../../auth/index.js";

// ─────────────────────────────────────────────────────────
// HELPER: Date key pakai local time (bukan UTC)
// ─────────────────────────────────────────────────────────
function toLocalDateKey(d: Date): string {
	const yyyy = d.getFullYear();
	const mm = (d.getMonth() + 1).toString().padStart(2, "0");
	const dd = d.getDate().toString().padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

// ─────────────────────────────────────────────────────────
// HELPER: Hitung date range + groupBy dari period string
// ─────────────────────────────────────────────────────────
function getPeriodRange(period: string): {
	startDate: Date;
	endDate: Date;
	groupBy: "hour" | "day" | "week" | "month";
} {
	const now = new Date();
	const endDate = new Date(now);
	endDate.setHours(23, 59, 59, 999);
	const startDate = new Date(now);

	switch (period) {
		case "1d":
			startDate.setHours(0, 0, 0, 0);
			return { startDate, endDate, groupBy: "hour" };
		case "30d":
			startDate.setDate(now.getDate() - 29);
			startDate.setHours(0, 0, 0, 0);
			return { startDate, endDate, groupBy: "day" };
		case "3m":
			startDate.setMonth(now.getMonth() - 3);
			startDate.setHours(0, 0, 0, 0);
			return { startDate, endDate, groupBy: "week" };
		case "6m":
			startDate.setMonth(now.getMonth() - 6);
			startDate.setHours(0, 0, 0, 0);
			return { startDate, endDate, groupBy: "month" };
		case "1y":
			startDate.setFullYear(now.getFullYear() - 1);
			startDate.setHours(0, 0, 0, 0);
			return { startDate, endDate, groupBy: "month" };
		default: // "7d"
			startDate.setDate(now.getDate() - 6);
			startDate.setHours(0, 0, 0, 0);
			return { startDate, endDate, groupBy: "day" };
	}
}

function getISOWeek(d: Date): number {
	const date = new Date(d);
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
	const week1 = new Date(date.getFullYear(), 0, 4);
	return (
		1 +
		Math.round(
			((date.getTime() - week1.getTime()) / 86400000 -
				3 +
				((week1.getDay() + 6) % 7)) /
				7
		)
	);
}

// ─────────────────────────────────────────────────────────
// HELPER: Group raw orders ke time bucket (fix N+1 + timezone)
// ─────────────────────────────────────────────────────────
function groupSalesData(
	orders: { created_at: Date; nilai_pesanan: number }[],
	startDate: Date,
	endDate: Date,
	groupBy: "hour" | "day" | "week" | "month"
): { label: string; displayLabel: string; sales: number; orders: number }[] {
	const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
	const buckets = new Map<string, { sales: number; orders: number }>();

	// Generate semua bucket kosong — biar grafik gak bolong
	const cursor = new Date(startDate);

	if (groupBy === "hour") {
		while (cursor <= endDate) {
			const key = `${cursor.getHours().toString().padStart(2, "0")}:00`;
			if (!buckets.has(key)) buckets.set(key, { sales: 0, orders: 0 });
			cursor.setHours(cursor.getHours() + 1);
		}
	} else if (groupBy === "day") {
		while (cursor <= endDate) {
			const key = toLocalDateKey(cursor); // fix: pakai local time
			buckets.set(key, { sales: 0, orders: 0 });
			cursor.setDate(cursor.getDate() + 1);
		}
	} else if (groupBy === "week") {
		while (cursor <= endDate) {
			const w = getISOWeek(cursor);
			const key = `${cursor.getFullYear()}-W${w.toString().padStart(2, "0")}`;
			if (!buckets.has(key)) buckets.set(key, { sales: 0, orders: 0 });
			cursor.setDate(cursor.getDate() + 7);
		}
	} else {
		while (cursor <= endDate) {
			const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, "0")}`;
			if (!buckets.has(key)) buckets.set(key, { sales: 0, orders: 0 });
			cursor.setMonth(cursor.getMonth() + 1);
		}
	}

	// Isi bucket dengan data aktual
	for (const order of orders) {
		const d = new Date(order.created_at);
		let key: string;

		if (groupBy === "hour") {
			key = `${d.getHours().toString().padStart(2, "0")}:00`;
		} else if (groupBy === "day") {
			key = toLocalDateKey(d); // fix: pakai local time
		} else if (groupBy === "week") {
			const w = getISOWeek(d);
			key = `${d.getFullYear()}-W${w.toString().padStart(2, "0")}`;
		} else {
			key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
		}

		const b = buckets.get(key);
		if (b) {
			b.sales += order.nilai_pesanan;
			b.orders += 1;
		}
	}

	return Array.from(buckets.entries()).map(([key, val]) => {
		let displayLabel = key;
		if (groupBy === "day") {
			// fix: parse manual, jangan new Date() — UTC trap
			const [, m, day] = key.split("-");
			displayLabel = `${parseInt(day ?? "0")} ${MONTHS_ID[parseInt(m ?? "1") - 1]}`;
		} else if (groupBy === "month") {
			const [year, month] = key.split("-") as [string, string];
			displayLabel = `${MONTHS_ID[parseInt(month) - 1]} ${year}`;
		}
		return { label: key, displayLabel, sales: val.sales, orders: val.orders };
	});
}

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────
const statsRoutes: RouteDefinitions = {

	// GET /stats/dashboard?period=7d
	// period: 1d | 7d | 30d | 3m | 6m | 1y  (default: 7d)
	"/stats/dashboard": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();
				const period = (req.query?.["period"] as string) || "7d";
				const { startDate, endDate, groupBy } = getPeriodRange(period);

				const now = new Date();
				const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
				const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);

				// Semua query parallel — 1 round trip ke DB
				const [ordersToday, totalCustomers, totalProducts, totalOrders, revenueResult, periodOrders] = await Promise.all([
					prisma.pesanan.count({
						where: { created_at: { gte: startOfToday, lte: endOfToday } },
					}),
					prisma.pelanggan.count(),
					prisma.stokBarang.count(),
					prisma.pesanan.count(),
					prisma.pesanan.aggregate({
						where: { status: "SELESAI" },
						_sum: { nilai_pesanan: true },
					}),
					prisma.pesanan.findMany({
						where: {
							created_at: { gte: startDate, lte: endDate },
							status: "SELESAI",
						},
						select: { created_at: true, nilai_pesanan: true },
						orderBy: { created_at: "asc" },
					}),
				]);

				const salesData = groupSalesData(periodOrders, startDate, endDate, groupBy);
				const periodRevenue = periodOrders.reduce((s, o) => s + o.nilai_pesanan, 0);

				return {
					success: true,
					data: {
						ordersToday,
						totalCustomers,
						totalRevenue: revenueResult._sum.nilai_pesanan || 0,
						totalProducts,
						totalOrders,
						periodRevenue,
						periodOrders: periodOrders.length,
						period,
						salesData,
						// backward compat dengan Dashboard.jsx yang sekarang
						weeklySales: salesData.map((d) => ({
							day: d.displayLabel,
							date: d.label,
							dateLabel: d.displayLabel,
							sales: d.sales,
							orders: d.orders,
						})),
					},
				};
			} catch (error) {
				console.error("Error fetching dashboard stats:", error);
				return { success: false, message: "Failed to fetch dashboard statistics" };
			}
		},
	},

	// GET /stats/top-products?period=30d&limit=10&only_products=true
	"/stats/top-products": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();
				const period = (req.query?.["period"] as string) || "30d";
				const limit = parseInt((req.query?.["limit"] as string) || "10");
				const onlyProducts = req.query?.["only_products"] === "true";
				const { startDate, endDate } = getPeriodRange(period);

				const items = await prisma.barangTerbeli.findMany({
					where: {
						...(onlyProducts && { stok_barang_id: { not: null } }),
						pesanan: {
							created_at: { gte: startDate, lte: endDate },
							status: "SELESAI",
						},
					},
					select: {
						nama_barang: true,
						jumlah: true,
						harga_satuan: true,
					},
				});

				const map = new Map<string, { nama: string; totalJumlah: number; totalRevenue: number }>();
				for (const item of items) {
					const existing = map.get(item.nama_barang);
					if (existing) {
						existing.totalJumlah += item.jumlah;
						existing.totalRevenue += item.jumlah * item.harga_satuan;
					} else {
						map.set(item.nama_barang, {
							nama: item.nama_barang,
							totalJumlah: item.jumlah,
							totalRevenue: item.jumlah * item.harga_satuan,
						});
					}
				}

				const topProducts = Array.from(map.values())
					.sort((a, b) => b.totalJumlah - a.totalJumlah)
					.slice(0, limit);

				return { success: true, data: { topProducts, period } };
			} catch (error) {
				console.error("Error fetching top products:", error);
				return { success: false, message: "Gagal mengambil data produk terlaris" };
			}
		},
	},

	// GET /stats/calendar?year=2025&month=5
	"/stats/calendar": {
		get: async (req) => {
			const authError = requireAdmin(req);
			if (authError) return authError;

			try {
				const prisma = await getPrismaClient();
				const now = new Date();
				const year = parseInt((req.query?.["year"] as string) || now.getFullYear().toString());
				const month = parseInt((req.query?.["month"] as string) || (now.getMonth() + 1).toString());

				const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
				const endDate = new Date(year, month, 0, 23, 59, 59, 999);

				const orders = await prisma.pesanan.findMany({
					where: {
						created_at: { gte: startDate, lte: endDate },
						status: "SELESAI",
					},
					select: {
						created_at: true,
						nilai_pesanan: true,
						jenis_layanan: true,
						status: true,
						uang_diterima: true,
						kembalian: true,
					},
					orderBy: { created_at: "asc" },
				});

				const dailyMap = new Map<string, {
					date: string;
					sales: number;
					orders: number;
					details: {
						jenis: string;
						nilai: number;
						status: string;
						uang_diterima: number | null;
						kembalian: number | null;
					}[];
				}>();

				for (const order of orders) {
					const d = new Date(order.created_at);
					const dateKey = toLocalDateKey(d); // fix: local time
					const existing = dailyMap.get(dateKey);
					if (existing) {
						existing.sales += order.nilai_pesanan;
						existing.orders += 1;
						existing.details.push({
							jenis: order.jenis_layanan,
							nilai: order.nilai_pesanan,
							status: order.status,
							uang_diterima: order.uang_diterima,
							kembalian: order.kembalian,
						});
					} else {
						dailyMap.set(dateKey, {
							date: dateKey,
							sales: order.nilai_pesanan,
							orders: 1,
							details: [{
								jenis: order.jenis_layanan,
								nilai: order.nilai_pesanan,
								status: order.status,
								uang_diterima: order.uang_diterima,
								kembalian: order.kembalian,
							}],
						});
					}
				}

				const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

				return {
					success: true,
					data: {
						year,
						month,
						dailyData,
						totalSales: orders.reduce((s, o) => s + o.nilai_pesanan, 0),
						totalOrders: orders.length,
					},
				};
			} catch (error) {
				console.error("Error fetching calendar stats:", error);
				return { success: false, message: "Gagal mengambil data kalender" };
			}
		},
	},
};

export default statsRoutes;