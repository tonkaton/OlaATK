-- CreateTable
CREATE TABLE `akun_pelanggan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_pelanggan` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nomor_telepon` VARCHAR(191) NOT NULL,
    `alamat` TEXT NULL,
    `hashed_password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `akun_pelanggan_id_pelanggan_key`(`id_pelanggan`),
    UNIQUE INDEX `akun_pelanggan_email_key`(`email`),
    UNIQUE INDEX `akun_pelanggan_nomor_telepon_key`(`nomor_telepon`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang_terbeli` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_pesanan` INTEGER UNSIGNED NOT NULL,
    `nama_barang` VARCHAR(191) NOT NULL,
    `harga_satuan` DOUBLE NOT NULL,
    `jumlah` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_layanan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `nama_icon` VARCHAR(191) NOT NULL,
    `status_layanan` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `konfigurasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kunci` VARCHAR(100) NOT NULL,
    `nilai` TEXT NOT NULL,
    `deskripsi` TEXT NULL,
    `tipe` VARCHAR(50) NOT NULL DEFAULT 'text',
    `grup` VARCHAR(50) NOT NULL DEFAULT 'umum',
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `konfigurasi_kunci_key`(`kunci`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pelanggan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `nama_lengkap` VARCHAR(191) NOT NULL,
    `nomor_telepon` VARCHAR(191) NOT NULL,
    `alamat` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pesanan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_pelanggan` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `jenis_layanan` VARCHAR(191) NOT NULL,
    `nama_file` VARCHAR(191) NULL,
    `catatan_pesanan` VARCHAR(191) NULL,
    `nilai_pesanan` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_barang` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `harga_satuan` DOUBLE NOT NULL,
    `jumlah_stok` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `akun_pelanggan` ADD CONSTRAINT `akun_pelanggan_id_pelanggan_fkey` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang_terbeli` ADD CONSTRAINT `barang_terbeli_id_pesanan_fkey` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pesanan` ADD CONSTRAINT `pesanan_id_pelanggan_fkey` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
