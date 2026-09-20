import { test, expect } from "@playwright/test";
import { birthdayCountdown } from "../src/lib/countdown";
test("countdown handles today, passed date and leap day", () => {
  expect(birthdayCountdown("2026-09-24", new Date(2026, 8, 24, 15)).today).toBe(
    true,
  );
  const past = birthdayCountdown("2000-01-01", new Date(2026, 8, 20));
  expect(past.days).toBeGreaterThan(0);
  expect(birthdayCountdown("2000-02-29", new Date(2027, 1, 28)).today).toBe(
    true,
  );
});
test("multi-user creator, uploads, privacy, publishing and interactions", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const token = Date.now().toString();
  await page.goto("/login");
  await page
    .getByLabel("Email address")
    .fill("creator-" + token + "@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("A-strong-test-password");
  await page.getByRole("button", { name: /Create account/ }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await page.request.get('/api/pages')).status()).toBe(401);
  await page.goto('/login');
  await page.getByRole('button', {name:'Already have an account? Sign in'}).click();
  await page.getByLabel('Email address').fill('creator-'+token+'@example.com');
  await page.getByLabel('Password', {exact:true}).fill('A-strong-test-password');
  await page.getByRole('button', {name:/^Sign in/}).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("link", { name: "Create new", exact: true }).click();
  await expect(page.getByLabel("Recipient name")).toBeVisible();
  await page.getByLabel("Recipient name").fill("Test Recipient " + token);
  await page.getByLabel("Your name").fill("Test Sender");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Birthday date").fill("2026-09-24");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Upload photos")
    .setInputFiles("public/themes/vrindavan-1.jpg");
  await expect(page.getByLabel("Caption 1")).toBeVisible({ timeout: 20000 });
  await page.getByLabel("Caption 1").fill("A real uploaded memory");
  await page.getByLabel("Photo date 1").fill("20 September 2026");
  await page.getByLabel("Memory note 1").fill("A saved memory note.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Your personal letter")
    .fill("This is a real test letter.\n\n**Happy birthday!**");
  await page.getByRole("button", { name: "Add a little message" }).click();
  await page.getByLabel("Little message 1").fill("A thoughtful little wish.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const wav = Buffer.alloc(11 * 1024 * 1024 + 44);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(wav.length - 44, 40);
  await page
    .getByLabel("Upload music")
    .setInputFiles({ name: "test.wav", mimeType: "audio/wav", buffer: wav });
  await expect(page.locator("audio")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Radha–Krishna/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open private preview" }).click();
  await expect(
    page.getByText("Private preview · Only you can see this"),
  ).toBeVisible();
  const id = page.url().split("/").pop()!;
  const owner = page.request;
  const saved = await (await owner.get("/api/pages/" + id)).json();
  expect(saved.photos).toHaveLength(1);
  expect(saved.photos[0].date).toBe("20 September 2026");
  expect(saved.photos[0].memory).toBe("A saved memory note.");
  expect(saved.personalMessage).toContain("real test letter");
  const anonymous = await browser.newContext();
  expect(
    (await anonymous.request.get("/birthday/" + saved.slug)).status(),
  ).toBe(404);
  expect((await anonymous.request.get(saved.photos[0].imageUrl)).status()).toBe(
    404,
  );
  const other = await browser.newContext();
  await other.request.post("/api/auth/signup", {
    data: {
      email: "other-" + token + "@example.com",
      password: "A-strong-test-password",
    },
  });
  expect(await (await other.request.get("/api/pages/" + id)).json()).toBeNull();
  expect(
    (
      await other.request.patch("/api/pages/" + id, {
        data: { recipientName: "Intruder" },
      })
    ).status(),
  ).toBe(404);
  expect((await other.request.delete("/api/pages/" + id)).status()).toBe(404);
  expect(
    (
      await owner.post("/api/pages/" + id + "/upload", {
        multipart: {
          file: {
            name: "bad.svg",
            mimeType: "image/svg+xml",
            buffer: Buffer.from('<svg onload="alert(1)"/>'),
          },
        },
      })
    ).status(),
  ).toBe(400);
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page.locator("#scene-1")).toBeVisible();
  await page.getByRole("button", { name: "Blow the Candles" }).click();
  await expect(
    page.getByText(
      "May every beautiful wish in your heart find its way to you.",
    ),
  ).toBeVisible();
  await expect(page.locator('.cake')).toHaveCount(0);
  // The balloon deliberately floats continuously; click its current hit area.
  await page.locator('#scene-3').scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: 'Pop balloon 1' }).click({force:true});
  await expect(page.getByText("A thoughtful little wish.")).toBeVisible();
  await page.locator('#scene-4').scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "A real uploaded memory" }).click({force:true});
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Open My Letter" }).click();
  await expect(page.getByText("This is a real test letter.")).toBeVisible();
  await expect(page.getByRole('dialog',{name:'Personal birthday letter'})).toBeVisible();
  await expect(page.getByText('**Happy birthday!**',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close Letter'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole("button", { name: "Play music" }).click();
  await expect(page.getByRole("button", { name: "Pause music" })).toBeVisible();
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute music", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to editing" }).click();
  await page.getByRole("button", { name: /08.*Publish/ }).click();
  await page.getByRole("button", { name: "Publish my surprise" }).click();
  await expect(page.getByText("A little magic, ready to send.")).toBeVisible();
  expect(
    (await anonymous.request.get("/birthday/" + saved.slug)).status(),
  ).toBe(200);
  expect((await anonymous.request.get(saved.photos[0].imageUrl)).status()).toBe(
    200,
  );
  const newPage = await (await other.request.post("/api/pages")).json();
  expect(
    (
      await other.request.patch("/api/pages/" + newPage.id, {
        data: { slug: saved.slug },
      })
    ).status(),
  ).toBe(409);
  const duplicate = await (
    await owner.post("/api/pages/" + id + "/duplicate", { data: {} })
  ).json();
  expect(duplicate.id).not.toBe(id);
  expect(duplicate.status).toBe("draft");
  expect(duplicate.photos).toHaveLength(1);
  expect(duplicate.photos[0].imageUrl).not.toBe(saved.photos[0].imageUrl);
  expect(duplicate.musicUrl).toContain(duplicate.id);
  expect(
    (await anonymous.request.get("/birthday/" + duplicate.slug)).status(),
  ).toBe(404);
  await owner.post("/api/pages/" + id + "/unpublish", { data: {} });
  expect(
    (await anonymous.request.get("/birthday/" + saved.slug)).status(),
  ).toBe(404);
  expect((await anonymous.request.get(saved.photos[0].imageUrl)).status()).toBe(
    404,
  );
  await owner.delete("/api/pages/" + duplicate.id);
  await owner.delete("/api/pages/" + id);
  await other.request.delete("/api/pages/" + newPage.id);
  await anonymous.close();
  await other.close();
  expect(errors).toEqual([]);
});
test("landing and demo fit mobile and desktop", async ({ page }) => {
  for (const width of [360, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", {waitUntil:"domcontentloaded"});
    await expect(
      page.getByRole("heading", { name: /Some people deserve/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/birthday/mahima", {waitUntil:"domcontentloaded"});
  await page.screenshot({ path: "test-results/demo-hero-mobile.png" });
  await page.getByRole("button", { name: "Begin" }).click();
  await page.locator("#scene-8").scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/demo-mobile.png" });
  await page.goto("/", {waitUntil:"domcontentloaded"});
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
});
