import { notFound } from "next/navigation";
import { readPage } from "../../../lib/server";
import { demo } from "../../../data/demo";
import Experience from "../../../components/birthday/Experience";
export const dynamic = "force-dynamic";
export default async function Birthday({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = slug === "mahima" ? demo : await readPage(slug, true);
  if (!p) notFound();
  return <Experience page={p} />;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = slug === "mahima" ? demo : await readPage(slug, true);
  return {
    title: p
      ? "A little birthday world for " + p.recipientName
      : "Birthday surprise",
    description: "A personal birthday surprise, made with love.",
    robots: { index: false, follow: false },
  };
}
