import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentParentId, getChildById, masteryCertificate } from "@/lib/db/repo";
import { CertificateView } from "@/components/dashboard/certificate-view";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Mastery certificate" };
export const dynamic = "force-dynamic";

const VALID: Subject[] = ["mathematics", "english", "science"];

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const { childId } = await params;
  const { subject } = await searchParams;

  const parentId = await currentParentId();
  if (!parentId) redirect("/login");
  const child = await getChildById(parentId, childId);
  if (!child?._id) redirect("/dashboard");

  const subj = VALID.find((s) => s === subject);
  if (!subj) redirect(`/dashboard/children/${childId}`);

  const certificate = await masteryCertificate(parentId, child, subj);
  // Only fully-certified subjects yield a certificate — otherwise back to profile.
  if (!certificate) redirect(`/dashboard/children/${childId}`);

  return <CertificateView certificate={certificate} childId={childId} />;
}
