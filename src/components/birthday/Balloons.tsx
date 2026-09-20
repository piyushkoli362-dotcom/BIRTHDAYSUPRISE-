"use client";
import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { defaultReasons } from "../../data/reasons";
function Balloon({ text, index }: { text: string; index: number }) {
  const [popped, setPopped] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();
  return (
    <div
      className="balloon-slot"
      style={
        {
          "--balloon-delay": -index * 1.3 + "s",
          "--balloon-color": ["#f19ab8", "#cba3d8", "#edabb5", "#e5b777"][
            index % 4
          ],
        } as CSSProperties
      }
    >
      {!popped ? (
        <motion.button
          className="wish-balloon"
          aria-label={"Pop balloon " + (index + 1)}
          animate={offset}
          whileTap={{ scale: 0.92 }}
          onPointerMove={(e) => {
            if (reduced || e.pointerType === "touch") return;
            const r = e.currentTarget.getBoundingClientRect();
            setOffset({
              x: (e.clientX - r.left - r.width / 2) * 0.12,
              y: (e.clientY - r.top - r.height / 2) * 0.12,
            });
          }}
          onPointerLeave={() => setOffset({ x: 0, y: 0 })}
          onClick={() => setPopped(true)}
          exit={{ scale: 1.15, opacity: 0 }}
        >
          <span>♡</span>
          <small>
            A little wish
            <br />
            Tap to discover
          </small>
          <i />
        </motion.button>
      ) : (
        <motion.div
          className="balloon-message"
          role="status"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="pop-burst" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i
                key={i}
                style={{ "--angle": i * 45 + "deg" } as CSSProperties}
              />
            ))}
          </span>
          <span>✧</span>
          <p>{text}</p>
          <button className="text-link" onClick={() => setPopped(false)}>
            Float it again ↺
          </button>
        </motion.div>
      )}
    </div>
  );
}
export default function Balloons({ reasons }: { reasons: string[] }) {
  const items = reasons.filter(Boolean).length
    ? reasons.filter(Boolean)
    : defaultReasons;
  return (
    <div className="balloon-garden">
      {items.map((text, i) => (
        <Balloon key={i + text} text={text} index={i} />
      ))}
    </div>
  );
}
