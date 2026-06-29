/** One-off: render the real code template and send it via Brevo. */
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

async function main() {
  loadEnvLocal();
  const { verifyCodeTemplate } = await import("../src/lib/email/templates");
  const tmpl = verifyCodeTemplate({ name: "Arslan", code: "482913" });

  const key = process.env.BREVO_TEST_KEY;
  const to = process.env.TEST_TO || "im.arslanfaisal@gmail.com";
  if (!key) throw new Error("Set BREVO_TEST_KEY env to run this test.");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Edway", email: "info@thekingdomedit.com" },
      to: [{ email: to }],
      subject: "[Preview] " + tmpl.subject,
      htmlContent: tmpl.html,
    }),
  });
  console.log(res.status, await res.text());
}

main().catch((e) => { console.error(e); process.exit(1); });
