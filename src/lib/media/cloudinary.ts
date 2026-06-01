import "server-only";
import { createHash, createHmac } from "node:crypto";

/**
 * Cloudinary integration via REST + signature (no SDK, zero new deps).
 *
 * Public assets (marketing, resources) use type=upload and are delivered by a
 * plain secure_url. Private assets (child work, lesson audio) use
 * type=authenticated and are delivered via a short-lived signed URL generated
 * server-side only — a different family can never read another child's work.
 *
 * COMPLIANCE NOTE: the brief mandates UK data residency for children's data.
 * Cloudinary is US-based; using it for child_work / lesson_audio is an
 * owner-approved choice. Confirm a UK-region/EU data setting on the Cloudinary
 * account before real children's data goes live.
 */

export class MediaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaConfigError";
  }
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new MediaConfigError(
      "Cloudinary env vars are not set (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

export const HEXA_FOLDERS = {
  marketing: "hexa/marketing",
  child_work: "hexa/work",
  lesson_audio: "hexa/audio",
  resource: "hexa/resources",
} as const;

export type MediaUseCase = keyof typeof HEXA_FOLDERS;

/**
 * Build the Cloudinary upload signature.
 * Signature = SHA-1( sorted "k=v&k2=v2..." of all params except file/api_key,
 * with the api_secret appended ). This is Cloudinary's documented scheme.
 */
export function signUploadParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .filter((k) => k !== "file" && k !== "api_key" && k !== "resource_type")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

export interface SignedUpload {
  uploadUrl: string;
  fields: Record<string, string>;
}

/**
 * Produce the params + signature for a direct browser→Cloudinary upload.
 * `authenticated` controls public vs private delivery.
 */
export function buildSignedUpload(input: {
  useCase: MediaUseCase;
  /** sub-folder under the use-case folder (e.g. a child id for child_work). */
  subPath?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  authenticated: boolean;
}): SignedUpload {
  const cfg = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = input.subPath
    ? `${HEXA_FOLDERS[input.useCase]}/${input.subPath}`
    : HEXA_FOLDERS[input.useCase];

  const signedParams: Record<string, string | number> = {
    timestamp,
    folder,
    type: input.authenticated ? "authenticated" : "upload",
  };
  const signature = signUploadParams(signedParams, cfg.apiSecret);

  const resourceType = input.resourceType ?? "auto";
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/${resourceType}/upload`,
    fields: {
      api_key: cfg.apiKey,
      timestamp: String(timestamp),
      folder,
      type: input.authenticated ? "authenticated" : "upload",
      signature,
    },
  };
}

/**
 * Server-side signed delivery URL for a PRIVATE (authenticated) asset.
 * Short-lived; only ever returned to the asset's owner.
 */
export function signedDeliveryUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
  expiresInSeconds = 3600,
): string {
  const cfg = getCloudinaryConfig();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  // token = sha256 hmac of the path + expiry, per Cloudinary signed URLs.
  const toSign = `${publicId}${expiresAt}`;
  const token = createHmac("sha256", cfg.apiSecret)
    .update(toSign)
    .digest("hex");
  return `https://res.cloudinary.com/${cfg.cloudName}/${resourceType}/authenticated/s--${token.slice(0, 8)}--/${publicId}?_a=${expiresAt}`;
}

/** Upload raw bytes server-side (used for TTS audio caching). */
export async function uploadBytes(input: {
  bytes: ArrayBuffer;
  useCase: MediaUseCase;
  resourceType: "video" | "raw"; // audio uploads as video resource type
  authenticated: boolean;
  publicIdHint?: string;
}): Promise<{ publicId: string; secureUrl: string }> {
  const cfg = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = HEXA_FOLDERS[input.useCase];

  const signedParams: Record<string, string | number> = {
    timestamp,
    folder,
    type: input.authenticated ? "authenticated" : "upload",
  };
  if (input.publicIdHint) signedParams.public_id = input.publicIdHint;
  const signature = signUploadParams(signedParams, cfg.apiSecret);

  const form = new FormData();
  form.append(
    "file",
    new Blob([input.bytes], { type: "audio/mpeg" }),
    "audio.mp3",
  );
  form.append("api_key", cfg.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("type", input.authenticated ? "authenticated" : "upload");
  if (input.publicIdHint) form.append("public_id", input.publicIdHint);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/${input.resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { public_id: string; secure_url: string };
  return { publicId: data.public_id, secureUrl: data.secure_url };
}
