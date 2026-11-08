-- Roles move into their own table (filled with the design's four roles), users gain a
-- soft-delete flag, and User.role must now reference an existing role.

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `tone` VARCHAR(20) NOT NULL DEFAULT 'neutral',
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The design's roles (design/src/data/people-data.js)
INSERT INTO `Role` (`id`, `name`, `description`, `tone`, `isSystem`, `updatedAt`) VALUES
    ('admin',   'ผู้ดูแลระบบ',        'เข้าถึงทุกเมนู รวมถึงตั้งค่าและบทบาท',             'navy',    true,  CURRENT_TIMESTAMP(3)),
    ('manager', 'ผู้จัดการ',          'ดูรายงาน อนุมัติการซื้อ ขาย และโอนย้าย',            'info',    false, CURRENT_TIMESTAMP(3)),
    ('sales',   'พนักงานขาย',        'ใช้ POS สร้างรายการขาย ใบรับคืน และใบวางบิล',       'success', false, CURRENT_TIMESTAMP(3)),
    ('stock',   'พนักงานคลังสินค้า',  'จัดการสินค้า ปรับปรุงสต็อก และโอนย้ายสินค้า',        'warning', false, CURRENT_TIMESTAMP(3));

-- Any other role already used by a user is kept, so the foreign key below cannot fail
INSERT INTO `Role` (`id`, `name`, `updatedAt`)
SELECT DISTINCT `role`, `role`, CURRENT_TIMESTAMP(3) FROM `User`
WHERE `role` NOT IN (SELECT `id` FROM `Role`);

-- AlterTable
ALTER TABLE `User` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `User_deletedAt_createdAt_idx` ON `User`(`deletedAt`, `createdAt`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_role_fkey` FOREIGN KEY (`role`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;