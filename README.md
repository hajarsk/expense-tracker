# Expense Tracker

A portfolio expense tracker built with Next.js, NestJS, Prisma, and PostgreSQL.

## Project structure

```text
expense-tracker/
├── frontend/          # Next.js and Tailwind CSS
├── backend/           # NestJS and Prisma
├── docker-compose.yml # Local PostgreSQL
└── README.md
```

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and set values that match
   `docker-compose.yml`.
2. Optionally copy `frontend/.env.example` to `frontend/.env.local`.
3. Start PostgreSQL from the repository root:

   ```bash
   docker compose up -d
   ```

4. Install dependencies and apply database migrations:

   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   npm run start:dev
   ```

5. In another terminal, start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend runs on `http://localhost:3000` and the API runs on
`http://localhost:3001` by default.
