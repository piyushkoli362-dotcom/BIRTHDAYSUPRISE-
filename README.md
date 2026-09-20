# Little Wishes

A multi-user birthday experience platform built in the existing Next.js project.

## Run locally
Use Node.js 24 (the local database uses Node's SQLite module).

```sh
npm install
npm run dev
```

Open http://localhost:3000. Create your own account at /login. No default password or account is shipped.
The local fallback keeps accounts, hashed passwords, sessions, birthday configurations and uploaded bytes in `.local/birthday.sqlite`. It is a development adapter, not a shared production database. Restarting the server preserves data.

## Routes
- / — landing page and five theme previews
- /login — email/password sign-up and sign-in
- /create and /dashboard/create — creation wizard
- /dashboard — your own pages; edit, preview, publish, unpublish, duplicate, delete, copy and share
- /dashboard/[id]/edit — editor with debounced, serialized auto-save
- /preview/[id] and /dashboard/[id]/preview — owner-only preview
- /birthday/[slug] — published standalone experience
- /birthday/mahima — clearly labeled sample page, configured only in src/data/demo.ts

## Connect Supabase before hosting publicly
1. Create a Supabase project and run `supabase/schema.sql`, then `supabase/vercel-uploads.sql` in its SQL editor.
2. Configure email/password authentication and your Auth Site URL. With email confirmation enabled, confirm the email before signing in.
3. Set server environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the publishable/anon key, never a service-role key).
4. Remove `ALLOW_LOCAL_DB=true` on the public host. The application refuses to use SQLite in production without that explicit development override.
5. Run `npm run build` and `npm start` on a Node.js host with HTTPS.

The Supabase adapter is implemented but has not been exercised against a live project because no project credentials were supplied. Local and cloud providers share the same repository contract. Cloud access uses the user's JWT, PostgreSQL RLS and a private Storage bucket; it does not bypass RLS with an admin key. HTTP-only cookies and the Next.js proxy maintain the session.

Supabase stores page configuration atomically as JSONB, with indexed ownership and unique slug columns. Common configuration fields have generated columns. `birthday_photos` and `birthday_reasons` are RLS-respecting ordered views over that document. This avoids partial saves and makes the content model extensible. Themes are seeded in the themes table.

## Media
- JPEG, PNG and WebP input, up to 10 MB per image; decoded and re-encoded server-side to WebP at a maximum of 1600 px.
- Up to 20 selected photos; captions and reorder controls.
- MP3, WAV and M4A input, up to 20 MB; file signatures checked.
- Storage path: birthday-assets/{userId}/{pageId}/photos/ or music/.
- Draft media is private. Published media is served through an authorized route; unpublishing blocks subsequent anonymous media requests.
- No external arbitrary image URLs are accepted in user data.
- Removing media from an editor removes the reference. Unreferenced upload bytes are retained until the page is deleted, allowing in-flight auto-save/retry recovery. Deleting a page cleans the page's media.
- Duplication copies selected media into the new page's private folder.
- Local account upload quota: 200 MB. Configure Storage/project quotas and edge rate limiting for the expected production traffic.
- Cloud uploads go directly to private staging storage with an owner-authorized signed upload URL. The server then validates the bytes, re-encodes photos, moves valid media into the private asset bucket, and removes staging data. Local uploads continue using multipart requests.
- Cloud playback uses 60-second signed redirects, avoiding Vercel's response-size limit. Unpublishing prevents new signed URLs; already-issued URLs may remain usable for up to 60 seconds.
- Interrupted staging uploads may remain until cleaned up by the project operator; monitor the free plan's Storage quota.

## Personalization and themes
Birthday data is in src/types/birthday.ts. Everything shown to recipients comes from the page configuration.
Theme registry: src/themes/index.ts. The engine reads colors, decoration descriptions, visual assets and theme IDs from the registry. New themes can be added there; signature scene rendering lives in src/components/birthday/Experience.tsx.
Your four supplied Radha–Krishna photos were copied to public/themes/vrindavan-1.jpg through vrindavan-4.jpg. The first two are used in the flagship experience.

Countdown uses the recipient browser's local date/time, repeats annually, and shows a birthday greeting for the whole birthday day. February 29 uses February 28 in non-leap years. The stored year is not displayed as an age.

## Verification
```sh
npm run lint
npm test
npm run build
```
Browser tests require a running local server. Install Chromium with `npx playwright install chromium --no-shell`. Tests use full Chromium in headless mode. Set TEST_BASE_URL to test another local port.

Tests cover signup, owned creation, photo/audio uploads, draft persistence, owner-only preview, cross-user edit/delete rejection, anonymous draft/media rejection, unsupported uploads, publishing, slug conflicts, duplication, unpublishing, countdown, cake, letter, music, lightbox and responsive widths 360/390/430/768/1440.

## Deployment boundary
The local server is not an internet deployment. Public links work while this server is reachable; internet sharing requires a deployed host and Supabase. Payments, analytics, custom domains and plans are intentionally not implemented. No claims of tested cloud deployment or load capacity are made.
