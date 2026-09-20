import type { BirthdayPage } from "../types/birthday";
import { themes } from "../themes";
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "birthday";
export function cleanPage(
  input: Record<string, unknown>,
  previous: BirthdayPage,
): BirthdayPage {
  const text = (key: string, max: number) => {
    const v = input[key];
    if (v === undefined)
      return String(previous[key as keyof BirthdayPage] || "");
    if (typeof v !== "string" || v.length > max)
      throw new Error(`${key} is too long or invalid.`);
    return key === "personalMessage" ? v : v.trim();
  };
  const p = {
    ...previous,
    recipientName: text("recipientName", 80),
    nickname: text("nickname", 80),
    senderName: text("senderName", 80),
    birthdayDate: text("birthdayDate", 10),
    personalMessage: text("personalMessage", 12000),
    themeId: text("themeId", 40),
    slug: text("slug", 60),
    musicUrl: text("musicUrl", 500),
    updatedAt: new Date().toISOString(),
  };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
    throw new Error(
      "Use lowercase letters, numbers and single hyphens in the link.",
    );
  if (
    p.birthdayDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(p.birthdayDate) ||
      Number.isNaN(Date.parse(p.birthdayDate)) ||
      new Date(p.birthdayDate).toISOString().slice(0, 10) !== p.birthdayDate)
  )
    throw new Error("Enter a valid birthday date.");
  if (!themes.some((t) => t.id === p.themeId))
    throw new Error("Choose an available theme.");
  const asset = (url: string) => !url || url.startsWith(`/api/assets/${p.id}/`);
  if (!asset(p.musicUrl)) throw new Error("Invalid music asset.");
  if (input.photos !== undefined) {
    if (!Array.isArray(input.photos) || input.photos.length > 20)
      throw new Error("Up to 20 photos are supported.");
    p.photos = input.photos.map((x, i) => {
      if (
        !x ||
        typeof x.id !== "string" ||
        typeof x.imageUrl !== "string" ||
        !asset(x.imageUrl) ||
        !x.imageUrl ||
        typeof x.caption !== "string" ||
        x.caption.length > 300
      )
        throw new Error("Invalid photo.");
      if (
        x.date !== undefined &&
        (typeof x.date !== "string" || x.date.length > 40)
      )
        throw new Error("Invalid photo date.");
      if (
        x.memory !== undefined &&
        (typeof x.memory !== "string" || x.memory.length > 1000)
      )
        throw new Error("Memory notes must be under 1000 characters.");
      return {
        id: x.id,
        imageUrl: x.imageUrl,
        caption: x.caption,
        date: x.date || "",
        memory: x.memory || "",
        order: i,
      };
    });
  }
  if (input.reasons !== undefined) {
    if (
      !Array.isArray(input.reasons) ||
      input.reasons.length > 20 ||
      input.reasons.some((x) => typeof x !== "string" || x.length > 300)
    )
      throw new Error("Use up to 20 short messages (300 characters each).");
    p.reasons = input.reasons as string[];
  }
  return p;
}
