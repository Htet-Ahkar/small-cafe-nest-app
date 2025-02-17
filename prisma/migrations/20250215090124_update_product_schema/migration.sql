/*
  Warnings:

  - The `type` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `price` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BUNDLE', 'BUNDLE_ITEM', 'STANDALONE');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PIECE', 'PACK', 'BOX', 'SET', 'CUP', 'SLICE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "bundleItems" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "isBundle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBundleItem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackStock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unit" "UnitType" NOT NULL DEFAULT 'PIECE',
DROP COLUMN "type",
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'STANDALONE';
