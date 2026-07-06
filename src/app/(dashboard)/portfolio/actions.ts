"use server";

import { currentParentId, findParentById } from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { portfolioShareTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";

export interface ShareResult {
  ok: boolean;
  reason?: string;
}

/**
 * Email a generated portfolio's verification details to a Local Authority
 * address the parent enters. Parent stays in control — nothing is auto-sent.
 */
export async function emailPortfolio(input: {
  toEmail: string;
  childName: string;
  term: string;
  verificationHash: string;
}): Promise<ShareResult> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false, reason: "Not signed in." };

  const to = input.toEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, reason: "Please enter a valid email address." };
  }
  if (!emailConfigured()) {
    return {
      ok: false,
      reason: "Email isn't configured yet. Use Print / Save as PDF to share manually.",
    };
  }

  const parent = await findParentById(parentId);
  const verificationUrl = `${appUrl()}/verify-portfolio?hash=${encodeURIComponent(
    input.verificationHash,
  )}`;
  const tmpl = portfolioShareTemplate({
    childName: input.childName,
    term: input.term,
    verificationHash: input.verificationHash,
    verificationUrl,
    fromParent: parent?.full_name ?? null,
  });
  const res = await sendEmail({ to, subject: tmpl.subject, html: tmpl.html });
  return res.ok
    ? { ok: true }
    : { ok: false, reason: "Could not send the email. Please try again." };
}
