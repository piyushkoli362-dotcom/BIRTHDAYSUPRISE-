import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readPage, user } from "../../../lib/server";
import Experience from "../../../components/birthday/Experience";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await user())) redirect("/login?next=/preview/" + id);
  const p = await readPage(id);
  if (!p) notFound();
  return (
    <>
      <div className="preview-bar">
        <span>Private preview · Only you can see this</span>
        <Link href={"/dashboard/" + id + "/edit"}>Back to editing →</Link>
      </div>
      <Experience page={p} />
    </>
  );
}
