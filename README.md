# Expense Tracker

A full-stack expense dashboard for recording daily spending and turning it into clear, filterable summaries. This portfolio project demonstrates REST API design, relational persistence, validation, precise currency handling, and practical analytics in a responsive interface.

## Problem being solved

Expense records are only useful when they are consistent and easy to review. This application keeps spending data in one place, prevents invalid dates and categories, and answers three common questions: how much was spent, where it was spent, and how spending changes over time.

## Features

- Create, view, edit, and delete expenses
- Filter by category and inclusive date range
- Sort by date or amount
- Validated categories: Cooked Meals, Non-Cooked Meals, and Non-Food
- Total spending, expense count, and average expense
- Category totals and percentages
- Monthly totals and expense counts
- Responsive category and monthly charts
- Loading, error, empty, and success states
- Frontend and backend protection against future dates

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | NestJS 11, TypeScript, class-validator |
| Data access | Prisma ORM 7 with PostgreSQL adapter |
| Database | PostgreSQL 17 in Docker |
| Testing | Jest, Supertest, ESLint, TypeScript builds |

## Architecture and data flow

```text
Browser
  ↓ HTTP/JSON
Next.js UI and API client
  ↓ REST request
NestJS controller
  ↓ validated DTO
ExpensesService
  ↓ Prisma Client
PostgreSQL
```

Controllers remain thin: they receive HTTP input and pass it to `ExpensesService`. The service owns database queries, filtering, sorting, not-found handling, and analytics. Prisma maps these TypeScript operations to SQL executed by PostgreSQL.

Currency is stored as PostgreSQL `DECIMAL(10,2)` and aggregated with Prisma's `Decimal` type. API responses expose decimal values as strings so the frontend does not introduce binary floating-point errors into stored or aggregated values. Date filters use an inclusive start and exclusive end boundary, avoiding lost records at the end of a selected day.

## Repository structure

```text
expense-tracker/
├── backend/           # NestJS API, Prisma schema, migrations, and seed
├── frontend/          # Next.js application
├── docker-compose.yml # Local PostgreSQL service
└── README.md
```

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop or another Docker-compatible runtime

### 1. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend variables:

| Variable | Purpose | Local value |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma | `postgresql://expense_user:expense_password@localhost:5432/expense_tracker?schema=public` |
| `PORT` | NestJS API port | `3001` |
| `FRONTEND_ORIGIN` | Allowed browser origin for CORS | `http://localhost:3000` |

Frontend variable:

| Variable | Purpose | Local value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | URL used by the frontend API client | `http://localhost:3001` |

The backend connection values must match `docker-compose.yml`. Never commit `.env` or `.env.local`; only secret-free examples are tracked.

### 2. Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

The named volume `postgres_data` preserves records when the container stops. Use `docker compose stop` to stop PostgreSQL without removing its data.

### 4. Generate Prisma Client and apply migrations

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

During schema development, create a reviewed migration with:

```bash
npx prisma migrate dev --name describe_your_change
```

### 5. Seed optional demo data

```bash
npm run db:seed
```

The seed adds seven Malaysian examples across every category and four months. It is safe to repeat: it replaces only records whose description begins with `[Demo data]` and leaves personal records untouched.

### 6. Run the application

Backend terminal:

```bash
cd backend
npm run start:dev
```

Frontend terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. The API is available at `http://localhost:3001`.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/expenses` | Create an expense |
| `GET` | `/expenses` | List, filter, and sort expenses |
| `GET` | `/expenses/summary` | Return analytics for current filters |
| `GET` | `/expenses/:id` | Retrieve one expense |
| `PATCH` | `/expenses/:id` | Partially update an expense |
| `DELETE` | `/expenses/:id` | Delete an expense |

List and summary queries accept `category`, `startDate`, `endDateExclusive`, `sort`, and `timezoneOffset`. Sort values are `newest`, `oldest`, `highest`, and `lowest`.

Example create request:

```bash
curl -X POST http://localhost:3001/expenses \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "Village Grocer",
    "amount": 86.40,
    "category": "Non-Cooked Meals",
    "date": "2026-08-27T00:00:00.000Z",
    "paymentMethod": "Card",
    "description": "Weekly groceries"
  }'
```

## Validation and business rules

- Merchant is required text.
- Amount must be positive, have at most two decimal places, and fit `DECIMAL(10,2)`.
- Category must be one of the three fixed values.
- Expense dates must be valid and cannot be in the future.
- Unknown request properties are rejected by the global NestJS `ValidationPipe`.
- Route IDs must be integers; missing expenses return HTTP 404.
- The frontend limits its date control, while backend DTO validation independently protects direct API calls.

## Analytics

The summary endpoint loads the filtered expense set once. `ExpensesService` uses Prisma `Decimal` arithmetic for total and average spending, category totals and percentages, and monthly groups. The charts consume this response directly and only scale supplied values for visual width or height.

## Quality checks

```bash
cd backend
npm run lint
npm run build
npm test
npm run test:e2e
# With the API running on port 3001:
npm run test:api

cd ../frontend
npm run lint
npm run build
```

## Screenshots

Add portfolio screenshots here before publishing:

- Desktop dashboard with demo data
- Mobile expense list and form
- Filtered analytics view
- Empty state

## Future improvements

- User accounts and per-user data ownership
- Pagination for larger datasets
- Budget targets and alerts
- Recurring expenses
- Receipt upload and extraction
- Expanded automated browser coverage
- Production deployment and observability
