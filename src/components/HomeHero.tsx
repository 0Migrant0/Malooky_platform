"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLang } from "@/components/LangProvider";

const copy = {
  ar: {
    kicker: "أكاديمية ملوكي للكاليجرافيتي العربي",
    first: "حين يصبح الحرف",
    highlightFirst: "فنّاً",
    highlightSecond: "يُرى",
    highlightSeparator: " ",
    description: "اكتشف طاقة الحرف العربي من خلال الكاليجرافيتي — تعلّم، جرّب، واصنع عملاً يحمل بصمتك.",
    browse: "اكتشف الكورسات",
    consult: "احجز استشارة",
    notes: ["خط عربي معاصر", "تعلّم تطبيقي", "من الورق إلى الجدار"],
  },
  en: {
    kicker: "MALOOKY · ARABIC CALLIGRAFFITI",
    first: "Where letters",
    highlightFirst: "become",
    highlightSecond: "art",
    highlightSeparator: " ",
    description: "Explore the energy of Arabic letters through calligraffiti. Learn, experiment, and create work with your own signature.",
    browse: "Explore courses",
    consult: "Book a consultation",
    notes: ["Contemporary Arabic art", "Learn by making", "From page to wall"],
  },
  zh: {
    kicker: "MALOOKY · 阿拉伯书法涂鸦",
    first: "让文字",
    highlightFirst: "成为",
    highlightSecond: "艺术",
    highlightSeparator: "",
    description: "探索阿拉伯字母的律动与力量。通过书法涂鸦学习、实验，创作属于自己的作品。",
    browse: "探索课程",
    consult: "预约咨询",
    notes: ["当代阿拉伯艺术", "在创作中学习", "从纸面到墙面"],
  },
} as const;

export default function HomeHero({ singleCourse, courseSlug }: { singleCourse: boolean; courseSlug?: string }) {
  const { lang } = useLang();
  const artworkRef = useRef<HTMLDivElement>(null);
  const text = copy[lang];

  useEffect(() => {
    const element = artworkRef.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduceMotion.matches || !finePointer.matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const update = () => {
      frame = 0;
      element.style.setProperty("--hero-pointer-x", `${x}px`);
      element.style.setProperty("--hero-pointer-y", `${y}px`);
    };
    const onPointer = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width - .5) * 18;
      y = ((event.clientY - rect.top) / rect.height - .5) * 14;
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    element.addEventListener("pointermove", onPointer, { passive: true });
    element.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", onPointer);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const courseHref = singleCourse && courseSlug ? `/courses/${courseSlug}` : "/courses";
  return (
    <section className="hero hero-calligraffiti">
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-flow-lines" aria-hidden="true">
        <svg viewBox="0 0 740 560" preserveAspectRatio="xMidYMid slice">
          <path className="hero-flow hero-flow-a" d="M-30 370C90 340 92 168 208 174C312 181 189 350 323 345C454 340 418 122 548 113C652 107 565 320 706 301C761 294 778 243 812 208" />
          <path className="hero-flow hero-flow-b" d="M-52 430C89 406 150 300 257 305C364 309 342 403 452 383C548 366 547 282 692 342" />
          <path className="hero-flow hero-flow-c" d="M104 74C165 32 222 28 270 48M465 488C536 518 601 510 661 476" />
          <circle cx="162" cy="126" r="3" /><circle cx="591" cy="90" r="2.5" /><circle cx="621" cy="442" r="3" />
        </svg>
      </div>
      <div className="container hero-layout">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="hero-kicker-dot" />{text.kicker}</span>
          <h1 className="hero-title">{text.first}<br /><span className="hero-title-accent"><span className="hero-title-accent-first">{text.highlightFirst}</span>{text.highlightSeparator}<span className="hero-title-accent-second">{text.highlightSecond}</span></span><span className="hero-title-period">.</span></h1>
          <p className="hero-description">{text.description}</p>
          <div className="hero-actions">
            <Link className="btn hero-button-primary" href={courseHref}>{text.browse}<span aria-hidden="true">↗</span></Link>
            <Link className="btn hero-button-secondary" href="/consult">{text.consult}</Link>
          </div>
          <div className="hero-notes">{text.notes.map((note, index) => <span key={note}><b>0{index + 1}</b>{note}</span>)}</div>
        </div>

        <div ref={artworkRef} className="hero-artwork hero-logo-artwork" role="img" aria-label={lang === "ar" ? "شعار ملوكي" : lang === "zh" ? "马卢基标志" : "Malooky logo"}>
          <div className="logo-orbit logo-orbit-one" aria-hidden="true" />
          <div className="logo-orbit logo-orbit-two" aria-hidden="true" />
          <div className="logo-rays" aria-hidden="true" />
          <div className="hero-logo-stage">
            <span className="hero-logo-halo" aria-hidden="true" />
            <Image className="hero-logo-main" src="/malooky-logo.jpg" alt={lang === "ar" ? "شعار ملوكي" : "Malooky logo"} width={370} height={370} priority />
          </div>
        </div>
      </div>
      <div className="hero-bottom-line" aria-hidden="true"><span>مــ</span><span>ART / LETTER / MOVEMENT</span><span>— 01 / 03 —</span></div>
    </section>
  );
}
