"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Photo } from "../../types/birthday";
export default function Lightbox({
  photos,
  start,
  onClose,
}: {
  photos: Photo[];
  start: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const box = useRef<HTMLDivElement>(null);
  const touch = useRef(0);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.querySelector("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i + photos.length - 1) % photos.length);
      if (e.key === "Tab") {
        const buttons =
          box.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose, photos.length]);
  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Memory viewer"
      ref={box}
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(diff) > 50)
          setIndex(
            (i) => (i + (diff < 0 ? 1 : photos.length - 1)) % photos.length,
          );
      }}
    >
      <button
        className="lb-close icon-btn"
        onClick={onClose}
        aria-label="Close photo"
      >
        <X />
      </button>
      <button
        className="icon-btn"
        aria-label="Previous photo"
        onClick={(e) => {
          e.stopPropagation();
          setIndex((i) => (i + photos.length - 1) % photos.length);
        }}
      >
        <ChevronLeft />
      </button>
      <div className="lb-image" onClick={(e) => e.stopPropagation()}>
        <Image
          src={photos[index].imageUrl}
          fill
          unoptimized
          alt={photos[index].caption || "Birthday memory"}
          sizes="90vw"
        />
        <p>
          {photos[index].caption}
          {photos[index].date && <small>{photos[index].date}</small>}
          {photos[index].memory && (
            <span className="lightbox-memory">{photos[index].memory}</span>
          )}
          <small>
            {index + 1} / {photos.length}
          </small>
        </p>
      </div>
      <button
        className="icon-btn"
        aria-label="Next photo"
        onClick={(e) => {
          e.stopPropagation();
          setIndex((i) => (i + 1) % photos.length);
        }}
      >
        <ChevronRight />
      </button>
    </div>,
    document.body,
  );
}
