/** Dev-only: render every re-engagement email variant to HTML for screenshotting. */
import { writeFileSync, mkdirSync } from "node:fs";
import { reengagementTemplate } from "../src/lib/email/templates";
import {
  unsubscribePageHtml,
  UNSUBSCRIBE_DONE,
  UNSUBSCRIBE_EXPIRED,
} from "../src/lib/email/unsubscribe-page";

const OUT = process.argv[2] || "./.reengage-preview";
mkdirSync(OUT, { recursive: true });

const base = {
  name: "Jane Okafor",
  childFirstName: "Ada",
  loginUrl: "https://edway.uk/login?redirect=/dashboard",
  subscribeUrl: "https://edway.uk/pricing",
  settingsUrl: "https://edway.uk/settings",
  unsubscribeUrl: "https://edway.uk/unsubscribe?token=PREVIEW",
};

const variants: { stage: 1 | 2 | 3; track: "upsell" | "reengage" }[] = [
  { stage: 1, track: "upsell" },
  { stage: 2, track: "upsell" },
  { stage: 3, track: "upsell" },
  { stage: 1, track: "reengage" },
  { stage: 2, track: "reengage" },
  { stage: 3, track: "reengage" },
];

const index: string[] = [];
for (const v of variants) {
  const t = reengagementTemplate({ ...base, ...v });
  const file = `stage${v.stage}-${v.track}.html`;
  writeFileSync(`${OUT}/${file}`, t.html, "utf8");
  index.push(`[${v.track} · stage ${v.stage}] ${t.subject} -> ${file}`);
}
// Unsubscribe confirmation pages (login-less one-click landing).
writeFileSync(`${OUT}/unsubscribe-done.html`, unsubscribePageHtml(UNSUBSCRIBE_DONE), "utf8");
writeFileSync(`${OUT}/unsubscribe-expired.html`, unsubscribePageHtml(UNSUBSCRIBE_EXPIRED), "utf8");
index.push("[unsubscribe] done -> unsubscribe-done.html");
index.push("[unsubscribe] expired -> unsubscribe-expired.html");

writeFileSync(`${OUT}/index.txt`, index.join("\n"), "utf8");
console.log(index.join("\n"));
console.log(`\nWrote ${variants.length + 2} previews to ${OUT}`);
