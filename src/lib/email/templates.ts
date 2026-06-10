/**
 * HEXA transactional email templates.
 *
 * Inline-styled HTML (email clients ignore <style>/external CSS), built to match
 * the warm heritage brand: deep forest green, warm amber, soft linen, editorial
 * serif headings with a Georgia fallback. Table-based layout for Outlook/Gmail.
 */

const COLORS = {
  forest: "#234231",
  forestDeep: "#12251B",
  clay: "#C57F2A",
  clayDeep: "#834E1C",
  linen: "#FCFAF5",
  linenAlt: "#F1EADB",
  ink: "#343027",
  inkSoft: "#6B6451",
  line: "rgba(35,66,49,0.12)",
};

const SERIF =
  "Fraunces, 'Times New Roman', Georgia, 'Iowan Old Style', serif";
const SANS =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Outer shell: linen page, framed card, forest header, editorial footer. */
function WRAP(inner: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${COLORS.linenAlt};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.linenAlt};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:${COLORS.linen};border:1px solid ${COLORS.line};border-radius:18px;overflow:hidden;box-shadow:0 12px 40px -20px rgba(35,66,49,0.35);">

        <!-- Header band -->
        <tr><td style="background:${COLORS.forestDeep};padding:26px 36px;">
          <span style="font-family:${SERIF};color:${COLORS.linen};font-size:24px;font-weight:600;letter-spacing:-0.01em;">HEXA</span>
          <span style="display:block;margin-top:2px;font-family:${SANS};color:#9DBCA8;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">Home Education Expert Assistant</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px;font-family:${SANS};color:${COLORS.ink};font-size:15px;line-height:1.65;">
          ${inner}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${COLORS.linen};border-top:1px solid ${COLORS.line};padding:22px 36px;">
          <p style="margin:0;font-family:${SERIF};font-style:italic;color:${COLORS.forest};font-size:14px;">Teach with confidence. Prove with evidence. Sit when ready.</p>
          <p style="margin:10px 0 0;font-family:${SANS};color:${COLORS.inkSoft};font-size:11px;line-height:1.5;">
            HEXA Education Ltd · UK GDPR compliant · Children&rsquo;s Code certified · AWS London
          </p>
        </td></tr>

      </table>
      <p style="font-family:${SANS};color:${COLORS.inkSoft};font-size:11px;margin:18px 0 0;">You&rsquo;re receiving this because an account was created with this email.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 14px;font-family:${SERIF};color:${COLORS.forestDeep};font-size:24px;font-weight:600;line-height:1.2;">${text}</h1>`;
}

function amberButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${COLORS.clay};color:${COLORS.linen};text-decoration:none;font-family:${SANS};font-weight:600;padding:13px 30px;border-radius:10px;font-size:15px;">${label}</a>`;
}

export function verifyCodeTemplate(opts: {
  name: string | null;
  code: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Welcome,";
  const cells = opts.code
    .split("")
    .map(
      (d) =>
        `<td style="padding:0 5px;"><div style="width:46px;height:58px;line-height:58px;background:${COLORS.linenAlt};border:1px solid rgba(197,127,42,0.35);border-radius:10px;font-family:${SANS};font-size:30px;font-weight:700;color:${COLORS.forestDeep};text-align:center;">${d}</div></td>`,
    )
    .join("");

  return {
    subject: `${opts.code} is your HEXA verification code`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Thanks for joining HEXA. Enter this code to confirm your email and begin your child&rsquo;s diagnostic.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 8px;"><tr>${cells}</tr></table>

      <p style="margin:18px 0 0;color:${COLORS.inkSoft};font-size:13px;text-align:center;">This code expires in 15 minutes.</p>
      <div style="margin:24px 0 0;padding:14px 16px;background:${COLORS.linenAlt};border-radius:10px;">
        <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;line-height:1.5;">
          📩 Can&rsquo;t see this in your inbox next time? Check <strong style="color:${COLORS.ink};">Spam</strong> or <strong style="color:${COLORS.ink};">Promotions</strong> and mark it &ldquo;Not spam&rdquo; so future codes arrive safely.
        </p>
      </div>
      <p style="margin:20px 0 0;color:${COLORS.inkSoft};font-size:12.5px;">If you didn&rsquo;t create a HEXA account, you can safely ignore this email.</p>
    `),
  };
}

export function verifyEmailTemplate(opts: {
  name: string | null;
  verifyUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Welcome,";
  return {
    subject: "Confirm your HEXA account",
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Thanks for joining HEXA. Please confirm your email to start your child&rsquo;s diagnostic and daily lessons.</p>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.verifyUrl, "Confirm my email")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">This link expires in 48 hours. If you didn&rsquo;t create a HEXA account, you can ignore this email.</p>
    `),
  };
}

/** Kept structurally identical to repo.ts → ChildWeekSummary (no server-only import here). */
export interface DigestChild {
  childName: string;
  lessonsCompleted: number;
  topicsCertified: string[];
  escalations: number;
}

export function weeklyDigestTemplate(opts: {
  parentName: string | null;
  /** e.g. "2 – 8 June" */
  weekLabel: string;
  children: DigestChild[];
  dashboardUrl: string;
  settingsUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.parentName
    ? `Hi ${opts.parentName.split(" ")[0]},`
    : "Hello,";

  const sections = opts.children
    .map((child) => {
      const topics =
        child.topicsCertified.length > 0
          ? child.topicsCertified
              .map(
                (t) =>
                  `<li style="margin:0 0 4px;color:${COLORS.ink};font-size:14px;">${t}</li>`,
              )
              .join("")
          : "";

      const quietWeek =
        child.lessonsCompleted === 0 && child.topicsCertified.length === 0;

      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:${COLORS.linenAlt};border:1px solid ${COLORS.line};border-radius:12px;">
        <tr><td style="padding:18px 20px;">
          <p style="margin:0 0 10px;font-family:${SERIF};color:${COLORS.forestDeep};font-size:18px;font-weight:600;">${child.childName}</p>
          <p style="margin:0 0 6px;font-size:14px;color:${COLORS.ink};">
            <strong style="color:${COLORS.forest};">${child.lessonsCompleted}</strong> lesson${child.lessonsCompleted === 1 ? "" : "s"} completed
            &nbsp;·&nbsp;
            <strong style="color:${COLORS.forest};">${child.topicsCertified.length}</strong> topic${child.topicsCertified.length === 1 ? "" : "s"} certified
          </p>
          ${topics ? `<ul style="margin:8px 0 0;padding-left:18px;">${topics}</ul>` : ""}
          ${
            quietWeek
              ? `<p style="margin:8px 0 0;color:${COLORS.inkSoft};font-size:13px;">A quiet week — a gentle nudge can help get back into the rhythm.</p>`
              : ""
          }
          ${
            child.escalations > 0
              ? `<p style="margin:12px 0 0;padding:10px 12px;background:rgba(197,127,42,0.12);border:1px solid rgba(197,127,42,0.35);border-radius:8px;color:${COLORS.clayDeep};font-size:13px;line-height:1.5;"><strong>${child.escalations} wellbeing alert${child.escalations === 1 ? "" : "s"}</strong> raised this week. Please review the details in your dashboard.</p>`
              : ""
          }
        </td></tr>
      </table>`;
    })
    .join("");

  return {
    subject: `Your HEXA week — ${opts.weekLabel}`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Here&rsquo;s how learning went at home this week (${opts.weekLabel}).</p>
      ${sections}
      <p style="margin:6px 0 24px;text-align:center;">${amberButton(opts.dashboardUrl, "Open my dashboard")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get this weekly summary? You can turn it off in <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Settings &rarr; Email preferences</a>.</p>
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
      ${heading(`Education portfolio${from}`)}
      <p style="margin:0 0 12px;">A verified Local Authority education portfolio has been shared with you for:</p>
      <p style="margin:0 0 18px;font-family:${SERIF};color:${COLORS.forestDeep};font-weight:600;font-size:18px;">${opts.childName} — ${opts.term}</p>
      <p style="margin:0 0 8px;color:${COLORS.inkSoft};font-size:13px;">Statutory format: Intent · Implementation · Impact · Next Steps.</p>
      <p style="margin:0 0 6px;color:${COLORS.inkSoft};font-size:13px;">Tamper-evident SHA-256 verification hash:</p>
      <code style="display:block;word-break:break-all;background:${COLORS.linenAlt};border:1px solid ${COLORS.line};border-radius:8px;padding:10px;color:${COLORS.ink};font-size:12px;margin:0 0 16px;">${opts.verificationHash}</code>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:13px;">Any change to the portfolio changes this hash, so its integrity can be independently verified.</p>
    `),
  };
}
