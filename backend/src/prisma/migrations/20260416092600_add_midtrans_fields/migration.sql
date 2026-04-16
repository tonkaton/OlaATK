/*
  Warnings:

  - A unique constraint covering the columns `[midtrans_order_id]` on the table `pesanan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `pesanan` ADD COLUMN `midtrans_order_id` VARCHAR(191) NULL,
    ADD COLUMN `payment_status` VARCHAR(191) NULL,
    ADD COLUMN `snap_token` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pesanan_midtrans_order_id_key` ON `pesanan`(`midtrans_order_id`);
