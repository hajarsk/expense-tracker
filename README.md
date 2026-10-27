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
