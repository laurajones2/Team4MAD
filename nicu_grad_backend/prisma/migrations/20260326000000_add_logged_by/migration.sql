-- Add loggedBy field to all log tables so each entry tracks who recorded it

ALTER TABLE "Feeding" ADD COLUMN "loggedBy" TEXT;
ALTER TABLE "Diaper" ADD COLUMN "loggedBy" TEXT;
ALTER TABLE "SleepLog" ADD COLUMN "loggedBy" TEXT;
ALTER TABLE "Growth" ADD COLUMN "loggedBy" TEXT;
ALTER TABLE "Vitals" ADD COLUMN "loggedBy" TEXT;
