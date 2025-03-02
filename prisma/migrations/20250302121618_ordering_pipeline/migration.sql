-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PREPAID', 'POSTPAID', 'TAKEAWAY');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "type" "OrderType" NOT NULL DEFAULT 'POSTPAID';
