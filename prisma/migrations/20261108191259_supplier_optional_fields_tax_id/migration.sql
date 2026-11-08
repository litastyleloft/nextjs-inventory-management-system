-- Only the supplier name is required; the other fields are optional. Adds the optional tax ID.
-- AlterTable
ALTER TABLE `Supplier` ADD COLUMN `taxId` VARCHAR(13) NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `phoneNumber` VARCHAR(191) NULL,
    MODIFY `country` VARCHAR(191) NULL,
    MODIFY `city` VARCHAR(191) NULL,
    MODIFY `address` VARCHAR(500) NULL;
