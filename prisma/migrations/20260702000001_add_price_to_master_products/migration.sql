-- Add price column to master_products
ALTER TABLE "master_products" ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0;
