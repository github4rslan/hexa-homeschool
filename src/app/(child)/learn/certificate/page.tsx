import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentParentId, getActiveChild, topicCertificate } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { TopicCertificateView } from "@/components/child/topic-certificate-view";

export const metadata: Metadata = { title: "My certificate" };
export const dynamic = "force-dynamic";

export default async function TopicCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  const { topic } = await searchParams;
  if (!topic) redirect("/learn/map");

  const certificate = await topicCertificate(parentId, child, topic);
  // Only a genuinely-certified topic yields a certificate — otherwise the child
  // goes back to the journey map (no dead-wall, no fake certificate).
  if (!certificate) redirect("/learn/map");

  return <TopicCertificateView certificate={certificate} />;
}
