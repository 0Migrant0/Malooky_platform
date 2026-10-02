"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLang } from "@/components/LangProvider";

export default function HomeHero({ singleCourse, courseSlug }: { singleCourse: boolean; courseSlug?: string }) {
  const { lang, tr } = useLang();
  const artworkRef = useRef<HTMLDivElement>(null);

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
          <span className="hero-kicker"><span className="hero-kicker-dot" />{tr("أكاديمية ملوكي للكاليجرافيتي العربي")}</span>
          <h1 className="hero-title">{tr("حين يصبح الحرف")}<br /><span className="hero-title-accent"><span className="hero-title-accent-first">{tr("فنّاً")}</span>{lang === "zh" ? "" : " "}<span className="hero-title-accent-second">{tr("يُرى")}</span></span><span className="hero-title-period">.</span></h1>
          <p className="hero-description">{tr("اكتشف طاقة الحرف العربي من خلال الكاليجرافيتي — تعلّم، جرّب، واصنع عملاً يحمل بصمتك.")}</p>
          <div className="hero-actions">
            <Link className="btn hero-button-primary" href={courseHref}>{tr("اكتشف الكورسات")}<span aria-hidden="true">↗</span></Link>
            <Link className="btn hero-button-secondary" href="/consult">{tr("احجز استشارة")}</Link>
          </div>
          <div className="hero-notes">{["خط عربي معاصر", "تعلّم تطبيقي", "من الورق إلى الجدار"].map((note, index) => <span key={note}><b>0{index + 1}</b>{tr(note)}</span>)}</div>
        </div>

        <div ref={artworkRef} className="hero-artwork hero-logo-artwork" role="img" aria-label={lang === "ar" ? "شعار ملوكي" : lang === "zh" ? "马卢基标志" : "Malooky logo"}>
          <div className="logo-orbit logo-orbit-one" aria-hidden="true" />
          <div className="logo-orbit logo-orbit-two" aria-hidden="true" />
          <div className="logo-rays" aria-hidden="true" />
          <div className="hero-logo-stage">
            <span className="hero-logo-halo" aria-hidden="true" />
            <Image className="hero-logo-main" src="/malooky-logo.jpg" alt={tr("شعار ملوكي")} width={370} height={370} priority />
          </div>
        </div>
      </div>
      <div className="hero-bottom-line" aria-hidden="true"><span>مــ</span><span>ART / LETTER / MOVEMENT</span><span>— 01 / 03 —</span></div>
    </section>
  );
}
