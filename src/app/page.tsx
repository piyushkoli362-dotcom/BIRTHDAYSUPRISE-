import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Heart,
  Music2,
  Images,
  Gift,
  Check,
} from "lucide-react";
import { themes } from "../themes";
import Header from "../components/ui/Header";
export default function Landing() {
  return (
    <>
      <Header />
      <main className="landing">
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              ✧ NOT JUST A WISH. A WHOLE LITTLE WORLD.
            </span>
            <h1>
              Some people deserve
              <br />a little <em>magic.</em>
            </h1>
            <p className="hero-description">
              Create a birthday surprise they’ll never forget.
              <br />
              Their photos. Your words. A beautiful world,
              <br className="desktop-only" /> made just for them.
            </p>
            <div className="button-row">
              <Link className="primary" href="/create">
                Create Your Birthday Surprise <ArrowRight size={17} />
              </Link>
              <Link className="text-link" href="/birthday/mahima">
                See a demo ↗
              </Link>
            </div>
            <div className="hero-notes">
              <span>
                <Check size={14} /> Made in minutes
              </span>
              <span>
                <Check size={14} /> Yours to personalize
              </span>
              <span>
                <Check size={14} /> A link full of love
              </span>
            </div>
            <div className="handwritten">
              A small gesture. An unforgettable feeling.
            </div>
          </div>
          <div className="hero-art">
            <Image
              src="/themes/vrindavan-pink.webp"
              alt="Radha and Krishna on a flower-adorned swing in moonlit Vrindavan"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 55vw"
            />
            <div className="art-shade" />
            <div className="art-top">
              <span className="pill">THE VRINDAVAN COLLECTION</span>
              <Sparkles size={20} />
            </div>
            <div className="art-caption">
              <span>Inspired by an eternal kind of love</span>
              <h2>
                A wish, wrapped
                <br />
                in moonlight.
              </h2>
              <Link href="/birthday/mahima">
                Step into the experience <ArrowRight size={16} />
              </Link>
            </div>
            <div className="floating-note">
              <Heart size={16} />
              <span>
                A world made for <strong>someone special</strong>
              </span>
            </div>
          </div>
        </section>
        <div className="feature-strip">
          <span>
            <Images /> Your favourite moments
          </span>
          <i>✧</i>
          <span>
            <Heart /> Words from the heart
          </span>
          <i>✧</i>
          <span>
            <Music2 /> A song that feels like them
          </span>
          <i>✧</i>
          <span>
            <Gift /> One unforgettable surprise
          </span>
        </div>
        <section className="section-wrap" id="themes">
          <div className="section-top">
            <div>
              <span className="eyebrow">FIND THEIR KIND OF MAGIC</span>
              <h2>One story. Beautiful little worlds.</h2>
            </div>
            <p>
              Choose an atmosphere.
              <br />
              Make everything else your own.
            </p>
          </div>
          <div className="theme-grid">
            {themes.map((t, i) => (
              <Link
                href={"/create?theme=" + t.id}
                className="theme-card"
                key={t.id}
              >
                <div
                  className={"theme-cover theme-" + t.id}
                  style={{
                    backgroundColor: t.colors.background,
                    color: t.colors.accent,
                  }}
                >
                  {t.image ? (
                    <Image
                      src={t.image}
                      alt="Radha–Krishna theme preview"
                      fill
                      sizes="(max-width:760px) 80vw, 25vw"
                    />
                  ) : (
                    <>
                      <span className="theme-symbol">
                        {["", "☾", "❀", "✧", "✳"][i]}
                      </span>
                      <div className="theme-stars">· ˚ ✧ · ˚</div>
                    </>
                  )}
                  <span className="theme-tag">
                    {i === 0 ? "SIGNATURE THEME" : "INCLUDED"}
                  </span>
                </div>
                <div className="theme-label">
                  <h3>{t.name}</h3>
                  <ArrowRight size={16} />
                </div>
                <p>{t.description}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="how section-wrap" id="how">
          <span className="eyebrow">A LITTLE EFFORT. A LOT OF HEART.</span>
          <h2>From a thought to their favourite surprise.</h2>
          <div className="how-grid">
            {[
              [
                "01",
                "Make it theirs",
                "Add their name, your memories and the words you want them to keep.",
              ],
              [
                "02",
                "Set the feeling",
                "Choose a beautiful theme, add their song, and preview every little detail.",
              ],
              [
                "03",
                "Send a little magic",
                "Publish your surprise and share one personal link. Let the smiles begin.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <Link href="/create" className="primary">
            Make someone’s day <Sparkles size={16} />
          </Link>
        </section>
        <footer>
          <Link href="/" className="brand">
            ✧ little wishes
          </Link>
          <p>For the people who make your world a little more beautiful.</p>
          <span>Made with a little heart.</span>
        </footer>
      </main>
    </>
  );
}
