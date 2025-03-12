/*
  Warnings:

  - Added the required column `orderType` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderType" TEXT NOT NULL DEFAULT 'one-time';
-- 기존 데이터에 기본값 적용 후 기본값 제약 제거
ALTER TABLE "Order" ALTER COLUMN "orderType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'one-time';
