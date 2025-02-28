/*
  Warnings:

  - You are about to drop the column `tableName` on the `tables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `tables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `tables` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tables_tableName_key";

-- AlterTable
ALTER TABLE "tables" DROP COLUMN "tableName",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tables_name_key" ON "tables"("name");
