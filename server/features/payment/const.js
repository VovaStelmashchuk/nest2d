/**
 * Number of free successful nesting runs every user gets before usage is
 * billed. Shared across Bins and Strip nesting.
 */
export const FREE_NESTING_LIMIT = 3

/**
 * Tables holding nesting jobs. A job is billable when it was enqueued with
 * billing_status "pending"; the usage billing job settles it once the worker
 * marks it done.
 */
export const NESTING_JOB_TABLES = ['nesting_jobs', 'strip_nesting_jobs']
