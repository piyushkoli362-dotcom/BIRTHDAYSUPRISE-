"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/client";
export default function Auth({
  next = "/dashboard",
  mode = "local",
}: {
  next?: string;
  mode?: string;
}) {
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => setReady(true), []);
  const router = useRouter();
  return (
    <div className="auth-card">
      <span className="eyebrow">YOUR LITTLE CORNER OF THE WORLD</span>
      <h1>{signup ? "Start with a little wish." : "Welcome back."}</h1>
      <div className="button-row" aria-label="Account options">
        <button type="button" className={!signup ? "primary" : "outline"} aria-pressed={!signup} disabled={busy || !ready} onClick={() => {setSignup(false);setError("");}}>Sign in</button>
        <button type="button" className={signup ? "primary" : "outline"} aria-pressed={signup} disabled={busy || !ready} onClick={() => {setSignup(true);setError("");}}>Create account</button>
      </div>
      <p>
        {signup
          ? "Create your account. Make something they’ll keep close."
          : "Your surprises are right where you left them."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setSlow(false);
          setError("");
          const controller = new AbortController();
          const slowTimer = setTimeout(() => setSlow(true), 5000);
          const deadline = setTimeout(() => controller.abort(), 15000);
          const f = new FormData(e.currentTarget);
          try {
            const r = await api<{ confirmation?: boolean }>(
              "/api/auth/" + (signup ? "signup" : "login"),
              "POST",
              { email: f.get("email"), password: f.get("password") },
              controller.signal,
            );
            if (r.confirmation)
              setError(
                "Check your email to confirm your account, then sign in.",
              );
            else {
              router.push(next);
              router.refresh();
            }
          } catch (e) {
            setError(controller.signal.aborted
              ? "The connection is taking too long. If you were creating an account, try signing in before submitting again."
              : (e as Error).message);
          } finally {
            clearTimeout(deadline);
            clearTimeout(slowTimer);
            setSlow(false);
            setBusy(false);
          }
        }}
      >
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={10}
            maxLength={128}
            required
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="At least 10 characters"
          />
        </label>
        <button className="primary" disabled={busy || !ready}>
          {busy ? "One moment…" : signup ? "Create account" : "Sign in"} →
        </button>
        {slow && <small role="status">Connecting securely… please don't submit again.</small>}
      </form>
      <p role="status" className="feedback">
        {error}
      </p>
      <button
        className="text-link"
        disabled={busy}
        onClick={() => {
          setSignup(!signup);
          setError("");
        }}
      >
        {signup
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
      {mode === "local" && (
        <small className="mode-note">
          Local development · accounts and uploads stay on this computer.
        </small>
      )}
    </div>
  );
}
