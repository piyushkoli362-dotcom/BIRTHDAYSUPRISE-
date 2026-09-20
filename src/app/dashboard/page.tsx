import { redirect } from "next/navigation";
import { listPages, user } from "../../lib/server";
import Dashboard from "../../components/dashboard/Dashboard";
import Header from "../../components/ui/Header";
export const dynamic = "force-dynamic";
export default async function Page() {
  const u = await user();
  if (!u) redirect("/login?next=/dashboard");
  return (
    <>
      <Header />
      <Dashboard initial={await listPages()} email={u.email} />
    </>
  );
}
