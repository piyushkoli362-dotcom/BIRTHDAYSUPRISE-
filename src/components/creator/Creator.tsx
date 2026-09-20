"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Share2,
} from "lucide-react";
import type { BirthdayPage } from "../../types/birthday";
import { themes, getTheme } from "../../themes";
import { api, shareLink } from "../../lib/client";
const steps = [
  "Person",
  "Birthday",
  "Photos",
  "Message",
  "Music",
  "Theme",
  "Preview",
  "Publish",
];
export default function Creator({
  initial,
  theme,
}: {
  initial?: BirthdayPage;
  theme?: string;
}) {
  const [page, setPage] = useState<BirthdayPage | null>(initial || null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(
    initial ? "All changes saved" : "Creating your draft…",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const created = useRef(false);
  const dirty = useRef(false);
  const latest = useRef(page);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  latest.current = page;
  useEffect(() => {
    if (initial || created.current) return;
    created.current = true;
    api<BirthdayPage>("/api/pages", "POST")
      .then((p) => {
        if (theme) p.themeId = getTheme(theme).id;
        setPage(p);
        dirty.current = true;
        history.replaceState(null, "", "/dashboard/" + p.id + "/edit");
      })
      .catch((e) => setError(e.message));
  }, [initial, theme]);
  const update = (patch: Partial<BirthdayPage>) => {
    dirty.current = true;
    setPage((p) => (p ? { ...p, ...patch } : p));
    setStatus("Unsaved changes");
  };
  function save(snapshot: BirthdayPage, extra: object = {}) {
    setStatus("Saving…");
    const task = queue.current
      .catch(() => {})
      .then(() =>
        api<BirthdayPage>("/api/pages/" + snapshot.id, "PATCH", {
          ...snapshot,
          ...extra,
        }),
      );
    queue.current = task;
    return task
      .then((p) => {
        setStatus("All changes saved");
        return p;
      })
      .catch((e) => {
        setStatus("Not saved");
        setError(e.message);
        throw e;
      });
  }
  useEffect(() => {
    if (!page || !dirty.current) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      save(page).catch(() => {
        dirty.current = true;
      });
    }, 850);
    return () => clearTimeout(timer);
  }, [page]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  async function advance() {
    if (!page) return;
    setError("");
    if (step === 0 && !page.recipientName.trim()) {
      setError("Who is the surprise for? Add their name.");
      return;
    }
    if (step === 1 && !page.birthdayDate) {
      setError("Choose a birthday date.");
      return;
    }
    setBusy(true);
    try {
      const saved = await save(
        page,
        step === 0 && page.slug.startsWith("surprise-")
          ? { autoSlug: true }
          : {},
      );
      dirty.current = false;
      setPage(saved);
      setStep(Math.min(7, step + 1));
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | File[], kind: "photo" | "music") {
    if (!page) return;
    setUploading(true);
    setError("");
    const all = Array.from(files);
    try {
      if (kind === "photo" && page.photos.length + all.length > 20)
        throw new Error("Choose up to 20 photos in total.");
      for (const file of all) {
        if (
          kind === "photo" &&
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          throw new Error("Choose JPEG, PNG or WebP photos.");
        if (kind === "music" && !/\.(mp3|wav|m4a)$/i.test(file.name))
          throw new Error("Choose MP3, WAV or M4A audio.");
        const ticket = await api<{direct:boolean;stagingId?:string;signedUrl?:string}>(
          '/api/pages/'+page.id+'/upload-ticket','POST',{size:file.size});
        const uploaded = await new Promise<{ url: string; id: string }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(ticket.direct ? "PUT" : "POST", ticket.direct ? ticket.signedUrl! : "/api/pages/" + page.id + "/upload");
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable)
                setProgress(Math.round((e.loaded / e.total) * 100));
            };
            xhr.onload = () => {
              try {
                const d = JSON.parse(xhr.responseText);
                xhr.status < 300 ? resolve(d) : reject(new Error(d.error));
              } catch {
                reject(new Error("Upload failed. Please retry."));
              }
            };
            xhr.onerror = () =>
              reject(new Error("Connection lost. Please retry."));
            const form = new FormData();
            form.append(ticket.direct ? "" : "file", file);
            xhr.send(form);
          },
        );
        const r = ticket.direct ? await api<{url:string;id:string}>(
          '/api/pages/'+page.id+'/upload','POST',{stagingId:ticket.stagingId,mime:file.type}) : uploaded;
        dirty.current = true;
        setPage((p) =>
          p
            ? kind === "photo"
              ? {
                  ...p,
                  photos: [
                    ...p.photos,
                    {
                      id: r.id,
                      imageUrl: r.url,
                      caption: "",
                      order: p.photos.length,
                    },
                  ],
                }
              : { ...p, musicUrl: r.url }
            : p,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }
  if (!page)
    return (
      <main className="empty">
        <h1>Your little world is taking shape…</h1>
        <p role="alert">{error || status}</p>
        {error && (
          <button className="primary" onClick={() => location.reload()}>
            Try again
          </button>
        )}
      </main>
    );
  const field = (
    key: "recipientName" | "nickname" | "senderName" | "birthdayDate" | "slug",
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <label>
      {label}
      <input
        type={type}
        value={page[key]}
        maxLength={key === "slug" ? 60 : 80}
        placeholder={placeholder}
        onChange={(e) => update({ [key]: e.target.value })}
      />
    </label>
  );
  return (
    <main className="creator section-wrap">
      <div className="creator-title">
        <div>
          <span className="eyebrow">LET’S MAKE SOMETHING PERSONAL</span>
          <h1>A little world, made by you.</h1>
        </div>
        <span className="save-status">
          <Check size={14} />
          {status}
        </span>
      </div>
      <nav className="wizard-progress" aria-label="Creation steps">
        {steps.map((s, i) => (
          <button
            key={s}
            className={i === step ? "active" : ""}
            aria-current={i === step ? "step" : undefined}
            onClick={() => setStep(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s}
          </button>
        ))}
      </nav>
      <div className="creator-layout">
        <section className="wizard-panel">
          <span className="eyebrow">
            STEP {String(step + 1).padStart(2, "0")} OF 08
          </span>
          {step === 0 && (
            <>
              <h2>Who is this birthday surprise for?</h2>
              <p>Every beautiful surprise starts with someone special.</p>
              {field(
                "recipientName",
                "Recipient name",
                "text",
                "Their beautiful name",
              )}
              {field(
                "nickname",
                "Nickname (optional)",
                "text",
                "What you call them",
              )}
              {field(
                "senderName",
                "Your name (optional)",
                "text",
                "Who is this from?",
              )}
            </>
          )}
          {step === 1 && (
            <>
              <h2>A date worth celebrating.</h2>
              <p>
                Choose their birthday. The countdown always finds the next
                celebration.
              </p>
              {field("birthdayDate", "Birthday date", "date")}
              <small>
                The year is used only to store the date. No age is shown. For
                leap-day birthdays, February 28 is used in non-leap years.
              </small>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Moments worth keeping.</h2>
              <p>
                Add up to 20 photos. No photos yet? Beautiful placeholders are
                ready.
              </p>
              <label
                className="upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!uploading) upload(e.dataTransfer.files, "photo");
                }}
              >
                <Upload />
                <strong>Drop your favourite photos here</strong>
                <span>or tap to choose · JPEG, PNG, WebP · 10 MB each</span>
                <input
                  aria-label="Upload photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={(e) =>
                    e.target.files && upload(e.target.files, "photo")
                  }
                />
              </label>
              <div className="upload-grid">
                {page.photos.map((p, i) => (
                  <div key={p.id}>
                    <Image
                      src={p.imageUrl}
                      width={160}
                      height={160}
                      alt={p.caption || "Uploaded memory"}
                      unoptimized
                    />
                    <input
                      aria-label={"Caption " + (i + 1)}
                      placeholder="Add a caption…"
                      value={p.caption}
                      maxLength={300}
                      onChange={(e) =>
                        update({
                          photos: page.photos.map((x, j) =>
                            i === j ? { ...x, caption: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label={"Photo date " + (i + 1)}
                      placeholder="Date (optional)"
                      value={p.date || ""}
                      maxLength={40}
                      onChange={(e) =>
                        update({
                          photos: page.photos.map((x, j) =>
                            i === j ? { ...x, date: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <textarea
                      aria-label={"Memory note " + (i + 1)}
                      placeholder="A short memory…"
                      value={p.memory || ""}
                      maxLength={1000}
                      rows={2}
                      onChange={(e) =>
                        update({
                          photos: page.photos.map((x, j) =>
                            i === j ? { ...x, memory: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <div className="button-row">
                      <button
                        aria-label={"Move photo " + (i + 1) + " up"}
                        disabled={i === 0}
                        onClick={() => {
                          const a = [...page.photos];
                          [a[i - 1], a[i]] = [a[i], a[i - 1]];
                          update({ photos: a });
                        }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        aria-label={"Move photo " + (i + 1) + " down"}
                        disabled={i === page.photos.length - 1}
                        onClick={() => {
                          const a = [...page.photos];
                          [a[i + 1], a[i]] = [a[i], a[i + 1]];
                          update({ photos: a });
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        aria-label={"Remove photo " + (i + 1)}
                        onClick={() =>
                          update({
                            photos: page.photos.filter((x) => x.id !== p.id),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Write something from your heart.</h2>
              <p>No perfect words needed. Just your own.</p>
              <label>
                Your personal letter
                <textarea
                  rows={9}
                  maxLength={12000}
                  value={page.personalMessage}
                  placeholder="Something you’ve always wanted to say…"
                  onChange={(e) => update({ personalMessage: e.target.value })}
                />
              </label>
              <small>
                  Your words and line breaks appear exactly as written.
              </small>
              <h3>The little things</h3>
              <p>Optional small messages they can discover, one by one.</p>
              {page.reasons.map((r, i) => (
                <div className="reason-edit" key={i}>
                  <input
                    aria-label={"Little message " + (i + 1)}
                    value={r}
                    maxLength={300}
                    onChange={(e) =>
                      update({
                        reasons: page.reasons.map((x, j) =>
                          i === j ? e.target.value : x,
                        ),
                      })
                    }
                  />
                  <button
                    aria-label={"Remove message " + (i + 1)}
                    onClick={() =>
                      update({
                        reasons: page.reasons.filter((_, j) => i !== j),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                className="outline"
                disabled={page.reasons.length >= 20}
                onClick={() => update({ reasons: [...page.reasons, ""] })}
              >
                + Add a little message
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <h2>A song that feels like them.</h2>
              <p>
                Optional background music. It only starts when your recipient
                chooses to play it.
              </p>
              <label className="upload-zone">
                <Upload />
                <strong>Add your music</strong>
                <span>MP3, WAV or M4A · up to 20 MB</span>
                <input
                  aria-label="Upload music"
                  type="file"
                  accept=".mp3,.wav,.m4a"
                  disabled={uploading}
                  onChange={(e) =>
                    e.target.files && upload(e.target.files, "music")
                  }
                />
              </label>
              {page.musicUrl && (
                <>
                  <audio controls src={page.musicUrl} />
                  <button
                    className="text-link"
                    onClick={() => update({ musicUrl: "" })}
                  >
                    Remove music
                  </button>
                </>
              )}
            </>
          )}
          {step === 5 && (
            <>
              <h2>Choose their little world.</h2>
              <p>The atmosphere changes. Your memories stay yours.</p>
              <div className="theme-options">
                {themes.map((t) => (
                  <button
                    aria-pressed={page.themeId === t.id}
                    className={page.themeId === t.id ? "selected" : ""}
                    key={t.id}
                    onClick={() => update({ themeId: t.id })}
                  >
                    <span
                      style={{
                        background: t.colors.background,
                        color: t.colors.accent,
                      }}
                    >
                      ✧
                    </span>
                    <div>
                      <strong>{t.name}</strong>
                      <small>{t.decorations}</small>
                    </div>
                    {page.themeId === t.id && <Check size={18} />}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 6 && (
            <>
              <h2>See it through their eyes.</h2>
              <p>Take a moment to explore your surprise before sharing it.</p>
              <dl className="review-details">
                <dt>Made for</dt>
                <dd>{page.recipientName || "Not set"}</dd>
                <dt>Birthday</dt>
                <dd>{page.birthdayDate || "Not set"}</dd>
                <dt>Theme</dt>
                <dd>{getTheme(page.themeId).name}</dd>
                <dt>Memories</dt>
                <dd>{page.photos.length} photos</dd>
              </dl>
              <button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await save(page);
                    dirty.current = false;
                    location.href = "/preview/" + page.id;
                  } catch {
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Open private preview ↗
              </button>
              <p className="mode-note">
                Only you can see this preview while signed in.
              </p>
            </>
          )}
          {step === 7 && (
            <>
              <h2>
                {page.status === "published"
                  ? "Your birthday surprise is ready!"
                  : "Give your surprise a little address."}
              </h2>
              <p>Share a personal link. Let the experience do the rest.</p>
              {field("slug", "Your unique link", "text", "a-special-birthday")}
              <p className="link-preview">/birthday/{page.slug}</p>
              <button
                className="primary"
                disabled={busy || uploading}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await save(page);
                    const p = await api<BirthdayPage>(
                      "/api/pages/" + page.id + "/publish",
                      "POST",
                      {},
                    );
                    dirty.current = false;
                    setPage(p);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy
                  ? "Publishing…"
                  : page.status === "published"
                    ? "Update published surprise"
                    : "Publish my surprise ✨"}
              </button>
              {page.status === "published" && (
                <div className="publish-success">
                  <Check />
                  <h3>A little magic, ready to send.</h3>
                  <Link href={"/birthday/" + page.slug}>
                    Open your birthday page ↗
                  </Link>
                  <div className="button-row">
                    <button
                      className="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            location.origin + "/birthday/" + page.slug,
                          );
                          setStatus("Link copied");
                        } catch {
                          setError(
                            "Copy the link from your browser address bar.",
                          );
                        }
                      }}
                    >
                      <Copy size={16} />
                      Copy link
                    </button>
                    <button
                      className="outline"
                      onClick={async () => {
                        try {
                          setStatus(
                            await shareLink(
                              location.origin + "/birthday/" + page.slug,
                            ),
                          );
                        } catch {
                          setError("Unable to share. Use Copy link.");
                        }
                      }}
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {uploading && (
            <div role="status">
              Uploading… {progress}%<progress value={progress} max={100} />
            </div>
          )}
          <p role="alert" className="feedback">
            {error}
          </p>
          <div className="wizard-footer">
            <button
              className="text-link"
              disabled={step === 0 || busy || uploading}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {step < 7 ? (
              <button
                className="primary"
                disabled={busy || uploading}
                onClick={advance}
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <Link href="/dashboard">My surprises →</Link>
            )}
          </div>
        </section>
        <aside
          className="creator-preview"
          style={{
            background: getTheme(page.themeId).colors.background,
            color: getTheme(page.themeId).colors.ink,
          }}
        >
          {getTheme(page.themeId).image && (
            <Image
              src={getTheme(page.themeId).image!}
              fill
              alt="Selected theme"
              sizes="400px"
            />
          )}
          <div>
            <span className="eyebrow">
              A LITTLE SURPRISE, MADE JUST FOR YOU
            </span>
            <h2>
              For {page.recipientName || "someone special"} <em>♡</em>
            </h2>
            <p>{getTheme(page.themeId).name}</p>
            <span className="pill">YOUR WORLD IS TAKING SHAPE</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
