-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'MERCADOPAGO';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "externalUri" TEXT;
