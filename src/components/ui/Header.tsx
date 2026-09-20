import Link from "next/link";
export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        ✧ little wishes<span>A WORLD MADE FOR THEM</span>
      </Link>
      <nav>
        <Link href="/#themes">The themes</Link>
        <Link href="/#how">How it works</Link>
        <Link href="/dashboard">My surprises</Link>
        <Link href="/create" className="nav-cta">
          Create a surprise ↗
        </Link>
      </nav>
    </header>
  );
}
