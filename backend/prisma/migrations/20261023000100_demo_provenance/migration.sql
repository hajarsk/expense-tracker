-- Add demo provenance without deleting or rewriting existing expense records.
CREATE TYPE "ExpenseOrigin" AS ENUM ('DEMO', 'VISITOR', 'PRESERVE');

ALTER TABLE "Expense"
ADD COLUMN "origin" "ExpenseOrigin" NOT NULL DEFAULT 'PRESERVE',
ADD COLUMN "demoKey" TEXT;

CREATE UNIQUE INDEX "Expense_demoKey_key" ON "Expense"("demoKey");
