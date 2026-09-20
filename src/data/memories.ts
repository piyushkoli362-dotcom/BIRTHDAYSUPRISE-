export type Memory = {
  date: string;
  title: string;
  description: string;
  image?: string;
};

// These are intentionally editable placeholders — replace them with your real memories.
export const memories: Memory[] = [
  {
    date: "DD Month YYYY",
    title: "The Beginning",
    description: "[Write how your story began here.]",
    image: "/photos/memory-01.jpg",
  },
  {
    date: "DD Month YYYY",
    title: "A Random Moment",
    description: "[Write about a small moment that still makes you smile.]",
  },
  {
    date: "DD Month YYYY",
    title: "A Beautiful Memory",
    description: "[Write a memory you never want to forget.]",
    image: "/photos/memory-03.jpg",
  },
  {
    date: "24 September 2026",
    title: "Today",
    description: "[Write what you hope this new year brings for Mahima.]",
  },
];
