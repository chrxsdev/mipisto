# Mi Pisto

A personal finance web application for tracking income, expenses, credit cards, and categories, with a JWT-protected API, PostgreSQL persistence, and an analytics-focused dashboard.

## Stack

- Frontend: Vite + React 19 + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL + TypeORM
- UI: Tailwind CSS 4 + Radix/Base UI + Recharts + Sonner
- Authentication: JWT + bcryptjs
- Monorepo: `client/` + `server/` using npm workspaces

## Current Product Scope

- Spanish UI
- Supported currencies: `LPS` and `USD`
- Light mode currently forced
- Main dashboard includes:
  - year-to-date totals
  - monthly income vs expense comparison
  - expenses by category
  - expenses vs available balance
  - credit card usage and alerts
  - recent expenses
- Full management for:
  - authentication
  - income
  - expenses
  - credit cards
  - categories
  - currency settings

## Repository Structure

```text
.
├─ client/                 # React SPA
├─ docs/                   # PDR and supporting docs
├─ server/                 # NestJS REST API
├─ package.json            # monorepo scripts
└─ README.md
```

## Main Modules

### Frontend

- `client/src/pages`
  - `dashboard-page.tsx`
  - `income-page.tsx`
  - `expenses-page.tsx`
  - `cards-page.tsx`
  - `categories-page.tsx`
  - `settings-page.tsx`
  - `auth-page.tsx`
- `client/src/components`
  - app shell and navigation
  - UI primitives
  - chart wrappers
  - loading states

### Backend

- `server/src/auth`
- `server/src/users`
- `server/src/categories`
- `server/src/income`
- `server/src/expenses`
- `server/src/credit-cards`
- `server/src/dashboard`
- `server/src/analytics`
- `server/src/database`

## Requirements

- Node.js 20+ recommended
- npm 10+ recommended
- PostgreSQL available

## Environment Variables

### Backend

File: [server/.env.example](/e:/personal/ia/mi-pisto/server/.env.example)

```env
PORT=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SCHEMA=
JWT_SECRET=
```

Expected local runtime file: `server/.env`

Notes:

- The database itself must already exist.
- Migrations create the required schema and tables.
- The backend loads `.env.local` first and then `.env`.

### Frontend

File: [client/.env.example](/e:/personal/ia/mi-pisto/client/.env.example)

```env
VITE_API_URL=
```

Expected local runtime file: `client/.env`

Typical example:

```env
VITE_API_URL=http://localhost:3000/api
```

## Installation

From the project root:

```bash
npm install
```

## Getting Started

### 1. Create `.env` files

Create:

- `server/.env`
- `client/.env`

Using the `.env.example` files as templates.

### 2. Run database migrations

```bash
npm run db:setup
```

This runs the migrations from the `server` workspace.

### 3. Start the backend

```bash
npm run dev:server
```

Default backend URL:

```text
http://localhost:3000/api
```

### 4. Start the frontend

```bash
npm run dev:client
```

Default frontend URL:

```text
http://localhost:5173
```

## Available Scripts

### Root

```bash
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm run db:setup
```

### Server

```bash
npm run start:dev --workspace server
npm run build --workspace server
npm run migration:run --workspace server
npm run migration:revert --workspace server
npm run migration:generate --workspace server
```

### Client

```bash
npm run dev --workspace client
npm run build --workspace client
npm run preview --workspace client
```

## Database

### Schema

- Configured schema: `DB_SCHEMA`
- The project is designed to run inside a dedicated schema such as `personal` or `core`

### Main Entities

- `User`
- `Category`
- `Income`
- `Expense`
- `CreditCard`

### Migrations

The current initialization flow is based on:

- [20260329000000-initialize-database.ts](/e:/personal/ia/mi-pisto/server/src/database/migrations/20260329000000-initialize-database.ts)

Also:

- `synchronize` is disabled
- `migrationsRun` is enabled
- the project no longer relies on a manual `setup-db.ts` workflow

## Key Business Rules

- Every protected endpoint requires a valid JWT
- Each user can only access their own data
- Registration creates the user with default currency `LPS` and locale `es-HN`
- On registration, the user receives their own initial category set based on the default categories
- Default/global categories are listed together with user-owned categories
- A category cannot be deleted if it has linked expenses
- For credit card expenses:
  - the applied month is calculated from purchase date and cutoff date
  - the estimated payment date is calculated
  - the accounting month may differ from the purchase date
- The top dashboard summary uses year-to-date totals
- Dashboard analytics can be filtered by month and year, including `All`

## REST API

Base URL:

```text
http://localhost:3000/api
```

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Categories

- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

### Income

- `GET /income`
- `POST /income`
- `PUT /income/:id`
- `DELETE /income/:id`

### Expenses

- `GET /expenses`
- `POST /expenses`
- `PUT /expenses/:id`
- `DELETE /expenses/:id`

### Credit Cards

- `GET /credit-cards`
- `GET /credit-cards/active`
- `GET /credit-cards/:id/spending`
- `POST /credit-cards`
- `PUT /credit-cards/:id`
- `PATCH /credit-cards/:id/toggle`
- `DELETE /credit-cards/:id`

### Dashboard and Analytics

- `GET /dashboard`
- `GET /analytics`

### User Settings

- `GET /user/settings`
- `PUT /user/settings`

## Frontend Routes

- `/login`
- `/register`
- `/dashboard`
- `/ingresos`
- `/gastos`
- `/tarjetas`
- `/categorias`
- `/configuracion`

Notes:

- `/` redirects based on authentication state
- `/analitica` currently redirects to `/dashboard`

## UX and Product Notes

- Flat, clean banking-style visual direction
- Collapsible sidebar
- Centered loading state
- Simplified login and registration screens
- Charts use Spanish labels
- Dates are handled as local calendar dates in the UI, not naive UTC-only display values

## Default Categories

The project includes these default categories:

- Alimentación
- Transporte
- Entretenimiento
- Salud
- Educación
- Vivienda
- Servicios
- Compras
- Suscripciones
- Otro

Defined in:

- [default-categories.ts](/e:/personal/ia/mi-pisto/server/src/database/default-categories.ts)

## Build and Validation

Commonly used commands:

```bash
npm run build
npm run build --workspace server
npm run build --workspace client
```

## Related Documentation

- [docs/pdr/mi-pisto-app-pdr.md](/e:/personal/ia/mi-pisto/docs/pdr/mi-pisto-app-pdr.md)

## Maintenance Notes

- If you change entities, generate or write a new migration
- Avoid turning `synchronize: true` back on
- If you change supported currencies, update:
  - frontend constants and formatters
  - backend validation and locale mapping
- If you change credit card cutoff logic, review:
  - [date.utils.ts](/e:/personal/ia/mi-pisto/server/src/common/utils/date.utils.ts)
  - [format.ts](/e:/personal/ia/mi-pisto/client/src/lib/format.ts)
