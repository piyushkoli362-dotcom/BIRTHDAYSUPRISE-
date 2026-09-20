import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { BirthdayPage } from "../types/birthday";
export const cloud = !!(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
);
export function db() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_LOCAL_DB !== "true"
  )
    throw new Error("Configure Supabase before production deployment.");
  mkdirSync(join(process.cwd(), ".local"), { recursive: true });
  const db = new DatabaseSync(join(process.cwd(), ".local", "birthday.sqlite"));
  db.exec(
    `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,expires INTEGER); CREATE TABLE IF NOT EXISTS pages(id TEXT PRIMARY KEY,user_id TEXT,slug TEXT UNIQUE,status TEXT,data TEXT); CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,page_id TEXT,user_id TEXT,mime TEXT,data BLOB);`,
  );
  return db;
}
export async function supa() {
  const token = (await cookies()).get("birthday-token")?.value;
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    },
  );
}
export async function user() {
  const token = (await cookies()).get("birthday-token")?.value;
  if (!token) return null;
  if (cloud) {
    const { data } = await (await supa()).auth.getUser(token);
    return data.user ? { id: data.user.id, email: data.user.email! } : null;
  }
  const c = db();
  try {
    return (
      (c
        .prepare(
          "SELECT users.id,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?",
        )
        .get(token, Date.now()) as { id: string; email: string } | undefined) ||
      null
    );
  } finally {
    c.close();
  }
}
export async function requireUser() {
  const u = await user();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}
export async function authenticate(
  email: string,
  password: string,
  signup: boolean,
) {
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 10 ||
    password.length > 128
  )
    throw new Error("Use a valid email and a password of 10–128 characters.");
  let token: string;
  let age = 60 * 60 * 24 * 7;
  if (cloud) {
    const client = await supa();
    const { data, error } = signup
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === 'over_email_send_rate_limit' || /email rate limit/i.test(error.message))
        throw new Error('Confirmation emails are temporarily unavailable. Existing users can use Sign in. New accounts need the site email service to be configured; repeated signup attempts will not help.');
      if (error.code === 'over_request_rate_limit' || error.status === 429)
        throw new Error('Too many authentication attempts. Please wait before trying again.');
      if (error.code === 'email_not_confirmed')
        throw new Error('Please confirm your email before signing in. If no email arrived, contact the site owner; creating the account again will not fix delivery.');
      if (error.code === 'invalid_credentials')
        throw new Error('Incorrect email or password. Use Create account only if you are new here.');
      throw new Error(error.message);
    }
    if (!data.session) return { confirmation: true };
    token = data.session.access_token;
    age = 60 * 60 * 24 * 30;
    (await cookies()).set("birthday-refresh", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: age,
    });
  } else {
    const c = db();
    try {
      let row = c.prepare("SELECT * FROM users WHERE email=?").get(email) as
        { id: string; password: string } | undefined;
      if (signup) {
        if (row) throw new Error("Unable to create account with this email.");
        const salt = randomBytes(16).toString("hex");
        const id = randomUUID();
        c.prepare("INSERT INTO users VALUES(?,?,?)").run(
          id,
          email,
          `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
        );
        row = { id, password: "" };
      } else {
        const [salt, hash] = (row?.password || "missing:").split(":");
        const derived = scryptSync(password, salt, 64);
        if (
          !row ||
          !hash ||
          !timingSafeEqual(derived, Buffer.from(hash, "hex"))
        )
          throw new Error("Incorrect email or password.");
      }
      token = randomBytes(32).toString("hex");
      c.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
        token,
        row!.id,
        Date.now() + age * 1000,
      );
    } finally {
      c.close();
    }
  }
  (await cookies()).set("birthday-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: age,
  });
  return { ok: true };
}
export async function listPages() {
  const u = await requireUser();
  if (cloud) {
    const { data, error } = await (
      await supa()
    )
      .from("birthday_pages")
      .select("config")
      .eq("user_id", u.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map((x) => x.config as BirthdayPage);
  }
  const c = db();
  try {
    return c
      .prepare("SELECT data FROM pages WHERE user_id=? ORDER BY rowid DESC")
      .all(u.id)
      .map((x) => JSON.parse(x.data as string) as BirthdayPage);
  } finally {
    c.close();
  }
}
export async function readPage(
  value: string,
  publicOnly = false,
): Promise<BirthdayPage | null> {
  if (cloud) {
    let q = (await supa())
      .from("birthday_pages")
      .select("config")
      .eq(publicOnly ? "slug" : "id", value);
    if (publicOnly) q = q.eq("status", "published");
    else q = q.eq("user_id", (await requireUser()).id);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data?.config || null;
  }
  const u = publicOnly ? null : await requireUser();
  const c = db();
  try {
    const row = publicOnly
      ? c
          .prepare("SELECT data FROM pages WHERE slug=? AND status='published'")
          .get(value)
      : c
          .prepare("SELECT data FROM pages WHERE id=? AND user_id=?")
          .get(value, u!.id);
    return row ? JSON.parse(row.data as string) : null;
  } finally {
    c.close();
  }
}
export async function slugAvailable(slug: string, id: string) {
  if (slug === "mahima") return false;
  if (cloud) {
    const { data, error } = await (
      await supa()
    ).rpc("birthday_slug_available", { requested: slug, page_id: id });
    if (error) throw error;
    return !!data;
  }
  const c = db();
  try {
    return !c
      .prepare("SELECT id FROM pages WHERE slug=? AND id<>?")
      .get(slug, id);
  } finally {
    c.close();
  }
}
export async function savePage(p: BirthdayPage) {
  const u = await requireUser();
  if (p.userId !== u.id) throw new Error("UNAUTHORIZED");
  if (cloud) {
    const { error } = await (
      await supa()
    )
      .from("birthday_pages")
      .upsert({
        id: p.id,
        user_id: u.id,
        slug: p.slug,
        status: p.status,
        config: p,
        updated_at: p.updatedAt,
      });
    if (error)
      throw new Error(
        error.code === "23505" ? "That link is already taken." : error.message,
      );
  } else {
    const c = db();
    try {
      c.prepare(
        "INSERT INTO pages VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,data=excluded.data WHERE pages.user_id=excluded.user_id",
      ).run(p.id, u.id, p.slug, p.status, JSON.stringify(p));
    } finally {
      c.close();
    }
  }
  return p;
}
export async function deletePage(id: string) {
  const p = await readPage(id);
  if (!p) throw new Error("NOT_FOUND");
  if (cloud) {
    const storage = (await supa()).storage.from("birthday-assets");
    for (const folder of ["photos", "music"]) {
      const prefix = `${p.userId}/${id}/${folder}`;
      // Delete in batches so retries also clean uploads removed from the editor.
      for (;;) {
        const { data, error } = await storage.list(prefix, { limit: 100 });
        if (error) throw error;
        if (!data?.length) break;
        const removed = await storage.remove(data.map((file) => `${prefix}/${file.name}`));
        if (removed.error) throw removed.error;
      }
    }
    const { error } = await (
      await supa()
    )
      .from("birthday_pages")
      .delete()
      .eq("id", id)
      .eq("user_id", p.userId);
    if (error) throw error;
  } else {
    const c = db();
    try {
      c.prepare("DELETE FROM assets WHERE page_id=?").run(id);
      c.prepare("DELETE FROM pages WHERE id=? AND user_id=?").run(id, p.userId);
    } finally {
      c.close();
    }
  }
}
