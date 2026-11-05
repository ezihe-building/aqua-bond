import { useEffect, useState } from "react";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Droplets,
  Heart, Menu, ShieldCheck, Smartphone, Sparkles, Waves, X,
} from "lucide-react";

const slides = [
  {
    eyebrow: "A SMALLER RESET. A BETTER DAY.",
    title: <>Make space<br />for <em>feeling good.</em></>,
    description: "Aqua Bond makes your daily water habit feel less like a chore and more like a little kindness to yourself.",
    image: "water-ripples.jpg",
    imageAlt: "Clear blue water catching soft afternoon light",
    detail: "A little water, a lot more you.",
  },
  {
    eyebrow: "YOUR PACE. YOUR KIND OF PROGRESS.",
    title: <>Little sips.<br /><em>Lovely streaks.</em></>,
    description: "Log a glass in a tap, find a gentle rhythm, and watch small moments turn into a habit that stays.",
    image: "ocean-mood.jpg",
    imageAlt: "Open water and a soft blue horizon",
    detail: "Progress that feels like yours.",
  },
  {
    eyebrow: "A GOOD THING IS BETTER SHARED.",
    title: <>Keep your<br /><em>people close.</em></>,
    description: "Cheer on the people you care about with private invite codes and live hydration progress.",
    image: "water-bottle-detail.jpg",
    imageAlt: "A reusable water bottle ready to take on the day",
    detail: "Your people, cheering you on.",
  },
  {
    eyebrow: "A LITTLE REMINDER, FROM SOMEONE WHO CARES.",
    title: <>HAVE <span className="hero-love">CONFIDENCE</span><br />IN YOURSELF,<br /><em className="hero-love-soft">BECAUSE SHE<br />LOVES YOU</em></>,
    description: "You are stronger than you think. Carry that love with you, one small moment at a time.",
    image: "ocean-mood.jpg",
    imageAlt: "A calm ocean horizon in soft evening light",
    detail: "You are loved. Keep believing.",
  },
];

const features = [
  { icon: Droplets, number: "01", title: "A sip, made simple", text: "Log a drink in one tap. Your bottle fills as your day does." },
  { icon: Waves, number: "02", title: "Progress with a pulse", text: "See your rhythm in a day, a week, or all the way back." },
  { icon: Heart, number: "03", title: "Better, together", text: "Bring your people in with a private invite code. Cheer each other on." },
];

export default function LandingPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentSlide = slides[slideIndex];
  const appDownloadUrl = `${import.meta.env.BASE_URL}aqua-bond.apk`;

  useEffect(() => {
    const timer = window.setInterval(() => setSlideIndex((index) => (index + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".landing-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("landing-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const scrollToInstall = () => {
    setMenuOpen(false);
    document.querySelector("#get-started")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="landing-page">
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <header className="landing-header">
        <a className="landing-brand" href="#" aria-label="Aqua Bond home">
          <img src={`${import.meta.env.BASE_URL}aqua-bond-logo.svg`} alt="" />
          <span>AQUA <b>BOND</b></span>
        </a>
        <button className="landing-menu-button" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={menuOpen ? "landing-nav landing-nav-open" : "landing-nav"} aria-label="Main navigation">
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
          <a href="#experience" onClick={() => setMenuOpen(false)}>The experience</a>
          <a href="#community" onClick={() => setMenuOpen(false)}>Together</a>
          <a className="landing-nav-cta" href={appDownloadUrl} download="aqua-bond.apk">Download app <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <section className="landing-hero" aria-roledescription="carousel" aria-label="Discover Aqua Bond">
        {slides.map((slide, index) => <div key={slide.eyebrow} className={index === slideIndex ? "hero-slide hero-slide-active" : "hero-slide"} aria-hidden={index !== slideIndex}>
          <img className="hero-slide-image" src={`${import.meta.env.BASE_URL}${slide.image}`} alt={slide.imageAlt} fetchPriority={index === 0 ? "high" : "auto"} />
          <div className="hero-slide-shade" />
        </div>)}
        <div className="hero-grain" />
        <div className="hero-content" id="main-content">
          <div className="hero-copy" key={slideIndex}>
            <p className="landing-eyebrow"><span className="eyebrow-line" />{currentSlide.eyebrow}</p>
            <h1 className={slideIndex === 3 ? "hero-affirmation" : undefined}>{currentSlide.title}</h1>
            <p className="hero-description">{currentSlide.description}</p>
            <div className="hero-actions">
              <a className="landing-primary-button" href={appDownloadUrl} download="aqua-bond.apk">Download the app <Smartphone size={18} /></a>
              <button className="landing-glass-button" type="button" onClick={scrollToInstall}>Discover Aqua Bond <ArrowDown size={16} /></button>
            </div>
            <div className="hero-proof"><span className="proof-avatars"><i>A</i><i>+</i><i><Heart size={11} fill="currentColor" /></i></span><span>A gentler kind of progress, made for real life.</span></div>
          </div>
          <div className="hero-side-note"><span>0{slideIndex + 1} — 0{slides.length}</span><i /><span>{currentSlide.detail}</span></div>
        </div>
        <div className="hero-bottom">
          <div className="hero-pagination" role="group" aria-label="Choose a featured slide">
            {slides.map((slide, index) => <button key={slide.eyebrow} className={index === slideIndex ? "pagination-dot pagination-dot-active" : "pagination-dot"} type="button" aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`} aria-current={index === slideIndex ? "true" : undefined} onClick={() => setSlideIndex(index)}><span /></button>)}
          </div>
          <a className="scroll-cue" href="#story"><span>SCROLL TO FEEL THE FLOW</span><ArrowDown size={15} /></a>
          <span className="hero-counter">0{slideIndex + 1}<i>/</i>0{slides.length}</span>
        </div>
      </section>

      <section className="landing-marquee" aria-label="Aqua Bond values">
        <div className="marquee-track">{Array.from({ length: 2 }, (_, repeat) => <div className="marquee-group" key={repeat}>
          <span>SMALL SIPS</span><Droplets /><span>SOFTER ROUTINES</span><Sparkles /><span>SHARED WINS</span><Heart /><span>MORE YOU TIME</span><Waves />
        </div>)}</div>
      </section>

      <section className="landing-story landing-section" id="story">
        <div className="story-side landing-reveal"><p className="landing-eyebrow landing-eyebrow-dark"><span className="eyebrow-line" />A NOTE FROM AQUA BOND</p><span className="story-index">01 <i>/</i> THE WHY</span></div>
        <div className="story-main landing-reveal">
          <h2>Water is the little thing.<br /><em>Showing up is everything.</em></h2>
          <p>Life gets full. Good habits slip. Aqua Bond is a small, beautiful reminder to pause, take a sip, and care for the person carrying you through it all: you.</p>
          <a className="text-link" href="#experience">Meet your new ritual <ArrowRight size={16} /></a>
        </div>
        <div className="story-orbit" aria-hidden="true"><div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><span><Droplets size={43} /></span><i className="orbit-sparkle sparkle-one">✳</i><i className="orbit-sparkle sparkle-two">✦</i></div>
      </section>

      <section className="landing-experience landing-section" id="experience">
        <div className="section-heading landing-reveal"><div><p className="landing-eyebrow"><span className="eyebrow-line" />YOUR EVERYDAY, REIMAGINED</p><h2>A little more <em>alive.</em></h2></div><p>Quietly useful, unexpectedly lovely.<br />Everything you need, nothing you don't.</p></div>
        <div className="experience-grid">
          <article className="experience-visual-card landing-reveal">
            <img src={`${import.meta.env.BASE_URL}water-bottle-detail.jpg`} alt="A reusable bottle that is ready to go" loading="lazy" />
            <div className="visual-card-overlay" />
            <span className="visual-card-label"><Droplets size={14} /> YOUR DAY, IN FLOW</span>
            <div className="visual-card-bottom"><span>01</span><strong>One tap.<br />One lovely habit.</strong><span>↗</span></div>
          </article>
          <div className="feature-stack">
            {features.map(({ icon: Icon, number, title, text }, index) => <article className="feature-row landing-reveal" key={number} style={{ transitionDelay: `${index * 100}ms` }}>
              <span className="feature-number">{number}</span><span className="feature-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={17} className="feature-arrow" />
            </article>)}
            <div className="glass-note landing-reveal"><Sparkles size={16} /><span>Your water, your way. Pick a bottle style and make the app feel like yours.</span></div>
          </div>
        </div>
      </section>

      <section className="landing-community landing-section" id="community">
        <div className="community-art" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}ocean-mood.jpg`} alt="" loading="lazy" />
          <div className="community-art-shade" />
          <div className="community-floating-card"><span className="community-heart"><Heart size={18} fill="currentColor" /></span><span><b>A little cheer goes a long way.</b><small>Your people are right here.</small></span></div>
          <div className="community-watermark">BETTER<br /><em>TOGETHER</em></div>
        </div>
        <div className="community-copy landing-reveal"><p className="landing-eyebrow"><span className="eyebrow-line" />A GOOD THING, SHARED</p><h2>Make room for<br /><em>your people.</em></h2><p>Build your own little circle. Share a private code, see each other's progress, and make the everyday feel a little less everyday.</p><div className="community-points"><span><Droplets size={15} /> Private invite codes</span><span><Waves size={15} /> Live shared progress</span><span><Heart size={15} /> Your own personal profile</span></div><a className="text-link" href={appDownloadUrl} download="aqua-bond.apk">Download Aqua Bond <ArrowRight size={16} /></a></div>
      </section>

      <section className="landing-get-started landing-section" id="get-started">
        <div className="get-started-background"><img src={`${import.meta.env.BASE_URL}water-ripples.jpg`} alt="" loading="lazy" /></div>
        <div className="get-started-content landing-reveal">
          <span className="get-started-icon"><img src={`${import.meta.env.BASE_URL}aqua-bond-logo.svg`} alt="" /></span>
          <p className="landing-eyebrow"><span className="eyebrow-line" />YOUR NEXT LITTLE GOOD THING</p>
          <h2>Start where<br /><em>you are.</em></h2>
          <p className="get-started-copy">No perfect streak to start. No big promise to make. Just you, a glass of water, and one small thing for yourself.</p>
          <div className="download-actions">
            <a className="landing-primary-button" href={appDownloadUrl} download="aqua-bond.apk"><Smartphone size={18} /> Download Aqua Bond <ArrowRight size={17} /></a>
          </div>
          <p className="install-note"><ShieldCheck size={14} /> Android app download. Your private profile stays on your device.</p>
        </div>
        <div className="download-side-note"><span>DESIGNED TO MEET YOU WHERE YOU ARE</span><i>AB—25</i></div>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand" href="#" aria-label="Aqua Bond home"><img src={`${import.meta.env.BASE_URL}aqua-bond-logo.svg`} alt="" /><span>AQUA <b>BOND</b></span></a>
        <span className="footer-note">Make space for feeling good.</span>
        <div><a href="#story">Our story</a><a href="#get-started">Download app</a><span>Made with care <Heart size={13} /></span></div>
        <span className="copyright">© {new Date().getFullYear()} AQUA BOND</span>
      </footer>
    </main>
  );
}
