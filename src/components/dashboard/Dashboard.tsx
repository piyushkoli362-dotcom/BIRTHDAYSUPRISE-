"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Copy, Eye, Pencil, Trash2, Share2, LogOut } from "lucide-react";
import type { BirthdayPage } from "../../types/birthday";
import { getTheme } from "../../themes";
import { api, shareLink } from "../../lib/client";
export default function Dashboard({
  initial,
  email,
}: {
  initial: BirthdayPage[];
  email: string;
}) {
  const [pages, setPages] = useState(initial);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState("");
  async function action(p: BirthdayPage, a: string) {
    setBusy(p.id);
    setNotice("");
    try {
      if (a === "delete") {
        await api("/api/pages/" + p.id, "DELETE");
        setPages(pages.filter((x) => x.id !== p.id));
        setConfirm("");
      } else {
        const r = await api<BirthdayPage>(
          "/api/pages/" + p.id + "/" + a,
          "POST",
          {},
        );
        setPages(
          a === "duplicate"
            ? [r, ...pages]
            : pages.map((x) => (x.id === r.id ? r : x)),
        );
        if (a === "duplicate")
          setNotice("Surprise duplicated with its photos and music.");
      }
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <main className="dashboard section-wrap">
      <div className="section-top">
        <div>
          <span className="eyebrow">SOMETHING BEAUTIFUL STARTS HERE</span>
          <h1>My birthday pages</h1>
          <p>{email}</p>
        </div>
        <div className="button-row">
          <Link href="/dashboard/create" className="primary">
            <Plus size={16} /> Create new
          </Link>
          <button
            className="icon-btn"
            aria-label="Sign out"
            onClick={async () => {
              await api("/api/auth/logout", "POST");
              location.href = "/";
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      <p role="status" className="feedback">
        {notice}
      </p>
      {!pages.length ? (
        <div className="empty">
          <span>✧</span>
          <h2>Your first little world is waiting.</h2>
          <p>Start with someone special. We’ll help with the magic.</p>
          <Link className="primary" href="/create">
            Create your first surprise
          </Link>
        </div>
      ) : (
        <div className="dashboard-grid">
          {pages.map((p) => {
            const t = getTheme(p.themeId);
            return (
              <article className="page-card" key={p.id}>
                <div
                  className="page-cover"
                  style={{ background: t.colors.background }}
                >
                  {t.image ? (
                    <Image
                      fill
                      src={t.image}
                      alt="Theme artwork"
                      sizes="400px"
                    />
                  ) : (
                    <span>✧</span>
                  )}
                  <span className={"status " + p.status}>{p.status}</span>
                  <h2>{p.recipientName || "Untitled surprise"}</h2>
                </div>
                <div className="page-details">
                  <p>
                    {t.name} · {p.birthdayDate || "Choose a birthday"}
                  </p>
                  <code>/birthday/{p.slug}</code>
                  <div className="page-actions">
                    <Link href={"/dashboard/" + p.id + "/edit"}>
                      <Pencil size={15} /> Edit
                    </Link>
                    <Link href={"/preview/" + p.id}>
                      <Eye size={15} /> Preview
                    </Link>
                    <button
                      disabled={busy === p.id}
                      onClick={() =>
                        action(
                          p,
                          p.status === "published" ? "unpublish" : "publish",
                        )
                      }
                    >
                      {p.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                  <div className="page-actions secondary">
                    <button
                      disabled={busy === p.id}
                      onClick={() => action(p, "duplicate")}
                    >
                      <Copy size={14} /> Duplicate
                    </button>
                    {p.status === "published" && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                location.origin + "/birthday/" + p.slug,
                              );
                              setNotice("Link copied");
                            } catch {
                              setNotice(
                                "Copy this link: " +
                                  location.origin +
                                  "/birthday/" +
                                  p.slug,
                              );
                            }
                          }}
                        >
                          <Copy size={14} /> Copy link
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setNotice(
                                await shareLink(
                                  location.origin + "/birthday/" + p.slug,
                                ),
                              );
                            } catch {
                              setNotice(
                                "Could not share. Copy the link instead.",
                              );
                            }
                          }}
                        >
                          <Share2 size={14} /> Share
                        </button>
                      </>
                    )}
                    <button
                      aria-label="Delete page"
                      onClick={() => setConfirm(p.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {confirm === p.id && (
                    <div className="delete-confirm">
                      <p>Delete this birthday page and its local uploads?</p>
                      <button
                        onClick={() => action(p, "delete")}
                        disabled={!!busy}
                      >
                        Delete permanently
                      </button>
                      <button onClick={() => setConfirm("")}>Cancel</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
