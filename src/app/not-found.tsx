import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <span>✧</span>
      <h1>This little world isn’t here.</h1>
      <p>The link may be private, unpublished, or no longer available.</p>
      <Link className="primary" href="/">
        Back to Little Wishes
      </Link>
    </main>
  );
}
