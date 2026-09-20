import { redirect, notFound } from "next/navigation";
import { user, readPage } from "../../../../lib/server";
import Creator from "../../../../components/creator/Creator";
import Header from "../../../../components/ui/Header";
export const dynamic = "force-dynamic";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await user())) redirect("/login?next=/dashboard/" + id + "/edit");
  const p = await readPage(id);
  if (!p) notFound();
  return (
    <>
      <Header />
      <Creator initial={p} />
    </>
  );
}
