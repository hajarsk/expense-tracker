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
| `DATABASE_URL` | PostgreSQL connection used by the running API | Configure in your ignored local environment file; do not put credentials in the repository. |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma CLI and seed tooling | Configure locally for the same development database; use a separate protected secret in production. |
| `PORT` | NestJS API port | `3001` |
| `FRONTEND_ORIGIN` | Allowed browser origin for CORS | `http://localhost:3000` |

Frontend variable:

| Variable | Purpose | Local value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | URL used by the frontend API client | `http://localhost:3001` |

The local backend connection must match `docker-compose.yml`. Never commit `.env` or `.env.local`; only secret-free examples are tracked.

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

The seed upserts seven fictional examples by internal stable key. It is safe to repeat and never deletes visitor-created or unrelated records. The production seed checks the configured database host, name, and connected role before writing; the shared advisory lock serializes seed writes with API writes and reset.

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
    "merchant": "Sample Market Birch",
    "amount": 86.40,
    "category": "Non-Cooked Meals",
    "date": "2026-08-27T00:00:00.000Z",
    "paymentMethod": "Card",
    "description": "Weekly groceries"
  }'
```

## Validation and business rules

- Merchant is required text and limited to 80 characters.
- Payment method is limited to 40 characters; description is limited to 240 characters.
- Obvious email addresses and Luhn-valid 13–19 digit payment-card-like strings are rejected in text fields. This heuristic is not a privacy guarantee.
- JSON request bodies are limited to 16 KB.
- Amount must be positive, have at most two decimal places, and fit `DECIMAL(10,2)`.
- Category must be one of the three fixed values.
- Expense dates must be valid and cannot be in the future.
- Unknown request properties are rejected by the global NestJS `ValidationPipe`.
- Route IDs must be integers; missing expenses return HTTP 404.
- The frontend limits its date control, while backend DTO validation independently protects direct API calls.
- Public API responses omit internal provenance and stable-key fields.
- Public writes are limited to 15 per IP per minute and all API requests to 120 per IP per minute. Creates stop at 500 demo/visitor records and return HTTP 409 until a row is deleted or reset.

## Portfolio demo operations

The public portfolio demo uses fictional sample expenses only. Recruiters can create, view, edit, and delete records in one shared dataset so they can try the CRUD features. Visitor-created and edited data is temporary and disposable; it may be permanently deleted during a reset. Do not enter real personal or financial information. The interface displays this notice, and the basic text checks are only heuristics; they do not guarantee privacy.

### Hosting target

- Frontend: Vercel Hobby. Expected starting cost: $0 for this personal demo, within current plan quotas.
- NestJS API: Render Free. Expect the service to sleep when idle and take time to wake. In-memory rate-limit counters reset after restarts.
- PostgreSQL: a new, dedicated Neon PostgreSQL 17 database. Free-tier storage, compute, and retention policies can change; do not treat free hosting as a backup or permanence guarantee.

Configure the frontend root as `frontend` and backend root as `backend`, with Node.js 22. Build the frontend using `npm ci && npm run build` and serve it with `npm run start`. Build the API using `npm ci && npx prisma generate && npm run build`, then start it with `npm run start:prod`. Do not place migrations in the Render build/start command; use the protected GitHub workflow. Set these variable names in the provider dashboards; never commit their values:

- Vercel: `NEXT_PUBLIC_API_URL` (public API URL; contains no credentials).
- Render: `DATABASE_URL`, `PORT`, `FRONTEND_ORIGIN`, `NODE_ENV`. Set `NODE_ENV` to `production` so the API requires the trusted Cloudflare client-IP header. `DATABASE_URL` is the runtime PostgreSQL connection.
- GitHub `demo-production` Environment: secrets `DIRECT_URL`, `DEMO_RESET_DATABASE_URL`; variables `DEMO_DATABASE_NAME`, `DEMO_DATABASE_HOST`, `DEMO_MIGRATION_ROLE`, and `DEMO_RESET_ROLE`. `DIRECT_URL` is for migrations and seeding; the reset uses a separate role and secret. Configure required reviewer approval on this GitHub Environment.

The migration role must be a non-superuser role scoped to the demo database, unable to create databases or roles, and able to use/create objects in the demo schema for reviewed migrations. The reset role must be separate, non-superuser, not a member of other roles, not the owner of the schema/table, and unable to create databases, roles, or schema objects. Grant only schema usage, `Expense` table select/insert/update/delete, and sequence usage required for reset. The runtime API role should also be separate from migration and reset credentials where practical.

### Database bootstrap, migration, and reset

1. Create a new, empty production demo database. Do not import the local Docker database. The bootstrap workflow refuses any target containing user relations, custom types, functions, or non-standard schemas and never cleans it.
2. Configure the protected GitHub Environment and its secrets/variables. The database host and name must match the URL and the connected PostgreSQL identity. Use the provider's direct (non-pooler) hostname for migration and reset connections.
3. Manually run `Demo database migration and seed` with `bootstrap` and explicitly confirm the database is empty. It verifies target identity, applies `npx prisma migrate deploy`, then runs the non-deleting seed.
4. For later schema updates, manually select `migrate`; it verifies identity and applies pending migrations without resetting or importing data. If bootstrap migration succeeds but seeding fails, select `seed` to retry the idempotent upserts. A migration failure is not automatically rolled back; stop and review Prisma's migration state, then recover with a reviewed forward migration or provider restore. Never use a reset as migration recovery.
5. To reset the demo, an operator must manually run `Reset demo data`, approve the protected Environment, check the confirmation box, and type the exact configured database name. This is an operator-only action: there is no public reset endpoint, and recruiters cannot trigger a reset from the app. The reset verifies the URL and connected database/role, then in one transaction permanently deletes `VISITOR` rows and upserts the seven canonical samples. It preserves `PRESERVE` rows. A failure rolls back the reset transaction. Visitor-created or visitor-edited data is disposable and is not recoverable by this reset; the canonical fictional samples are restored.

The reset workflow does not expose a public endpoint or secret to the frontend. The script verifies URL protocol, exact hostname, database path, role name, TLS mode, and the live `current_database()`/`current_user` identity. It also rejects a reset role with elevated creation privileges, role memberships, schema/table ownership, or missing required table/sequence permissions. These checks cannot protect against compromised GitHub access/secrets or incorrectly configured expected host/name values; keep the database dedicated and review workflow approvals.

### API abuse controls

The API applies 120 total requests and 15 write requests per client IP per 60 seconds. On Render, it uses `CF-Connecting-IP`, which Cloudflare overwrites on Render's public ingress; it ignores caller-provided `X-Forwarded-For` and disables generic Express proxy trust. Before public release, verify on Render that forged `CF-Connecting-IP` and `X-Forwarded-For` headers are overwritten/ignored and that distinct clients receive separate limits. The in-memory limiter is a basic abuse control, not durable enforcement.

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
# This command writes and deletes records; use only a disposable test database.

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
