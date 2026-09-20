"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
export default function WishCake() {
  const [phase, setPhase] = useState<"lit" | "blowing" | "out" | "gone">("lit");
  const reduced = useReducedMotion();
  useEffect(() => {
    if (phase === "blowing") {
      const t = setTimeout(() => setPhase("out"), reduced ? 20 : 500);
      return () => clearTimeout(t);
    }
    if (phase === "out") {
      const t = setTimeout(() => setPhase("gone"), reduced ? 50 : 2000);
      return () => clearTimeout(t);
    }
  }, [phase, reduced]);
  return (
    <div className={"cake-scene phase-" + phase}>
      <div className="cake-stage">
        {phase !== "gone" && (
          <motion.div
            className={"cake " + (phase === "out" ? "wished" : "")}
            aria-label={
              phase === "lit"
                ? "Birthday cake with five lit candles"
                : "Candles extinguishing"
            }
            animate={
              phase === "out"
                ? { y: 160, opacity: 0, scale: 0.85 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            transition={{
              delay: reduced ? 0 : 0.5,
              duration: reduced ? 0 : 1.35,
            }}
          >
            <div className="candles">
              {[0, 1, 2, 3, 4].map((i) => (
                <span className="candle" key={i}>
                  <i />
                  <b />
                </span>
              ))}
            </div>
            <div className="icing" />
            <div className="cake-tier" />
            <div className="cake-base" />
            <div className="cake-flowers" aria-hidden="true">
              ❀ · ❀ · ❀
            </div>
            <div className="cake-plate" />
          </motion.div>
        )}
      </div>
      {phase === "lit" ? (
        <button className="primary" onClick={() => setPhase("blowing")}>
          Blow the Candles 🎂
        </button>
      ) : phase === "gone" ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="wish-arrived"
          role="status"
        >
          <span>✧</span>
          <h3>Your wish is on its way… ✨</h3>
          <p>May every beautiful wish in your heart find its way to you.</p>
          <a className="text-link" href="#scene-7">
            A little blessing awaits ↓
          </a>
        </motion.div>
      ) : (
        <p role="status">Close your eyes. Keep your wish close.</p>
      )}
      {(phase === "out" || phase === "gone") && (
        <div className="wish-celebration" aria-hidden="true">
          <div className="confetti">
            {Array.from({ length: 20 }, (_, i) => (
              <i
                key={i}
                style={
                  { "--i": i, left: ((i * 17) % 100) + "%" } as CSSProperties
                }
              />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rising-balloon"
              style={{ left: 15 + i * 32 + "%", animationDelay: i * 0.2 + "s" }}
            >
              ♡
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
