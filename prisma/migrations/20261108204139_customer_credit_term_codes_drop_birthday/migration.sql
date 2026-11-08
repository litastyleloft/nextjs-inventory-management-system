-- Credit terms become codes ("cash", "15d", "1m" ... "12m"), and the birthday field is removed.

-- AlterTable: add the new column (existing rows default to cash)
ALTER TABLE `Customer` ADD COLUMN `creditTerm` VARCHAR(10) NOT NULL DEFAULT 'cash';

-- Carry over existing day-based terms to the nearest new option
UPDATE `Customer` SET `creditTerm` = CASE
    WHEN `creditTermDays` <= 0 THEN 'cash'
    WHEN `creditTermDays` <= 15 THEN '15d'
    WHEN `creditTermDays` >= 360 THEN '12m'
    ELSE CONCAT(LEAST(12, GREATEST(1, ROUND(`creditTermDays` / 30))), 'm')
END;

-- AlterTable: drop the old columns
ALTER TABLE `Customer` DROP COLUMN `creditTermDays`,
    DROP COLUMN `dateOfBirth`;