export type Photo = {
  src: string;
  caption: string;
  date: string;
  description?: string;
};

// Replace these image paths with files placed in public/photos. The cards gracefully
// show an editorial placeholder until an image has been added.
export const photos: Photo[] = [
  {
    src: "/photos/mahima-01.jpg",
    caption: "A beautiful moment",
    date: "Your date here",
    description: "Add a small note about this photograph.",
  },
  {
    src: "/photos/mahima-02.jpg",
    caption: "The way you light up a room",
    date: "Your date here",
  },
  {
    src: "/photos/mahima-03.jpg",
    caption: "A little piece of forever",
    date: "Your date here",
  },
  {
    src: "/photos/mahima-04.jpg",
    caption: "One of my favourite views",
    date: "Your date here",
  },
  {
    src: "/photos/mahima-05.jpg",
    caption: "Kept close",
    date: "Your date here",
  },
  {
    src: "/photos/mahima-06.jpg",
    caption: "Simply you",
    date: "Your date here",
  },
  {
    src: "/photos/mahima-07.jpg",
    caption: "A moment to revisit",
    date: "Your date here",
  },
  {
    src: "/photos/mahima-08.jpg",
    caption: "Always worth remembering",
    date: "Your date here",
  },
];
