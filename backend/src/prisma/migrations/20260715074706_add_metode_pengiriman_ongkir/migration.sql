-- AlterTable
ALTER TABLE `pesanan` ADD COLUMN `metode_pengiriman` VARCHAR(191) NOT NULL DEFAULT 'AMBIL',
    ADD COLUMN `ongkir` DOUBLE NULL;
