-- 🟣 Migrar categorías y etiquetas de texto a relaciones reales

-- 1️⃣ Crea categorías si no existen
INSERT INTO "Categoria" ("nombre", "createdAt", "updatedAt")
SELECT DISTINCT p."categoria", NOW(), NOW()
FROM "Product" p
WHERE p."categoria" IS NOT NULL
  AND p."categoria" <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "Categoria" c WHERE c."nombre" = p."categoria"
  );

-- 2️⃣ Crea etiquetas si no existen
INSERT INTO "Etiqueta" ("nombre", "color", "createdAt", "updatedAt")
SELECT DISTINCT p."etiqueta", '#999999', NOW(), NOW()
FROM "Product" p
WHERE p."etiqueta" IS NOT NULL
  AND p."etiqueta" <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "Etiqueta" e WHERE e."nombre" = p."etiqueta"
  );

-- 3️⃣ Asigna categoriaId a productos
UPDATE "Product" p
SET "categoriaId" = c."id"
FROM "Categoria" c
WHERE p."categoria" = c."nombre";

-- 4️⃣ Asigna etiquetaId a productos
UPDATE "Product" p
SET "etiquetaId" = e."id"
FROM "Etiqueta" e
WHERE p."etiqueta" = e."nombre";

-- 5️⃣ Limpieza opcional: puedes eliminar las columnas antiguas si aún existen
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "categoria";
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "etiqueta";
