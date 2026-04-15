-- Change status to ENUM
ALTER TABLE `pesanan` MODIFY COLUMN `status` ENUM('MENUNGGU', 'DIPROSES', 'SELESAI', 'BATAL') NOT NULL DEFAULT 'MENUNGGU';

-- Change mode_pesanan to ENUM
ALTER TABLE `pesanan` MODIFY COLUMN `mode_pesanan` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'ONLINE';

-- Add UNIQUE constraint to pelanggan.nomor_telepon
ALTER TABLE `pelanggan` ADD UNIQUE INDEX `pelanggan_nomor_telepon_key`(`nomor_telepon`);

-- Recreate FK barang_terbeli dengan CASCADE
ALTER TABLE `barang_terbeli` DROP FOREIGN KEY `barang_terbeli_id_pesanan_fkey`;
ALTER TABLE `barang_terbeli` ADD CONSTRAINT `barang_terbeli_id_pesanan_fkey` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;