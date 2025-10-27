# WeldZone Backend (NestJS + Prisma)

API para el catálogo y panel de administración de WeldZone.

- Framework: NestJS 11 (TypeScript)
- Base de datos: PostgreSQL + Prisma ORM
- Auth: JWT + Refresh Token con cookie HttpOnly
- Storage: Supabase (imágenes y fichas técnicas)

Nota de negocio: actualmente no realizamos envíos. La entrega es por recolección en tienda.

---

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- PostgreSQL 14+

---

## Variables de entorno

Usa `.env` basado en `.env.example`.

- Base de datos
  - `DATABASE_URL` Postgres (lectura/escritura)
  - `DIRECT_DATABASE_URL` Postgres directo (opcional)
- Servidor
  - `PORT` puerto (default 3000)
  - `FRONTEND_URL` orígenes permitidos para CORS, separados por comas. Acepta comodín `*` por dominio (p.ej. `https://*.example.com`)
- Autenticación
  - `JWT_SECRET`
  - `REFRESH_TOKEN_SECRET` (si se omite, usa `JWT_SECRET`)
  - `REFRESH_TOKEN_EXPIRES` (p.ej. `7d`)
  - `REFRESH_TOKEN_MAX_AGE_MS` edad de cookie (ms)
- Supabase Storage
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (recomendado) o `SUPABASE_ANON_KEY`
  - `SUPABASE_BUCKET` bucket de imágenes (default `products`)
  - `SUPABASE_SPECS_BUCKET` bucket de fichas (default `products-specs`)

---

## Puesta en marcha

```bash
npm install

# Generar cliente Prisma y aplicar schema
npx prisma generate
npx prisma migrate dev --name init

# Desarrollo
npm run start:dev
```

Producción:

```bash
npm run build
npm run start:prod
```

> CORS toma los orígenes de `FRONTEND_URL`. Si ves bloqueos en consola, revisa ese valor.

---

## Modelos (Prisma)

- `Product`: nombre, descripcion, precio, stock, imagenUrl, specFileUrl, relaciones `categoria`/`etiqueta`.
- `Categoria`, `Etiqueta`: catálogos base para organizar productos.
- `User`: `username`, `passwordHash`, `role` (`admin`/`user`).
- `Configuracion`: `whatsapp` y `mantenimiento` (modo mantenimiento del sitio).

---

## Endpoints (resumen)

- Auth
  - `POST /auth/login` → devuelve `access_token` y setea cookie `refresh_token` (HttpOnly)
  - `GET /auth/me` (JWT)
  - `POST /auth/refresh` → rota refresh token (cookie)
  - `POST /auth/logout` → revoca cookie

- Products
  - `GET /products` | `GET /products/:id`
  - `POST /products` (admin)
  - `PUT /products/:id` (admin)
  - `DELETE /products/:id` (admin)

- Upload (Supabase Storage)
  - `POST /upload` (admin) → imagen de producto (`multipart/form-data` campo `file`)
  - `POST /upload-specs` (admin) → ficha técnica PDF/DOC (`file`, opcionalmente `oldPath` para reemplazo)

- Configuración
  - `GET /config` | `PUT /config` (admin) — número de WhatsApp
  - `GET /config/mantenimiento` | `PUT /config/mantenimiento` (admin)
  - `GET /config/categorias` | `POST /config/categorias` (admin)
  - `PUT /config/categorias/:id` | `DELETE /config/categorias/:id` (admin)
  - `GET /config/etiquetas` | `POST /config/etiquetas` (admin)
  - `PUT /config/etiquetas/:id` | `DELETE /config/etiquetas/:id` (admin)

- Usuarios (protegido)
  - `POST /users` (admin) crear usuario
  - `GET /users` listar
  - `DELETE /users/:id` (admin)

---

## Crear usuario admin (opciones)

- Prisma Studio (sencillo):

```bash
npx prisma studio
```

Tabla `User` → crea registro con `username`, `passwordHash` (usa hash Bcrypt) y `role = "admin"`.

- Línea de comandos (genera hash y pega en tu SQL):

```bash
node -e "(async()=>{const b=require('bcrypt');const h=await b.hash('TU_PASSWORD',10);console.log(h)})()"
```

---

## Integración con el frontend

- La URL base del backend se configura en el front con `VITE_API_URL`.
- El flujo de compra del sitio es por recolección en tienda (no hay envíos).

---

## Despliegue (genérico)

1) Proveer Postgres y un runtime Node en tu plataforma.
2) Configurar variables del `.env` (DB, JWT y Supabase) en el entorno.
3) Ejecutar `npx prisma migrate deploy` en el arranque (según mecanismo de la plataforma).
4) Exponer el puerto `PORT` que la plataforma asigne automáticamente.

---

## Scripts

- `npm run start:dev` — desarrollo con watch
- `npm run build` / `start:prod` — producción
- `npm run lint` — lint
- `npm run test` — unit
- `npm run test:e2e` — e2e
