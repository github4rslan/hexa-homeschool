import { NextResponse } from "next/server";
import { verifyVerificationToken, appUrl } from "@/lib/email/verification";
import { markEmailVerified, findParentById } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";
import { welcomeTemplate } from "@/lib/email/templates";
import { captureServer } from "@/lib/analytics/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /verify?token=… — confirm email, sign the parent in, go to onboarding. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const parentId = await verifyVerificationToken(token);

  if (!parentId) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("That verification link is invalid or has expired."), request.url),
    );
  }

  await markEmailVerified(parentId);
  captureServer(parentId, "signup_completed", { verification: "link" });
  const parent = await findParentById(parentId);
  if (parent?._id) {
    await sendLifecycleEmail(parentId, "welcome", () => {
      const tmpl = welcomeTemplate({
        name: parent.full_name,
        dashboardUrl: `${appUrl()}/dashboard`,
      });
      return { to: parent.email, subject: tmpl.subject, html: tmpl.html };
    });
    await createSession({
      id: parent._id.toHexString(),
      email: parent.email,
      tokenVersion: parent.token_version ?? 0,
    });
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
