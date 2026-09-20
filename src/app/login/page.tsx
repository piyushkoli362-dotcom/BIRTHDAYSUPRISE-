import Auth from "../../components/creator/Auth";
import Header from "../../components/ui/Header";
import { cloud } from "../../lib/server";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const n = (await searchParams).next;
  return (
    <>
      <Header />
      <main className="auth-shell">
        <Auth
          mode={cloud ? "supabase" : "local"}
          next={n?.startsWith("/") && !n.startsWith("//") ? n : "/dashboard"}
        />
      </main>
    </>
  );
}
