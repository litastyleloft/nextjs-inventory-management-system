-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(3) NOT NULL,
    `image` VARCHAR(2048) NULL,
    `composition` VARCHAR(200) NULL,
    `weave` VARCHAR(50) NULL,
    `pattern` VARCHAR(50) NULL,
    `widthInches` DECIMAL(5, 1) NULL,
    `gsm` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Category_deletedAt_createdAt_idx`(`deletedAt`, `createdAt`),
    INDEX `Category_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

