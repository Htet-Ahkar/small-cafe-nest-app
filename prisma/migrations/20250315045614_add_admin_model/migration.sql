-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('LIMITED', 'FREE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tier" "UserTier" NOT NULL DEFAULT 'LIMITED';

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
