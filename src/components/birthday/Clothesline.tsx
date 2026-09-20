"use client";
import { useState, type CSSProperties } from "react";
import Image from "next/image";
import type { Photo } from "../../types/birthday";
function PhotoImage({ photo }: { photo: Photo }) {
  const [error, setError] = useState(false);
  return error ? (
    <span className="polaroid-placeholder">
      ❀<small>A memory kept close</small>
    </span>
  ) : (
    <Image
      src={photo.imageUrl}
      alt={photo.caption || "A birthday memory"}
      fill
      unoptimized
      sizes="280px"
      onError={() => setError(true)}
    />
  );
}
export default function Clothesline({
  photos,
  onOpen,
}: {
  photos: Photo[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="clothesline-scene">
      <span className="clothesline-flower left" aria-hidden="true">
        ❀
      </span>
      <span className="clothesline-flower right" aria-hidden="true">
        ❀
      </span>
      <div
        className="clothesline-track"
        aria-label="Swipe through birthday memories"
        tabIndex={0}
      >
        {(photos.length
          ? photos
          : Array.from({ length: 6 }, (_, i) => ({
              id: String(i),
              caption: "A beautiful moment",
              imageUrl: "",
              order: i,
              date: "",
            }))
        ).map((p, i) => (
          <div
            className="hanging-memory"
            key={p.id}
            style={
              {
                "--tilt": [-6, 4, -3, 6, -4, 3][i % 6] + "deg",
                "--swing-delay": -i * 0.8 + "s",
              } as CSSProperties
            }
          >
            <span className="fairy-bulb" aria-hidden="true" />
            <span className="clothespin" aria-hidden="true" />
            {p.imageUrl ? (
              <button
                className="polaroid"
                onClick={() => onOpen(i)}
                aria-label={p.caption || "Open memory " + (i + 1)}
              >
                <div className="polaroid-image">
                  <PhotoImage photo={p} />
                </div>
                <span>{p.caption || "A moment to keep"}</span>
                {p.date && <small>{p.date}</small>}
              </button>
            ) : (
              <div className="polaroid">
                <div className="polaroid-image polaroid-placeholder">
                  ❀<small>Photo coming soon</small>
                </div>
                <span>A beautiful moment ♡</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="swipe-hint">
        A little line of lovely moments · swipe to explore ↔
      </p>
    </div>
  );
}
