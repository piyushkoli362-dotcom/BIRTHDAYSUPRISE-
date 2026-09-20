export type Photo = {
  id: string;
  imageUrl: string;
  caption: string;
  date?: string;
  memory?: string;
  order: number;
};
export type BirthdayPage = {
  id: string;
  userId: string;
  slug: string;
  recipientName: string;
  nickname: string;
  birthdayDate: string;
  senderName: string;
  personalMessage: string;
  themeId: string;
  musicUrl: string;
  photos: Photo[];
  reasons: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};
