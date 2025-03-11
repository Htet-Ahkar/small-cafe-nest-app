-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "rounding" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
ADD COLUMN     "taxIds" INTEGER[];

-- CreateTable
CREATE TABLE "Tax" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTax" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" INTEGER NOT NULL,
    "taxId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderTax_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderTax_orderId_taxId_key" ON "OrderTax"("orderId", "taxId");

-- AddForeignKey
ALTER TABLE "OrderTax" ADD CONSTRAINT "OrderTax_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTax" ADD CONSTRAINT "OrderTax_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE CASCADE ON UPDATE CASCADE;
