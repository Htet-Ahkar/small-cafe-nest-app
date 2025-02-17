/*
  Warnings:

  - You are about to drop the column `isBundle` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isBundleItem` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "isBundle",
DROP COLUMN "isBundleItem",
ALTER COLUMN "bundleItems" SET DATA TYPE TEXT;
