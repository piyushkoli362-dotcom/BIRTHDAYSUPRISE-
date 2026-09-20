"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "framer-motion";
import { ArrowDown, Music2, Pause, Volume2, VolumeX } from "lucide-react";
import type { BirthdayPage } from "../../types/birthday";
import { getTheme } from "../../themes";
import { birthdayCountdown } from "../../lib/countdown";
import Cake from "./WishCake";
import Reasons from "./Balloons";
import Letter from "./LetterEnvelope";
import Clothesline from "./Clothesline";
const Lightbox = dynamic(() => import("./Lightbox"), { ssr: false });
function Scene({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="birthday-scene">
      <motion.div
        className="scene-inner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8 }}
      >
        <span className="eyebrow">{label}</span>
        {title && <h2>{title}</h2>}
        {children}
      </motion.div>
    </section>
  );
}
function Countdown({ date }: { date: string }) {
  const [value, setValue] = useState<ReturnType<
    typeof birthdayCountdown
  > | null>(null);
  useEffect(() => {
    setValue(birthdayCountdown(date));
    const t = setInterval(() => setValue(birthdayCountdown(date)), 1000);
    return () => clearInterval(t);
  }, [date]);
  if (value?.today)
    return <h3 className="today">Today is your special day ❤️</h3>;
  return (
    <div className="countdown" aria-label="Time until next birthday">
      {(["days", "hours", "minutes", "seconds"] as const).map((k) => (
        <div key={k}>
          <strong>{value ? String(value[k]).padStart(2, "0") : "—"}</strong>
          <span>{k}</span>
        </div>
      ))}
    </div>
  );
}
function Music({ url }: { url: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  if (error) return null;
  return (
    <div className={"music-control " + (playing ? "is-playing" : "")}>
      <audio
        src={url}
        ref={audio}
        loop
        preload="none"
        onError={() => setError(true)}
      />
      <button
        aria-label={playing ? "Pause music" : "Play music"}
        onClick={async () => {
          if (!audio.current) return;
          if (playing) {
            audio.current.pause();
            setPlaying(false);
          } else {
            try {
              await audio.current.play();
              setPlaying(true);
            } catch {
              setError(true);
            }
          }
        }}
      >
        {playing ? <Pause size={17} /> : <Music2 size={17} />}
        <span>{playing ? "Our song is playing" : "Play Our Song"}</span>
        {playing && (
          <i className="equalizer" aria-hidden="true">
            ▂ ▆ ▃
          </i>
        )}
      </button>
      <button
        aria-label={muted ? "Unmute music" : "Mute music"}
        onClick={() => {
          if (audio.current) audio.current.muted = !muted;
          setMuted(!muted);
        }}
      >
        {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
    </div>
  );
}
export default function Experience({ page }: { page: BirthdayPage }) {
  const theme = getTheme(page.themeId);
  const [lightEffects, setLightEffects] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    setLightEffects(
      navigator.hardwareConcurrency <= 4 ||
        (nav.deviceMemory || 8) <= 4 ||
        !!nav.connection?.saveData,
    );
  }, []);
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(0);
  const [photo, setPhoto] = useState<number | null>(null);
  const close = useCallback(() => setPhoto(null), []);
  const labels = [
    "Intro",
    "Special day",
    "Countdown",
    "Little things",
    "Memories",
    "Letter",
    "Wish",
    "A little world",
    "Birthday",
  ];
  useEffect(() => {
    if (!started) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(Number(e.target.id.split("-")[1]));
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll(".birthday-scene").forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [started]);
  return (
    <MotionConfig reducedMotion={lightEffects ? "always" : "user"}>
      <main
        className={
          "experience experience-" +
          theme.id +
          (lightEffects ? " light-effects" : "")
        }
        style={
          {
            "--scene-bg": theme.colors.background,
            "--accent": theme.colors.accent,
            "--scene-ink": theme.colors.ink,
          } as CSSProperties
        }
      >
        <div className="fireflies" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <i
              key={i}
              style={{
                left: ((i * 29) % 100) + "%",
                top: ((i * 17) % 100) + "%",
                animationDelay: -i + "s",
              }}
            />
          ))}
        </div>
        <section className="birthday-intro" id="scene-0">
          {theme.image && (
            <Image
              src={theme.image}
              fill
              priority
              alt="Radha and Krishna in moonlit Vrindavan"
              sizes="100vw"
            />
          )}
          <div className="intro-shade" />
          <div className="hero-petals" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: ((i * 13) % 100) + "%",
                  animationDelay: -i * 1.3 + "s",
                }}
              />
            ))}
          </div>
          <div className="moon-halo" aria-hidden="true" />
          <div className="hanging-lanterns" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="intro-content">
            <span className="eyebrow">
              A LITTLE SURPRISE · MADE JUST FOR YOU
            </span>
            <p>A little world made just for you…</p>
            <h1>
              For {page.recipientName} <em>♡</em>
            </h1>
            <span className="gold-rule" />
            <button
              className="primary"
              onClick={() => {
                setStarted(true);
                setTimeout(
                  () =>
                    document.getElementById("scene-1")?.scrollIntoView({
                      behavior: matchMedia("(prefers-reduced-motion: reduce)")
                        .matches
                        ? "instant"
                        : "smooth",
                    }),
                  40,
                );
              }}
            >
              Begin Your Journey ✨
            </button>
            <small>Take a moment. This one is yours.</small>
            {page.id === "demo" && (
              <span className="demo-label">SAMPLE BIRTHDAY EXPERIENCE</span>
            )}
          </div>
        </section>
        {started && (
          <>
            <nav className="story-dots" aria-label="Birthday story">
              {labels.map((l, i) => (
                <a
                  className={active === i ? "active" : ""}
                  href={"#scene-" + i}
                  key={l}
                  aria-label={l}
                  aria-current={active === i ? "step" : undefined}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </a>
              ))}
            </nav>
            <Scene
              id="scene-1"
              label="01 · A DATE THE WORLD GOT A LITTLE BRIGHTER"
              title={page.recipientName + "’s Day ♡"}
            >
              <p className="special-date">
                {page.birthdayDate
                  ? new Date(
                      page.birthdayDate + "T12:00:00",
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                    })
                  : "A day to celebrate you"}
              </p>
              <p>A special day. A very special you.</p>
              <ArrowDown className="down-arrow" />
            </Scene>
            <Scene
              id="scene-2"
              label="02 · EVERY SECOND, A LITTLE CLOSER"
              title="Something beautiful is coming."
            >
              <Countdown date={page.birthdayDate} />
            </Scene>

            <Scene
              id="scene-3"
              label="03 · THE LITTLE THINGS"
              title="Small words. So much heart."
            >
              <Reasons reasons={page.reasons} />
            </Scene>
            <Scene
              id="scene-4"
              label="04 · MOMENTS TO KEEP CLOSE"
              title="A little collection of you."
            >
              <p>Some moments deserve to stay forever.</p>
              <Clothesline photos={page.photos} onOpen={setPhoto} />
            </Scene>
            <Scene
              id="scene-5"
              label="05 · WORDS JUST FOR YOU"
              title="A letter to keep."
            >
              <Letter
                message={page.personalMessage}
                name={page.recipientName}
              />
            </Scene>
            <Scene
              id="scene-6"
              label="06 · CLOSE YOUR EYES, JUST FOR A MOMENT"
              title="Make a wish."
            >
              <Cake />
            </Scene>
            <Scene
              id="scene-7"
              label="07 · A LITTLE WORLD OF YOUR OWN"
              title={
                theme.id === "radha-krishna"
                  ? "May your world be filled with love."
                  : "A little magic, just for you."
              }
            >
              {theme.image ? (
                <div className="signature-art">
                  <Image
                    src="/themes/vrindavan-pink.webp"
                    fill
                    sizes="(max-width:700px) 95vw, 700px"
                    alt="A devotional Radha–Krishna scene"
                  />
                  <div className="water-ripple" />
                </div>
              ) : (
                <div className={"signature-abstract " + theme.id}>
                  <span>
                    {theme.id === "dreamy-night"
                      ? "☾"
                      : theme.id === "romantic"
                        ? "❀"
                        : "✧"}
                  </span>
                  <div className="star-field">✧ · ˚ · ✧</div>
                </div>
              )}
              <p>
                {theme.id === "radha-krishna"
                  ? "In the quiet of Vrindavan, a wish for peace, joy, and beautiful beginnings."
                  : "May the little things always find a way to make you smile."}
              </p>
            </Scene>
            <Scene
              id="scene-8"
              label="08 · HERE’S TO YOUR NEXT CHAPTER"
              title={"Happy Birthday, " + page.recipientName + " ♡"}
            >
              <span className="gold-rule" />
              <p>Here’s to another beautiful chapter.</p>
              {page.senderName && (
                <p className="sender">With love, {page.senderName}</p>
              )}
              <a className="text-link" href="#scene-0">
                Back to the beginning ↑
              </a>
            </Scene>
            {page.musicUrl && <Music url={page.musicUrl} />}
          </>
        )}
        {photo !== null && (
          <Lightbox photos={page.photos} start={photo} onClose={close} />
        )}
      </main>
    </MotionConfig>
  );
}
