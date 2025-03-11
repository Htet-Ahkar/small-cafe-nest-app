/*
  Warnings:

  - Added the required column `userId` to the `Tax` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tax" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
