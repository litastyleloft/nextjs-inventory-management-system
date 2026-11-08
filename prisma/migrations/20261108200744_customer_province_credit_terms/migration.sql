-- Province (city) is required; adds the default credit term in days (0 = cash).
-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `creditTermDays` INTEGER NOT NULL DEFAULT 0,
    MODIFY `city` VARCHAR(191) NOT NULL;
