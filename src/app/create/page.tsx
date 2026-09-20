import { redirect } from "next/navigation";
import { user } from "../../lib/server";
import Creator from "../../components/creator/Creator";
import Header from "../../components/ui/Header";
export const dynamic = "force-dynamic";
export default async function Create({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  if (!(await user())) redirect("/login?next=/create");
  return (
    <>
      <Header />
      <Creator theme={(await searchParams).theme} />
    </>
  );
}
