/**
 * Edway transactional email templates.
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

/** Outer shell: linen page, framed card, forest header, editorial footer.
 * `unsubscribeUrl` (marketing email only) adds a one-click unsubscribe line to
 * the outer footer, alongside the existing account-context note. */
function WRAP(inner: string, opts?: { unsubscribeUrl?: string }): string {
  const unsub = opts?.unsubscribeUrl
    ? `<p style="font-family:${SANS};color:${COLORS.inkSoft};font-size:11px;margin:6px 0 0;">Not helpful? <a href="${opts.unsubscribeUrl}" style="color:${COLORS.clayDeep};">Unsubscribe from these emails</a> in one click.</p>`
    : "";
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
          <span style="font-family:${SERIF};color:${COLORS.linen};font-size:24px;font-weight:600;letter-spacing:-0.01em;">Edway</span>
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
            Edway Education Ltd · UK GDPR compliant · Children&rsquo;s Code certified · AWS London
          </p>
        </td></tr>

      </table>
      <p style="font-family:${SANS};color:${COLORS.inkSoft};font-size:11px;margin:18px 0 0;">You&rsquo;re receiving this because an account was created with this email.</p>
      ${unsub}
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
    subject: `${opts.code} is your Edway verification code`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Thanks for joining Edway. Enter this code to confirm your email and begin your child&rsquo;s diagnostic.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 8px;"><tr>${cells}</tr></table>

      <p style="margin:18px 0 0;color:${COLORS.inkSoft};font-size:13px;text-align:center;">This code expires in 15 minutes.</p>
      <div style="margin:24px 0 0;padding:14px 16px;background:${COLORS.linenAlt};border-radius:10px;">
        <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;line-height:1.5;">
          📩 Can&rsquo;t see this in your inbox next time? Check <strong style="color:${COLORS.ink};">Spam</strong> or <strong style="color:${COLORS.ink};">Promotions</strong> and mark it &ldquo;Not spam&rdquo; so future codes arrive safely.
        </p>
      </div>
      <p style="margin:20px 0 0;color:${COLORS.inkSoft};font-size:12.5px;">If you didn&rsquo;t create a Edway account, you can safely ignore this email.</p>
    `),
  };
}

export function twoFactorCodeTemplate(opts: {
  name: string | null;
  code: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Hello,";
  const cells = opts.code
    .split("")
    .map(
      (d) =>
        `<td style="padding:0 5px;"><div style="width:46px;height:58px;line-height:58px;background:${COLORS.linenAlt};border:1px solid rgba(197,127,42,0.35);border-radius:10px;font-family:${SANS};font-size:30px;font-weight:700;color:${COLORS.forestDeep};text-align:center;">${d}</div></td>`,
    )
    .join("");

  return {
    subject: `${opts.code} is your Edway sign-in code`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Here&rsquo;s your two-factor sign-in code. Enter it to finish signing in to Edway.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 8px;"><tr>${cells}</tr></table>

      <p style="margin:18px 0 0;color:${COLORS.inkSoft};font-size:13px;text-align:center;">This code expires in 10 minutes and works once.</p>
      <p style="margin:20px 0 0;color:${COLORS.inkSoft};font-size:12.5px;">If you didn&rsquo;t just try to sign in, someone may know your password &mdash; change it from Settings as soon as you can.</p>
    `),
  };
}

export function verifyEmailTemplate(opts: {
  name: string | null;
  verifyUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Welcome,";
  return {
    subject: "Confirm your Edway account",
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Thanks for joining Edway. Please confirm your email to start your child&rsquo;s diagnostic and daily lessons.</p>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.verifyUrl, "Confirm my email")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">This link expires in 48 hours. If you didn&rsquo;t create a Edway account, you can ignore this email.</p>
    `),
  };
}

export function passwordResetTemplate(opts: {
  name: string | null;
  resetUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Hello,";
  return {
    subject: "Reset your Edway password",
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">We received a request to reset the password for your Edway account. Click below to choose a new one — for your security this link expires in 1 hour and can be used once.</p>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.resetUrl, "Reset my password")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">If you didn&rsquo;t ask to reset your password, you can safely ignore this email — your password won&rsquo;t change until you use the link above.</p>
    `),
  };
}

// ── Lifecycle (onboarding) emails ────────────────────────

export function welcomeTemplate(opts: {
  name: string | null;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Welcome, ${opts.name.split(" ")[0]}.` : "Welcome to Edway.";
  return {
    subject: "Welcome to Edway — here's how to begin",
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 18px;">Your account is ready. Edway helps you teach with confidence, prove progress with evidence, and let your child sit exams only when they&rsquo;re truly ready.</p>
      <p style="margin:0 0 10px;font-weight:600;color:${COLORS.forestDeep};">Your first three steps:</p>
      <ol style="margin:0 0 22px;padding-left:20px;color:${COLORS.ink};">
        <li style="margin-bottom:6px;">Add your child&rsquo;s profile.</li>
        <li style="margin-bottom:6px;">Run the free diagnostic — about 10 minutes to find their real starting point.</li>
        <li>Review the first weekly plan and approve it. Nothing is forced.</li>
      </ol>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.dashboardUrl, "Go to my dashboard")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">We&rsquo;re here if you need anything — just reply to this email.</p>
    `),
  };
}

export function diagnosticNudgeTemplate(opts: {
  name: string | null;
  childName: string;
  diagnosticUrl: string;
  settingsUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name.split(" ")[0]},` : "Hi there,";
  return {
    subject: `10 minutes to ${opts.childName}'s starting point`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 18px;">You&rsquo;ve added ${opts.childName} to Edway — the next step is the diagnostic. It takes about 10 minutes and finds exactly where ${opts.childName} is in Maths, English and Science, so every lesson after starts at the right level.</p>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.diagnosticUrl, "Start the diagnostic")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get onboarding emails? <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Turn them off in Settings</a>. Account and safety emails will still reach you.</p>
    `),
  };
}

export function firstPlanTemplate(opts: {
  name: string | null;
  childName: string;
  learnUrl: string;
  settingsUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Nice work, ${opts.name.split(" ")[0]}.` : "Nice work.";
  return {
    subject: `${opts.childName}'s first week is approved 🎉`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 18px;">You&rsquo;ve approved ${opts.childName}&rsquo;s first weekly plan. Here&rsquo;s what happens next:</p>
      <ul style="margin:0 0 22px;padding-left:20px;color:${COLORS.ink};">
        <li style="margin-bottom:6px;">${opts.childName} works through daily lessons in child mode — calm, paced, encouraging.</li>
        <li style="margin-bottom:6px;">Edway tracks every step and certifies each topic once it&rsquo;s securely learned.</li>
        <li>You&rsquo;ll get a weekly digest, and a Local Authority-ready portfolio builds itself as you go.</li>
      </ul>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.learnUrl, "Open child mode")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get onboarding emails? <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Turn them off in Settings</a>.</p>
    `),
  };
}

/**
 * Digest row for one child. The counts stay for the header line; the qualitative
 * observation/focus/standing strings are pre-built by
 * `lib/engine/weekly-summary.ts` in the digest route (actionable observations,
 * not progress bars — Wave 7, Phase 5). No server-only import here.
 */
export interface DigestChild {
  childName: string;
  lessonsCompleted: number;
  topicsCertified: string[];
  escalations: number;
  /** One-line qualitative read of the week. */
  observation: string;
  /** Actionable "recommended focus" line, or null. */
  focusLine: string | null;
  /** Per-concept "strong / growing / starting" read, or null. */
  standingLine: string | null;
}

export function weeklyDigestTemplate(opts: {
  parentName: string | null;
  /** e.g. "2 – 8 June" */
  weekLabel: string;
  children: DigestChild[];
  dashboardUrl: string;
  /** Deep-link to the paused-lessons detail + messaging thread. */
  escalationsUrl: string;
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
          <p style="margin:0 0 10px;font-size:14.5px;color:${COLORS.ink};line-height:1.55;">${child.observation}</p>
          <p style="margin:0 0 6px;font-size:13px;color:${COLORS.inkSoft};">
            <strong style="color:${COLORS.forest};">${child.lessonsCompleted}</strong> lesson${child.lessonsCompleted === 1 ? "" : "s"} completed
            &nbsp;·&nbsp;
            <strong style="color:${COLORS.forest};">${child.topicsCertified.length}</strong> topic${child.topicsCertified.length === 1 ? "" : "s"} certified
          </p>
          ${topics ? `<ul style="margin:8px 0 0;padding-left:18px;">${topics}</ul>` : ""}
          ${
            child.standingLine
              ? `<p style="margin:10px 0 0;color:${COLORS.inkSoft};font-size:13px;">${child.standingLine}</p>`
              : ""
          }
          ${
            child.focusLine
              ? `<p style="margin:12px 0 0;padding:10px 12px;background:rgba(35,66,49,0.06);border-left:3px solid ${COLORS.forest};border-radius:8px;color:${COLORS.forest};font-size:13.5px;line-height:1.5;">${child.focusLine}</p>`
              : ""
          }
          ${
            quietWeek
              ? `<p style="margin:8px 0 0;color:${COLORS.inkSoft};font-size:13px;">A quiet week — a gentle nudge can help get back into the rhythm.</p>`
              : ""
          }
          ${
            child.escalations > 0
              ? `<p style="margin:12px 0 0;padding:10px 12px;background:rgba(197,127,42,0.12);border:1px solid rgba(197,127,42,0.35);border-radius:8px;color:${COLORS.clayDeep};font-size:13px;line-height:1.5;"><strong>${child.escalations} wellbeing alert${child.escalations === 1 ? "" : "s"}</strong> raised this week. <a href="${opts.escalationsUrl}" style="color:${COLORS.clayDeep};font-weight:600;">Review the details and message the team</a>.</p>`
              : ""
          }
        </td></tr>
      </table>`;
    })
    .join("");

  return {
    subject: `Your Edway week — ${opts.weekLabel}`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">Here&rsquo;s how learning went at home this week (${opts.weekLabel}).</p>
      ${sections}
      <p style="margin:0 0 4px;text-align:center;color:${COLORS.inkSoft};font-size:13px;">Short on time? Play the one-minute audio recap on your dashboard.</p>
      <p style="margin:6px 0 24px;text-align:center;">${amberButton(opts.dashboardUrl, "Open my dashboard")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get this weekly summary? You can turn it off in <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Settings &rarr; Email preferences</a>.</p>
    `),
  };
}

const PLAN_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLAN_SUBJECTS: Record<string, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

/** Kept structurally compatible with repo.ts → ScheduleItemDoc. */
export interface PlanEmailItem {
  day: number; // 0 (Mon) … 6 (Sun)
  subject: string;
  topic_title: string;
  reason?: string;
}

export function weeklyPlanTemplate(opts: {
  parentName: string | null;
  childFirstName: string;
  weekStart: string; // ISO date (Monday)
  items: PlanEmailItem[];
  scheduleUrl: string;
  settingsUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.parentName
    ? `Hi ${opts.parentName.split(" ")[0]},`
    : "Hello,";

  const rows = opts.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 14px;border-top:1px solid ${COLORS.line};vertical-align:top;white-space:nowrap;font-size:13px;color:${COLORS.inkSoft};">${PLAN_DAYS[item.day] ?? ""}</td>
        <td style="padding:12px 14px;border-top:1px solid ${COLORS.line};vertical-align:top;white-space:nowrap;font-size:13px;color:${COLORS.forest};font-weight:600;">${PLAN_SUBJECTS[item.subject] ?? item.subject}</td>
        <td style="padding:12px 14px;border-top:1px solid ${COLORS.line};vertical-align:top;">
          <span style="font-size:14px;color:${COLORS.ink};font-weight:600;">${item.topic_title}</span>
          ${item.reason ? `<span style="display:block;margin-top:4px;font-size:12.5px;line-height:1.5;color:${COLORS.inkSoft};">${item.reason}</span>` : ""}
        </td>
      </tr>`,
    )
    .join("");

  return {
    subject: `This week's plan for ${opts.childFirstName}`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 22px;">The Planning Agent has proposed ${opts.childFirstName}&rsquo;s week (starting ${opts.weekStart}). Each topic comes with the reason it was picked — review and approve when you&rsquo;re ready. Nothing is forced.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:${COLORS.linenAlt};border:1px solid ${COLORS.line};border-radius:12px;border-collapse:separate;overflow:hidden;">
        <tr>
          <td style="padding:10px 14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.inkSoft};">Day</td>
          <td style="padding:10px 14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.inkSoft};">Subject</td>
          <td style="padding:10px 14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.inkSoft};">Topic &amp; why</td>
        </tr>
        ${rows}
      </table>

      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.scheduleUrl, "Review & approve the week")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get the plan by email? Turn it off in <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Settings &rarr; Email preferences</a>.</p>
    `),
  };
}

/**
 * Daily progress summary — the warm parent email sent once per child per day
 * when today's quests are all complete. Content is pre-built deterministically
 * by `lib/engine/daily-summary.ts` (no AI, no inflation); this only lays it out.
 */
export interface DailySummaryEmailContent {
  subject: string;
  headline: string;
  todayLine: string;
  topicLines: { title: string; outcome: "Mastered" | "Needs another look" }[];
  progressLines: { text: string }[];
  streakLine: string | null;
  stageLine: string | null;
  effortNote: string;
}

export function dailySummaryTemplate(opts: {
  parentName: string | null;
  content: DailySummaryEmailContent;
  childDetailUrl: string;
  settingsUrl: string;
}): { subject: string; html: string; text: string } {
  const { content: c } = opts;
  const greeting = opts.parentName
    ? `Hi ${opts.parentName.split(" ")[0]},`
    : "Hello,";

  const topicRows = c.topicLines
    .map((t) => {
      const mastered = t.outcome === "Mastered";
      const badge = mastered
        ? `<span style="display:inline-block;background:rgba(35,66,49,0.10);color:${COLORS.forest};font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap;">✓ Mastered</span>`
        : `<span style="display:inline-block;background:rgba(197,127,42,0.12);color:${COLORS.clayDeep};font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap;">Needs another look</span>`;
      return `
      <tr>
        <td style="padding:10px 0;border-top:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};">${t.title}</td>
        <td style="padding:10px 0;border-top:1px solid ${COLORS.line};text-align:right;">${badge}</td>
      </tr>`;
    })
    .join("");

  const progressItems = c.progressLines
    .map(
      (p) =>
        `<li style="margin:0 0 4px;color:${COLORS.ink};font-size:14px;">${p.text}</li>`,
    )
    .join("");

  const subText = [c.stageLine, c.streakLine].filter(Boolean).join(" ");

  const html = WRAP(`
      ${heading(c.headline)}
      <p style="margin:0 0 22px;">${greeting} ${c.todayLine}</p>

      <!-- Today -->
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.inkSoft};">Today</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:${COLORS.linenAlt};border:1px solid ${COLORS.line};border-radius:12px;">
        <tr><td style="padding:6px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${topicRows}</table>
        </td></tr>
      </table>

      ${
        progressItems
          ? `
      <!-- Progress -->
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.inkSoft};">Progress so far</p>
      <ul style="margin:0 0 ${subText ? "8" : "24"}px;padding-left:18px;">${progressItems}</ul>
      ${subText ? `<p style="margin:0 0 24px;color:${COLORS.inkSoft};font-size:13px;">${subText}</p>` : ""}`
          : ""
      }

      <!-- A warm note -->
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.inkSoft};">A warm note</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;background:rgba(35,66,49,0.05);border-left:3px solid ${COLORS.forest};border-radius:8px;">
        <tr><td style="padding:14px 18px;font-family:${SERIF};font-style:italic;color:${COLORS.forest};font-size:15px;line-height:1.55;">${c.effortNote}</td></tr>
      </table>

      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.childDetailUrl, "See today's progress")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get a daily summary? Turn it off in <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Settings &rarr; Email preferences</a>. You&rsquo;ll still get account and safety emails.</p>
    `);

  // Plain-text fallback (every client renders this when HTML is stripped).
  const textLines = [
    c.headline,
    "",
    c.todayLine,
    "",
    "TODAY",
    ...c.topicLines.map((t) => `- ${t.title}: ${t.outcome}`),
  ];
  if (c.progressLines.length > 0) {
    textLines.push("", "PROGRESS SO FAR", ...c.progressLines.map((p) => `- ${p.text}`));
    if (subText) textLines.push(subText);
  }
  textLines.push("", "A WARM NOTE", c.effortNote, "", `See today's progress: ${opts.childDetailUrl}`, "", `Manage emails: ${opts.settingsUrl}`);
  const text = textLines.join("\n");

  return { subject: c.subject, html, text };
}

export function escalationAlertTemplate(opts: {
  parentName: string | null;
  childFirstName: string;
  severity: string;
  detailUrl: string;
  settingsUrl: string;
}): { subject: string; html: string } {
  const greeting = opts.parentName
    ? `Hi ${opts.parentName.split(" ")[0]},`
    : "Hello,";
  return {
    subject: `${opts.childFirstName} could use a check-in`,
    html: WRAP(`
      ${heading(greeting)}
      <p style="margin:0 0 16px;">During today&rsquo;s lesson, something ${opts.childFirstName} wrote suggested they were finding things hard, so we gently paused the lesson. This is a precaution — our safety check prefers to pause too often rather than miss a moment that matters.</p>
      <p style="margin:0 0 22px;">A calm break and a quick chat is usually all that&rsquo;s needed. The details are waiting in your dashboard (severity: ${opts.severity}), where you can also message the Edway team — we don&rsquo;t include them in email.</p>
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.detailUrl, "Review &amp; message the team")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">You can manage these alerts in <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Settings &rarr; Email preferences</a>. Account and safety emails inside the dashboard are always available regardless.</p>
    `),
  };
}

/**
 * Parent milestone event email (Wave 7, Phase 5) — mastery celebration or a
 * gentle inactivity reminder. Copy is pre-built deterministically by
 * `lib/engine/parent-events.ts`; this only lays it out. A mastery event gets the
 * warm forest accent; the inactivity nudge stays quiet and low-key.
 */
export function parentEventTemplate(opts: {
  parentName: string | null;
  kind: "mastery" | "inactivity";
  subject: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  settingsUrl: string;
}): { subject: string; html: string; text: string } {
  const greeting = opts.parentName
    ? `Hi ${opts.parentName.split(" ")[0]},`
    : "Hello,";
  const celebrate = opts.kind === "mastery";
  const accentBlock = celebrate
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;background:rgba(35,66,49,0.05);border-left:3px solid ${COLORS.forest};border-radius:8px;">
        <tr><td style="padding:14px 18px;font-family:${SERIF};font-style:italic;color:${COLORS.forest};font-size:15px;line-height:1.55;">${opts.body}</td></tr>
      </table>`
    : `<p style="margin:0 0 26px;">${opts.body}</p>`;

  const html = WRAP(`
      ${heading(opts.headline)}
      <p style="margin:0 0 22px;">${greeting}</p>
      ${accentBlock}
      <p style="margin:0 0 24px;text-align:center;">${amberButton(opts.ctaUrl, opts.ctaLabel)}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer not to get these updates? Turn them off in <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Settings &rarr; Email preferences</a>. You&rsquo;ll still get account and safety emails.</p>
    `);

  const text = [
    opts.headline,
    "",
    greeting,
    "",
    opts.body,
    "",
    `${opts.ctaLabel}: ${opts.ctaUrl}`,
    "",
    `Manage emails: ${opts.settingsUrl}`,
  ].join("\n");

  return { subject: opts.subject, html, text };
}

export function portfolioShareTemplate(opts: {
  childName: string;
  term: string;
  verificationHash: string;
  verificationUrl: string;
  fromParent: string | null;
}): { subject: string; html: string } {
  const from = opts.fromParent ? ` from ${opts.fromParent}` : "";
  return {
    subject: `Edway education portfolio — ${opts.childName}, ${opts.term}`,
    html: WRAP(`
      ${heading(`Education portfolio${from}`)}
      <p style="margin:0 0 12px;">A verified Local Authority education portfolio has been shared with you for:</p>
      <p style="margin:0 0 18px;font-family:${SERIF};color:${COLORS.forestDeep};font-weight:600;font-size:18px;">${opts.childName} — ${opts.term}</p>
      <p style="margin:0 0 8px;color:${COLORS.inkSoft};font-size:13px;">Statutory format: Intent · Implementation · Impact · Next Steps.</p>
      <p style="margin:0 0 6px;color:${COLORS.inkSoft};font-size:13px;">Tamper-evident SHA-256 verification hash:</p>
      <code style="display:block;word-break:break-all;background:${COLORS.linenAlt};border:1px solid ${COLORS.line};border-radius:8px;padding:10px;color:${COLORS.ink};font-size:12px;margin:0 0 16px;">${opts.verificationHash}</code>
      <p style="margin:0 0 18px;text-align:center;">${amberButton(opts.verificationUrl, "Verify portfolio")}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:13px;">Any change to the portfolio changes this hash. The verification link confirms the supplied hash exists in Edway's generated dossier record.</p>
    `),
  };
}

// ── Lifecycle re-engagement (win-back / upsell) ──────────
//
// Segmented, escalating, mobile-responsive marketing email. Personalised with
// the child's first name, ONE concrete value point, ONE clear CTA, and a working
// one-click unsubscribe in the footer (via WRAP's unsubscribeUrl). Content varies
// by stage (gentle → value → win-back) and track ("upsell" for free/lapsed adds
// what a plan unlocks + a subscribe CTA at the final stage; "reengage" for
// paid-active parents is a warm check-in with NO upsell). Pure layout — the
// decision to send lives in lib/engine/reengagement.ts.

export type ReengEmailStage = 1 | 2 | 3;
export type ReengEmailTrack = "upsell" | "reengage";

/** Small "what a plan unlocks" list, upsell track only. */
function planUnlocks(): string {
  const items = [
    "Unlimited daily lessons across Maths, English &amp; Science",
    "The full GCSE-aligned curriculum, not just the diagnostic",
    "A Local Authority-ready portfolio that builds itself",
    "One-to-one tutoring when a topic needs a human",
  ];
  return `<ul style="margin:0 0 22px;padding-left:20px;color:${COLORS.ink};">${items
    .map((i) => `<li style="margin-bottom:6px;">${i}</li>`)
    .join("")}</ul>`;
}

export function reengagementTemplate(opts: {
  name: string | null;
  childFirstName: string;
  stage: ReengEmailStage;
  track: ReengEmailTrack;
  /** Primary "come back and log in" destination. */
  loginUrl: string;
  /** Subscribe / choose-a-plan destination (upsell CTA). */
  subscribeUrl: string;
  /** Manage email preferences (soft opt-down). */
  settingsUrl: string;
  /** One-click unsubscribe (signed, login-less) — required for marketing. */
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const first = opts.name ? opts.name.split(" ")[0] : null;
  const greeting = first ? `Hi ${first},` : "Hi there,";
  const child = opts.childFirstName;
  const upsell = opts.track === "upsell";

  let subject: string;
  let headline: string;
  let bodyHtml: string;
  let ctaLabel: string;
  let ctaUrl: string;
  let bodyText: string;

  if (opts.stage === 1) {
    // Gentle — both tracks identical: warm, low-key, "pick up where you left off".
    subject = `We miss you — ${child}'s next lesson is ready`;
    headline = `${child}'s next lesson is ready`;
    ctaLabel = "Continue learning";
    ctaUrl = opts.loginUrl;
    bodyHtml = `
      <p style="margin:0 0 18px;">It&rsquo;s been a little while since ${child} last logged in — no worries at all, some weeks are busier than others. Whenever it suits, ${child}&rsquo;s next lesson is picked out and waiting, right where you left off.</p>
      <p style="margin:0 0 24px;">A single 10-minute session is enough to keep the momentum going.</p>`;
    bodyText = `It's been a little while since ${child} last logged in. Whenever it suits, ${child}'s next lesson is ready and waiting — a single 10-minute session keeps the momentum going.`;
  } else if (opts.stage === 2) {
    // Value — what's waiting; upsell track adds what a plan unlocks.
    subject = `Here's what ${child} is missing`;
    headline = `A few things waiting for ${child}`;
    ctaLabel = "See what's waiting";
    ctaUrl = opts.loginUrl;
    bodyHtml = `
      <p style="margin:0 0 18px;">${child}&rsquo;s learning is paused mid-stride. There are topics ready to be certified, a next lesson lined up, and progress that&rsquo;s just a login away from moving again.</p>
      ${
        upsell
          ? `<p style="margin:0 0 10px;font-weight:600;color:${COLORS.forestDeep};">A full plan would also unlock:</p>${planUnlocks()}`
          : `<p style="margin:0 0 24px;">Pick things back up whenever ${child} is ready — it takes just one short session to find the rhythm again.</p>`
      }`;
    bodyText = upsell
      ? `${child}'s learning is paused mid-stride — topics ready to certify and a next lesson lined up. A full plan also unlocks unlimited daily lessons, the full GCSE curriculum, a self-building portfolio, and one-to-one tutoring.`
      : `${child}'s learning is paused mid-stride — topics ready to certify and a next lesson lined up. It takes just one short session to find the rhythm again.`;
  } else {
    // Win-back — upsell: subscribe CTA + incentive; reengage: warm check-in.
    if (upsell) {
      subject = `Come back to ${child}'s learning — 20% off your first month`;
      headline = `Ready when ${child} is`;
      ctaLabel = "Choose a plan";
      ctaUrl = opts.subscribeUrl;
      bodyHtml = `
        <p style="margin:0 0 18px;">We&rsquo;d love to help ${child} keep going. To make coming back easy, here&rsquo;s <strong style="color:${COLORS.forestDeep};">20% off your first month</strong> of any Edway plan — unlimited lessons, the full curriculum, and a portfolio that builds itself as ${child} learns.</p>
        <p style="margin:0 0 24px;color:${COLORS.inkSoft};font-size:13px;">No pressure, and no commitment — cancel anytime.</p>`;
      bodyText = `We'd love to help ${child} keep going. Here's 20% off your first month of any Edway plan — unlimited lessons, the full curriculum, and a self-building portfolio. Cancel anytime.`;
    } else {
      subject = `Checking in on ${child}`;
      headline = `Just checking in`;
      ctaLabel = `Open ${child}'s dashboard`;
      ctaUrl = opts.loginUrl;
      bodyHtml = `
        <p style="margin:0 0 18px;">We&rsquo;ve noticed it&rsquo;s been quiet for ${child} lately, and wanted to check in — is everything going okay? If something&rsquo;s in the way, just reply to this email and a real person will help.</p>
        <p style="margin:0 0 24px;">${child}&rsquo;s lessons are exactly where you left them, ready whenever the time is right.</p>`;
      bodyText = `We've noticed it's been quiet for ${child} lately and wanted to check in — is everything going okay? Just reply and a real person will help. ${child}'s lessons are ready whenever the time is right.`;
    }
  }

  const html = WRAP(
    `
      ${heading(headline)}
      <p style="margin:0 0 22px;">${greeting}</p>
      ${bodyHtml}
      <p style="margin:0 0 24px;text-align:center;">${amberButton(ctaUrl, ctaLabel)}</p>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:12.5px;">Prefer fewer emails like this? <a href="${opts.settingsUrl}" style="color:${COLORS.clayDeep};">Manage your preferences</a>. Account and safety emails always reach you.</p>
    `,
    { unsubscribeUrl: opts.unsubscribeUrl },
  );

  const text = [
    headline,
    "",
    greeting,
    "",
    bodyText,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    `Manage preferences: ${opts.settingsUrl}`,
    `Unsubscribe: ${opts.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
