/**
 * HEXA transactional email templates (inline-styled HTML for client support).
 * Kept simple, on-brand (violet/dark accents), and clear per Children's Code.
 */

const WRAP = (inner: string) => `
<div style="background:#050614;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0A0B1E;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:#A78BFA;font-weight:700;font-size:18px;letter-spacing:-0.02em;">HEXA</span>
    </div>
    <div style="padding:32px;color:#DDDEE8;font-size:15px;line-height:1.6;">
      ${inner}
    </div>
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);color:#6B6E8C;font-size:12px;">
      HEXA — Teach with confidence. Prove with evidence. Sit when ready.<br/>
      UK GDPR compliant · Children&rsquo;s Code certified
    </div>
  </div>
</div>`;

const BUTTON = (href: string, label: string) => `
<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#6D28D9);color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;font-size:15px;">${label}</a>`;

export function verifyEmailTemplate(opts: {
  name: string | null;
  verifyUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Welcome,";
  return {
    subject: "Confirm your HEXA account",
    html: WRAP(`
      <h1 style="color:#FAFAFC;font-size:22px;margin:0 0 16px;">${greeting}</h1>
      <p style="margin:0 0 16px;">Thanks for joining HEXA. Please confirm your email to start your child&rsquo;s diagnostic and daily lessons.</p>
      <p style="margin:0 0 24px;">${BUTTON(opts.verifyUrl, "Confirm my email")}</p>
      <p style="margin:0;color:#8A8DAB;font-size:13px;">This link expires in 48 hours. If you didn&rsquo;t create a HEXA account, you can ignore this email.</p>
    `),
  };
}

export function verifyCodeTemplate(opts: {
  name: string | null;
  code: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Welcome,";
  const spaced = opts.code.split("").join("&nbsp;");
  return {
    subject: `${opts.code} is your HEXA verification code`,
    html: WRAP(`
      <h1 style="color:#FAFAFC;font-size:22px;margin:0 0 16px;">${greeting}</h1>
      <p style="margin:0 0 20px;">Thanks for joining HEXA. Enter this code to confirm your email and start your child&rsquo;s diagnostic:</p>
      <div style="text-align:center;margin:0 0 24px;">
        <div style="display:inline-block;background:rgba(139,92,246,0.12);border:1px solid rgba(167,139,250,0.35);border-radius:12px;padding:16px 28px;font-size:32px;font-weight:700;letter-spacing:8px;color:#FAFAFC;font-family:ui-monospace,Menlo,Consolas,monospace;">${spaced}</div>
      </div>
      <p style="margin:0;color:#8A8DAB;font-size:13px;">This code expires in 15 minutes. If you didn&rsquo;t create a HEXA account, you can ignore this email.</p>
    `),
  };
}

export function portfolioShareTemplate(opts: {
  childName: string;
  term: string;
  verificationHash: string;
  fromParent: string | null;
}): { subject: string; html: string } {
  const from = opts.fromParent ? ` from ${opts.fromParent}` : "";
  return {
    subject: `HEXA education portfolio — ${opts.childName}, ${opts.term}`,
    html: WRAP(`
      <h1 style="color:#FAFAFC;font-size:22px;margin:0 0 16px;">Education portfolio${from}</h1>
      <p style="margin:0 0 12px;">A verified Local Authority education portfolio has been shared with you for:</p>
      <p style="margin:0 0 16px;color:#FAFAFC;font-weight:600;">${opts.childName} — ${opts.term}</p>
      <p style="margin:0 0 8px;color:#8A8DAB;font-size:13px;">Statutory format: Intent · Implementation · Impact · Next Steps.</p>
      <p style="margin:0 0 4px;color:#8A8DAB;font-size:13px;">Tamper-evident SHA-256 verification hash:</p>
      <code style="display:block;word-break:break-all;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;color:#B8BAD0;font-size:12px;margin:0 0 16px;">${opts.verificationHash}</code>
      <p style="margin:0;color:#8A8DAB;font-size:13px;">Any change to the portfolio changes this hash, so its integrity can be independently verified.</p>
    `),
  };
}
