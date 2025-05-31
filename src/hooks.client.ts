import { NODE_ENV } from "$env/static/private";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { handleErrorWithSentry } from "@sentry/sveltekit";
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,
});

export const handleError = NODE_ENV === "production" ? handleErrorWithSentry() : () => {};
