import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  authenticate,
  cloud,
  db,
  deletePage,
  listPages,
  readPage,
  requireUser,
  savePage,
  slugAvailable,
  supa,
  user,
} from "../../../lib/server";
import { cleanPage, slugify } from "../../../lib/validation";
import type { BirthdayPage } from "../../../types/birthday";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const storageKey = (owner: string, page: string, file: string) =>
  `${owner}/${page}/${file.endsWith(".webp") ? "photos" : "music"}/${file}`;
const attempts = new Map<string, { count: number; until: number }>();
async function boundedBody(req: Request, limit: number) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Request is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
async function jsonBody(req: NextRequest) {
  return JSON.parse((await boundedBody(req, 100000)).toString("utf8"));
}
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await params).path;
    const method = req.method;
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      if (origin && origin !== new URL(req.url).origin)
        return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }
    if (path[0] === "auth") {
      if (method === "GET")
        return NextResponse.json({
          user: await user(),
          mode: cloud ? "supabase" : "local",
        });
      if (path[1] === "logout") {
        const token = (await cookies()).get("birthday-token")?.value;
        if (!cloud && token) {
          const c = db();
          c.prepare("DELETE FROM sessions WHERE token=?").run(token);
          c.close();
        }
        if (cloud && token) {
          const client = await supa();
          const refresh = (await cookies()).get("birthday-refresh")?.value;
          if (refresh) {
            await client.auth.setSession({
              access_token: token,
              refresh_token: refresh,
            });
            await client.auth.signOut({ scope: "local" });
          }
        }
        (await cookies()).delete("birthday-refresh");
        (await cookies()).delete("birthday-token");
        return NextResponse.json({ ok: true });
      }
      const body = await jsonBody(req);
      const email = String(body.email || "")
        .toLowerCase()
        .trim();
      const key = email;
      const rate = attempts.get(key);
      if (rate && rate.until > Date.now() && rate.count >= 10)
        return NextResponse.json(
          { error: "Too many attempts. Try again in 15 minutes." },
          { status: 429 },
        );
      if (attempts.size > 10000) attempts.clear();
      attempts.set(key, {
        count: rate && rate.until > Date.now() ? rate.count + 1 : 1,
        until:
          rate && rate.until > Date.now() ? rate.until : Date.now() + 900000,
      });
      const result = await authenticate(
        email,
        String(body.password || ""),
        path[1] === "signup",
      );
      attempts.delete(key);
      return NextResponse.json(result);
    }
    if (path[0] === "assets" && method === "GET") {
      const [, id, filename] = path;
      if (!/^[a-f0-9-]+\.[a-z0-9]+$/.test(filename || ""))
        throw new Error("NOT_FOUND");
      let page: BirthdayPage | null = null;
      try {
        page = await readPage(id);
      } catch {}
      if (!page) {
        if (cloud) {
          const { data } = await (
            await supa()
          )
            .from("birthday_pages")
            .select("config")
            .eq("id", id)
            .eq("status", "published")
            .maybeSingle();
          page = data?.config || null;
        } else {
          const c = db();
          const row = c
            .prepare("SELECT data FROM pages WHERE id=? AND status='published'")
            .get(id);
          c.close();
          page = row ? JSON.parse(row.data as string) : null;
        }
      }
      if (!page) throw new Error("NOT_FOUND");
      if (cloud) {
        const { data, error } = await (
          await supa()
        ).storage
          .from("birthday-assets")
          .download(storageKey(page.userId, id, filename));
        if (error || !data) throw new Error("NOT_FOUND");
        return new NextResponse(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      const c = db();
      const row = c
        .prepare("SELECT mime,data FROM assets WHERE id=? AND page_id=?")
        .get(filename, id);
      c.close();
      if (!row) throw new Error("NOT_FOUND");
      return new NextResponse(new Uint8Array(row.data as Uint8Array), {
        headers: {
          "Content-Type": String(row.mime),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const u = await requireUser();
    if (path[0] === "pages") {
      if (method === "GET")
        return NextResponse.json(
          path[1] ? await readPage(path[1]) : await listPages(),
        );
      if (method === "DELETE") {
        await deletePage(path[1]);
        return NextResponse.json({ ok: true });
      }
      if (method === "POST" && !path[1]) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const p: BirthdayPage = {
          id,
          userId: u.id,
          slug: `surprise-${id.slice(0, 8)}`,
          recipientName: "",
          nickname: "",
          birthdayDate: "",
          senderName: "",
          personalMessage: "",
          themeId: "radha-krishna",
          musicUrl: "",
          photos: [],
          reasons: [],
          status: "draft",
          createdAt: now,
          updatedAt: now,
          publishedAt: null,
        };
        return NextResponse.json(await savePage(p));
      }
      const previous = await readPage(path[1]);
      if (!previous) throw new Error("NOT_FOUND");
      if (path[2] === "upload") {
        if (!req.headers.get('content-type')?.includes('multipart/form-data; boundary='))
          throw new Error('Choose a file and retry the upload. Multipart boundary is missing.');
        await boundedBody(req.clone(), 21 * 1024 * 1024);
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw new Error("Choose a file.");
        if (file.size > 20 * 1024 * 1024)
          throw new Error("Maximum file size is 20 MB.");
        let bytes = Buffer.from(await file.arrayBuffer());
        let ext = "";
        let mime = "";
        const image = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        );
        if (image) {
          if (file.size > 10 * 1024 * 1024)
            throw new Error("Photos must be below 10 MB.");
          bytes = await sharp(bytes, { limitInputPixels: 40000000 })
            .rotate()
            .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 84 })
            .toBuffer();
          ext = "webp";
          mime = "image/webp";
        } else {
          const head = bytes.subarray(0, 12);
          if (
            head.subarray(0, 3).toString() === "ID3" ||
            (bytes[0] === 255 && (bytes[1] & 224) === 224)
          ) {
            ext = "mp3";
            mime = "audio/mpeg";
          } else if (
            head.subarray(0, 4).toString() === "RIFF" &&
            head.subarray(8, 12).toString() === "WAVE"
          ) {
            ext = "wav";
            mime = "audio/wav";
          } else if (
            head.subarray(4, 8).toString() === "ftyp" &&
            /M4A|mp4/.test(head.subarray(8, 12).toString())
          ) {
            ext = "m4a";
            mime = "audio/mp4";
          } else throw new Error("Use JPEG, PNG, WebP, MP3, WAV or M4A files.");
        }
        const filename = `${randomUUID()}.${ext}`;
        if (cloud) {
          const { error } = await (
            await supa()
          ).storage
            .from("birthday-assets")
            .upload(storageKey(u.id, previous.id, filename), bytes, {
              contentType: mime,
            });
          if (error) throw error;
        } else {
          const c = db();
          const total = c
            .prepare(
              "SELECT COALESCE(SUM(length(data)),0) AS n FROM assets WHERE user_id=?",
            )
            .get(u.id);
          if (Number(total?.n) > 200 * 1024 * 1024) {
            c.close();
            throw new Error("Local account upload limit reached (200 MB).");
          }
          c.prepare("INSERT INTO assets VALUES(?,?,?,?,?)").run(
            filename,
            previous.id,
            u.id,
            mime,
            bytes,
          );
          c.close();
        }
        return NextResponse.json({
          url: `/api/assets/${previous.id}/${filename}`,
          id: filename,
          type: image ? "photo" : "music",
        });
      }
      if (path[2] === "duplicate") {
        const id = randomUUID();
        const now = new Date().toISOString();
        const p: BirthdayPage = {
          ...previous,
          id,
          slug: `${slugify(previous.recipientName).slice(0, 50).replace(/-$/, '')}-${id.slice(0, 6)}`,
          photos: [],
          musicUrl: "",
          status: "draft",
          createdAt: now,
          updatedAt: now,
          publishedAt: null,
        };
        await savePage(p);
        try {
          const copy = async (url: string) => {
            const old = url.split("/").pop()!;
            const filename = `${randomUUID()}.${old.split(".").pop()}`;
            if (cloud) {
              const client = await supa();
              const { data, error } = await client.storage
                .from("birthday-assets")
                .download(storageKey(u.id, previous.id, old));
              if (error || !data)
                throw new Error("Could not copy uploaded media.");
              const uploaded = await client.storage
                .from("birthday-assets")
                .upload(storageKey(u.id, id, filename), data, {
                  contentType: data.type,
                });
              if (uploaded.error) throw uploaded.error;
            } else {
              const c = db();
              try {
                const r = c
                  .prepare(
                    "SELECT mime,data FROM assets WHERE id=? AND page_id=? AND user_id=?",
                  )
                  .get(old, previous.id, u.id);
                if (!r) throw new Error("Could not copy uploaded media.");
                c.prepare("INSERT INTO assets VALUES(?,?,?,?,?)").run(
                  filename,
                  id,
                  u.id,
                  String(r.mime),
                  r.data as Uint8Array,
                );
              } finally {
                c.close();
              }
            }
            return { id: filename, url: `/api/assets/${id}/${filename}` };
          };
          for (const photo of previous.photos) {
            const asset = await copy(photo.imageUrl);
            p.photos.push({ ...photo, id: asset.id, imageUrl: asset.url });
          }
          if (previous.musicUrl)
            p.musicUrl = (await copy(previous.musicUrl)).url;
          return NextResponse.json(await savePage(p));
        } catch (e) {
          await deletePage(id);
          throw e;
        }
      }
      const body = await jsonBody(req);
      let p = cleanPage(body, previous);
      if (body.autoSlug) {
        const base = slugify(p.recipientName).slice(0, 50).replace(/-$/, '');
        let slug = base;
        let n = 2;
        while (!(await slugAvailable(slug, p.id))) slug = `${base}-${n++}`;
        p = { ...p, slug };
      }
      if (!(await slugAvailable(p.slug, p.id)))
        return NextResponse.json(
          { error: "This link is already taken. Choose another." },
          { status: 409 },
        );
      if (path[2] === "publish") {
        if (!p.recipientName || !p.birthdayDate)
          throw new Error(
            "Add a recipient name and birthday before publishing.",
          );
        p.status = "published";
        p.publishedAt = new Date().toISOString();
      }
      if (path[2] === "unpublish") p.status = "draft";
      return NextResponse.json(await savePage(p));
    }
    throw new Error("NOT_FOUND");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json(
      {
        error:
          message === "UNAUTHORIZED"
            ? "Please sign in."
            : message === "NOT_FOUND"
              ? "Page not found."
              : message,
      },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "NOT_FOUND"
              ? 404
              : 400,
      },
    );
  }
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
