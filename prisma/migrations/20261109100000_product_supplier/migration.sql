-- AlterTable
ALTER TABLE `Product` ADD COLUMN `supplierId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Product_supplierId_idx` ON `Product`(`supplierId`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

