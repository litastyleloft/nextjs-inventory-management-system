-- CreateTable
CREATE TABLE `Adjustment` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(30) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `reason` VARCHAR(50) NOT NULL,
    `notes` VARCHAR(1000) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Adjustment_reference_key`(`reference`),
    INDEX `Adjustment_deletedAt_createdAt_idx`(`deletedAt`, `createdAt`),
    INDEX `Adjustment_warehouseId_idx`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdjustmentItem` (
    `id` VARCHAR(191) NOT NULL,
    `adjustmentId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL,
    `type` ENUM('ADDITION', 'SUBTRACTION') NOT NULL,
    `stockBefore` DECIMAL(12, 2) NOT NULL,
    `stockAfter` DECIMAL(12, 2) NOT NULL,

    INDEX `AdjustmentItem_productId_idx`(`productId`),
    UNIQUE INDEX `AdjustmentItem_adjustmentId_productId_key`(`adjustmentId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentSequence` (
    `key` VARCHAR(30) NOT NULL,
    `lastNumber` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Adjustment` ADD CONSTRAINT `Adjustment_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Adjustment` ADD CONSTRAINT `Adjustment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdjustmentItem` ADD CONSTRAINT `AdjustmentItem_adjustmentId_fkey` FOREIGN KEY (`adjustmentId`) REFERENCES `Adjustment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdjustmentItem` ADD CONSTRAINT `AdjustmentItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

