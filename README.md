# Reservas de padel - Comunidad de vecinos

Aplicación web (frontend en Vite + React, backend en Express) para registrar vecinos y gestionar reservas de pista.

## Requisitos

- Node.js 18+
- MongoDB (Atlas o local)

## Configuración

1. Copia `.env.example` a `.env`.
2. Rellena:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ALLOWED_HOUSE_NUMBERS` con las casas autorizadas separadas por coma.

## Ejecutar

```bash
npm install
npm run dev:api
npm run dev
```

- Frontend: `http://localhost:5173` (si está ocupado, Vite usa el siguiente puerto libre)
- API: `http://localhost:4000`

## Reglas implementadas

- Solo un usuario por número de casa.
- Solo se aceptan números de casa incluidos en la lista de casas autorizadas
- Franjas de 1,5 horas:
  - 09:00-10:30
  - 10:30-12:00
  - 12:00-13:30
  - 17:00-18:30
  - 18:30-20:00
  - 20:00-21:30
- Calendario de próximos 30 días.
- Al reservar, la franja queda bloqueada.
- Un usuario no puede reservar sesiones consecutivas.
- Máximo 1 reserva en fin de semana (por semana ISO).
- Máximo 4 reservas por semana (semana ISO).
- Vista de sesión activa actual indicando quién usa la pista.

## Despliegue En Netlify

El backend puede ejecutarse como Netlify Function mediante [netlify/functions/api.js](netlify/functions/api.js) y [netlify.toml](netlify.toml).

### Variables En Netlify

- `MONGODB_URI`: cadena de conexion de MongoDB Atlas o tu servidor Mongo.
- `JWT_SECRET`: secreto para firmar la cookie de sesion.
- `ALLOWED_HOUSE_NUMBERS`: casas autorizadas separadas por comas, por ejemplo `1,2,3,4`.
- `FRONTEND_ORIGIN`: URL principal de tu sitio en Netlify, por ejemplo `https://reservas-padel.netlify.app`.
- `COOKIE_SAME_SITE`: usa `lax` si frontend y backend van en la misma web de Netlify.
- `COOKIE_SECURE`: usa `true` en Netlify porque la web va por HTTPS.
- `VITE_API_URL`: dejala vacia si usas la misma web de Netlify con las redirects de [netlify.toml](netlify.toml).

### Notas De Produccion

- No necesitas `API_PORT` en Netlify Functions.
- Si usas previews de Netlify, [src/app.js](src/app.js) admite automaticamente `URL`, `DEPLOY_URL` y `DEPLOY_PRIME_URL`.
- Si mueves la API fuera de Netlify, rellena `VITE_API_URL` con la URL publica del backend y cambia `COOKIE_SAME_SITE` a `none`.
