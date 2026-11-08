-- Sessions signed in before the last password change are ended.
-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordChangedAt` DATETIME(3) NULL;
