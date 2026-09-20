"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
function LetterModal({
  name,
  message,
  onClose,
}: {
  name: string;
  message: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const buttons =
          dialog.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        e.preventDefault();
        buttons[0].focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return createPortal(
    <motion.div
      className="letter-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialog}
        className="stationery"
        role="dialog"
        aria-modal="true"
        aria-label="Personal birthday letter"
        initial={{ opacity: 0, rotateX: -30, y: 60 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        exit={{ opacity: 0, scaleY: 0.4, y: 60 }}
        transition={{ duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-letter" onClick={onClose}>
          Close Letter ×
        </button>
        <div className="stationery-scroll">
          <span className="stationery-flower" aria-hidden="true">
            ❀
          </span>
          <h3>For {name} ♡</h3>
          <div className="saved-letter">
            {(
              message ||
              "Happy birthday! Wishing you a beautiful day and a year filled with joy."
            )
              .split("\n")
              .map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.09, 1.5) }}
                  style={{ minHeight: "1.8em", whiteSpace: "pre-wrap" }}
                >
                  {line}
                </motion.div>
              ))}
          </div>
          <span className="letter-end" aria-hidden="true">
            ❀ — ♡ — ❀
          </span>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
export default function LetterEnvelope({
  message,
  name,
}: {
  message: string;
  name: string;
}) {
  const [stage, setStage] = useState(0);
  const [modal, setModal] = useState(false);
  const reduced = useReducedMotion();
  const close = useRef(() => {});
  close.current = () => {
    setModal(false);
    setStage(0);
  };
  const stableClose = useRef(() => close.current()).current;
  useEffect(() => {
    if (stage !== 1) return;
    const timers = [
      setTimeout(() => setStage(2), reduced ? 5 : 350),
      setTimeout(() => setStage(3), reduced ? 10 : 700),
      setTimeout(() => setStage(4), reduced ? 15 : 1100),
      setTimeout(() => setModal(true), reduced ? 20 : 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stage === 0, reduced]);
  return (
    <>
      <p className="letter-invitation">
        There is something I wanted to tell you…
      </p>
      <div className={"physical-envelope envelope-stage-" + stage}>
        <div className="envelope-paper-slip">For {name} ♡</div>
        <div className="physical-flap" />
        <div className="envelope-pocket" />
        <span className="envelope-flower" aria-hidden="true">
          ❀
        </span>
        <span className="wax-seal" aria-hidden="true">
          ♡
        </span>
        <button
          className="open-envelope primary"
          disabled={stage !== 0}
          onClick={() => setStage(1)}
        >
          {stage ? "Opening your letter…" : "Open My Letter 💌"}
        </button>
      </div>
      <AnimatePresence>
        {modal && (
          <LetterModal name={name} message={message} onClose={stableClose} />
        )}
      </AnimatePresence>
    </>
  );
}
