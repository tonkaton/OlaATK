import type { RouteDefinitions } from "../types/index.js";
import rootRoute from "./root.js";
import authRoutes from "./auth/index.js";
import pelangganRoutes from "./pelanggan/index.js";
import akunPelangganRoutes from "./akun-pelanggan/index.js";
import dataLayananRoutes from "./data-layanan/index.js";
import pesananRoutes from "./pesanan/index.js";
import stokBarangRoutes from "./stok-barang/index.js";
import barangTerbeliRoutes from "./barang-terbeli/index.js";
import uploadRoutes from "./upload/index.js";
import statsRoutes from "./stats/index.js";
import konfigurasiRoutes from "./konfigurasi/index.js";
import paymentRoutes from "./payment/index.js";

// FOR_AI: Keep this export style, do not make it an export default
export const routes: RouteDefinitions = {
	"/": rootRoute,
	...authRoutes,
	...paymentRoutes,
	...pelangganRoutes,
	...akunPelangganRoutes,
	...dataLayananRoutes,
	...pesananRoutes,
	...stokBarangRoutes,
	...barangTerbeliRoutes,
	...uploadRoutes,
	...statsRoutes,
	...konfigurasiRoutes,
};