-- AlterTable
ALTER TABLE `pesanan` ADD COLUMN `tracking_code` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pesanan_tracking_code_key` ON `pesanan`(`tracking_code`);
