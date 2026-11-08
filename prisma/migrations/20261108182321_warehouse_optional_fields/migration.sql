-- Only the warehouse name is required; the other fields are optional.
-- AlterTable
ALTER TABLE `Warehouse` MODIFY `email` VARCHAR(191) NULL,
    MODIFY `phoneNumber` VARCHAR(191) NULL,
    MODIFY `country` VARCHAR(191) NULL,
    MODIFY `city` VARCHAR(191) NULL,
    MODIFY `zipCode` VARCHAR(191) NULL;
