export async function api<T>(
  url: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const r = await fetch(url, {
    signal,
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
export async function shareLink(url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title: "A little birthday surprise", url });
      return "Shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError")
        return "Share cancelled";
    }
  }
  await navigator.clipboard.writeText(url);
  return "Link copied";
}
