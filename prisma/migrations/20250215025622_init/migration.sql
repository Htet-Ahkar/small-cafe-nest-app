-- DropIndex
DROP INDEX "users_userName_key";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "userName" DROP NOT NULL;
