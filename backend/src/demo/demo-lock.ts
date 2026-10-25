import type { Prisma } from '../../generated/prisma/client';

/** Shared transaction-scoped lock for public demo writes, seed, and reset. */
export const DEMO_ADVISORY_LOCK_ID = 74_382_026_102_301n;

export async function acquireDemoAdvisoryLock(
  transaction: Prisma.TransactionClient,
): Promise<void> {
  await transaction.$queryRaw`
    SELECT pg_advisory_xact_lock(${DEMO_ADVISORY_LOCK_ID}) IS NULL AS "locked"
  `;
}
