/*
  Warnings:

  - You are about to drop the column `categoria` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `etiqueta` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoria",
DROP COLUMN "etiqueta",
ADD COLUMN     "categoriaId" INTEGER,
ADD COLUMN     "etiquetaId" INTEGER;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "Etiqueta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
