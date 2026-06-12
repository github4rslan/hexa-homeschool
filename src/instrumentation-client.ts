import * as Sentry from "@sentry/nextjs";
import { sentryDsn, scrubAndTag } from "@/lib/monitoring/sentry-shared";

const dsn = sentryDsn();

// No session replay, ever — children's platform. Errors only.
if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubAndTag(event),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
