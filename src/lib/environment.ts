/**
 * Deployment environment, driven by the `ENVIRONMENT` variable set on the Vercel project:
 * `DEV` on preview deployments, `PRODUCTION` on production.
 *
 * Server-only — the variable is not `NEXT_PUBLIC_`, so it is `undefined` in client bundles.
 * Read it from server components, route handlers, and data modules that only they import.
 */
export const isDevEnvironment: boolean = process.env.ENVIRONMENT?.trim().toUpperCase() === "DEV";
