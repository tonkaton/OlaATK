-- AlterTable
ALTER TABLE `stok_barang` ADD COLUMN `isi_per_satuan` INTEGER NULL,
    ADD COLUMN `satuan` VARCHAR(191) NOT NULL DEFAULT 'PCS';
