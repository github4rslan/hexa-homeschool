/**
 * On-brand HTML for the login-less `/unsubscribe` confirmation page. Pure (no
 * server deps) so it renders identically in the route handler and in previews.
 */
export function unsubscribePageHtml(opts: {
  title: string;
  message: string;
  ok: boolean;
}): string {
  const accent = opts.ok ? "#234231" : "#834E1C";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${opts.title} · Edway</title></head>
<body style="margin:0;background:#F1EADB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:8vh auto;padding:0 16px;">
    <div style="background:#FCFAF5;border:1px solid rgba(35,66,49,0.12);border-radius:18px;overflow:hidden;box-shadow:0 12px 40px -20px rgba(35,66,49,0.35);">
      <div style="background:#12251B;padding:24px 32px;">
        <span style="font-family:Georgia,serif;color:#FCFAF5;font-size:22px;font-weight:600;">Edway</span>
      </div>
      <div style="padding:32px;color:#343027;line-height:1.6;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;color:${accent};font-size:22px;">${opts.title}</h1>
        <p style="margin:0 0 20px;font-size:15px;">${opts.message}</p>
        <a href="https://edway.uk/settings" style="display:inline-block;background:#C57F2A;color:#FCFAF5;text-decoration:none;font-weight:600;padding:11px 24px;border-radius:10px;font-size:14px;">Manage all email preferences</a>
      </div>
      <div style="background:#FCFAF5;border-top:1px solid rgba(35,66,49,0.12);padding:18px 32px;">
        <p style="margin:0;color:#6B6451;font-size:11px;">Account and safety emails will still reach you — only marketing emails are affected.</p>
      </div>
    </div>
  </div>
</body></html>`;
}

export const UNSUBSCRIBE_DONE = {
  title: "You're unsubscribed",
  message:
    "You won't receive re-engagement or marketing emails from Edway anymore. Changed your mind? You can turn them back on any time from your settings.",
  ok: true,
} as const;

export const UNSUBSCRIBE_EXPIRED = {
  title: "This link has expired",
  message:
    "We couldn't process this unsubscribe link — it may be invalid or too old. You can still manage every email preference from your account settings.",
  ok: false,
} as const;
