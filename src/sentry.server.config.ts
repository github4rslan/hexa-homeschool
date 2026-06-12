import * as Sentry from "@sentry/nextjs";
import { sentryDsn, scrubAndTag } from "@/lib/monitoring/sentry-shared";

const dsn = sentryDsn();

// Unset DSN = no init at all (graceful-degradation pattern, like the other
// integrations). Errors only — tracing off to keep noise and cost at zero.
if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubAndTag(event),
  });
}
