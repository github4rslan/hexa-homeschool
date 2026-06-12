import * as Sentry from "@sentry/nextjs";
import { sentryDsn, scrubAndTag } from "@/lib/monitoring/sentry-shared";

const dsn = sentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubAndTag(event),
  });
}
