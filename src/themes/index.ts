export interface BirthdayTheme {
  id: string;
  name: string;
  description: string;
  colors: { background: string; accent: string; ink: string };
  decorations: string;
  animations: "petals" | "stars" | "gold";
  image?: string;
}
export const themes: BirthdayTheme[] = [
  {
    id: "radha-krishna",
    name: "Radha–Krishna",
    description: "A little magic from moonlit Vrindavan.",
    colors: { background: "#FCE4EC", accent: "#8E2945", ink: "#612538" },
    decorations: "Lotus · Moonlight · Vrindavan",
    animations: "petals",
    image: "/themes/vrindavan-pink.webp",
  },
  {
    id: "dreamy-night",
    name: "Dreamy Night",
    description: "Written in the stars, just for them.",
    colors: { background: "#161a38", accent: "#bcb8fc", ink: "#f3f0ff" },
    decorations: "Stars · Moon · Clouds",
    animations: "stars",
  },
  {
    id: "romantic",
    name: "Romantic",
    description: "A letter wrapped in flowers and warmth.",
    colors: { background: "#321c28", accent: "#f0b4a6", ink: "#fff1ea" },
    decorations: "Flowers · Warm light",
    animations: "petals",
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    description: "A timeless celebration, beautifully understated.",
    colors: { background: "#141410", accent: "#ddbf70", ink: "#fffae9" },
    decorations: "Gold · Candlelight",
    animations: "gold",
  },
  {
    id: "cute-birthday",
    name: "Cute Birthday",
    description: "Little joys. Big smiles. All their favourite colours.",
    colors: { background: "#22362e", accent: "#f7d895", ink: "#fffcee" },
    decorations: "Confetti · Joy",
    animations: "petals",
  },
];
export const getTheme = (id: string) =>
  themes.find((t) => t.id === id) || themes[0];
