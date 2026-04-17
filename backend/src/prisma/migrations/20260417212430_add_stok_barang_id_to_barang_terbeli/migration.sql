-- AlterTable
ALTER TABLE `barang_terbeli` ADD COLUMN `stok_barang_id` INTEGER UNSIGNED NULL;

-- AddForeignKey
ALTER TABLE `barang_terbeli` ADD CONSTRAINT `barang_terbeli_stok_barang_id_fkey` FOREIGN KEY (`stok_barang_id`) REFERENCES `stok_barang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
