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
- Solo se aceptan números de casa incluidos en `ALLOWED_HOUSE_NUMBERS`.
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
