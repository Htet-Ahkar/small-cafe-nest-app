/*
  Warnings:

  - You are about to drop the `BundleItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BundleItem" DROP CONSTRAINT "BundleItem_productId_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "bundleItems" TEXT NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "BundleItem";
