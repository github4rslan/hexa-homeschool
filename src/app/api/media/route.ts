import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { currentParentId, parentOwnsChild, recordMedia } from "@/lib/db/repo";
import type { MediaDoc, MediaUseCase } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a MediaDoc after a successful client → Cloudinary upload.
 * Re-validates auth + ownership; trusts only fields the server can verify
 * (use-case folder + public flag are derived here, not taken from the client).
 */
export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: {
    useCase?: unknown;
    childId?: unknown;
    publicId?: unknown;
    secureUrl?: unknown;
    resourceType?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const useCase = String(body.useCase ?? "") as MediaUseCase;
  const publicId = typeof body.publicId === "string" ? body.publicId : "";
  const secureUrl = typeof body.secureUrl === "string" ? body.secureUrl : "";
  const childId = typeof body.childId === "string" ? body.childId : undefined;
  const resourceType =
    body.resourceType === "video" || body.resourceType === "raw"
      ? body.resourceType
      : "image";

  if (!["marketing", "child_work", "resource"].includes(useCase)) {
    return NextResponse.json({ error: "Invalid use case." }, { status: 400 });
  }
  if (!publicId || !secureUrl) {
    return NextResponse.json(
      { error: "publicId and secureUrl are required." },
      { status: 400 },
    );
  }

  if (useCase === "child_work") {
    if (!childId || !(await parentOwnsChild(parentId, childId))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const isPublic = useCase === "marketing" || useCase === "resource";
  const folder =
    useCase === "child_work"
      ? `hexa/work/${childId}`
      : useCase === "marketing"
        ? "hexa/marketing"
        : "hexa/resources";

  const id = await recordMedia({
    owner_id: new ObjectId(parentId),
    child_id: childId ? new ObjectId(childId) : null,
    use_case: useCase,
    folder,
    public_id: publicId,
    secure_url: secureUrl,
    resource_type: resourceType as MediaDoc["resource_type"],
    is_public: isPublic,
  });

  return NextResponse.json({ id }, { headers: { "Cache-Control": "no-store" } });
}
