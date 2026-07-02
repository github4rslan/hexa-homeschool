/**
 * Allow-list for media URLs the server will persist as trusted assets. Uploads
 * go client → Cloudinary, so a recorded secure_url must be an https Cloudinary
 * URL. Pure + testable; the route rejects anything this returns false for.
 */
export function isAllowedMediaUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  return host === "res.cloudinary.com" || host.endsWith(".cloudinary.com");
}
