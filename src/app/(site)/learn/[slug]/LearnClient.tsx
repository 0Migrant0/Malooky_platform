"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Access, Lesson, Level, Progress } from "@/lib/types";
import type { VideoLang } from "@/lib/i18n";
import { lessonsOfLevel, levelProgress, levelUnlocked, pickLang } from "@/lib/access";
import { stars } from "@/lib/ui";

const SUB_AR: Record<string, string> = {
  exercises: "تمارين",
  writing: "طريقة الكتابة",
  mistakes: "الأخطاء الشائعة",
  feedback: "الفيد باك",
  faq: "الأسئلة الشائعة",
};

const SUB_ICON: Record<string, string> = {
  exercises: "🏋️",
  writing: "✍️",
  mistakes: "⚠️",
  feedback: "⭐",
  faq: "❓",
};

interface Props {
  courseTitle: string;
  slug: string;
  levels: Level[];
  lessons: Lesson[];
  access: Access[];
  progress: Progress[];
  currentLevelId: string;
  currentLessonId: string;
  user: { id: string; email: string; name: string };
}

export default function LearnClient(p: Props) {
  const levels = p.levels;
  const [levelId, setLevelId] = useState(p.currentLevelId);
  const [lessonId, setLessonId] = useState(p.currentLessonId);
  const [progress, setProgress] = useState<Progress[]>(p.progress);
  const [videoLang, setVideoLang] = useState<VideoLang>("ar");
  const [playing, setPlaying] = useState(false);
  const [doneBusy, setDoneBusy] = useState(false);

  const level = levels.find((l) => l.id === levelId) || levels[0];
  const levelIdx = levels.findIndex((l) => l.id === level?.id);
  const lessons = useMemo(() => lessonsOfLevel(level?.id || "", p.lessons), [level, p.lessons]);
  const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];

  useEffect(() => {
    const saved = localStorage.getItem("malooky.vlang");
    const videoLang: VideoLang = saved === "en" ? "en" : "ar";
    setVideoLang(videoLang);
  }, []);

  const isDone = progress.some((pr) => pr.lesson_id === lesson?.id && pr.completed);
  const goto = (lvId: string, lsId?: string) => {
    setLevelId(lvId);
    if (lsId) setLessonId(lsId);
    setPlaying(false);
    window.history.replaceState(null, "", `/learn/${p.slug}?level=${lvId}${lsId ? `&lesson=${lsId}` : ""}`);
  };

  const markDone = useCallback(async () => {
    if (!lesson || isDone) return;
    setDoneBusy(true);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, completed: true }),
    });
    const completed = res.ok;
    setDoneBusy(false);
    if (completed) {
      setProgress((prev) => [
        ...prev.filter((x) => x.lesson_id !== lesson.id),
        { lesson_id: lesson.id, completed: true, updated_at: new Date().toISOString() },
      ]);
      // الانتقال التلقائي للدرس التالي بعد الإكمال
      const idx = lessons.findIndex((l) => l.id === lesson.id);
      const next = lessons[idx + 1];
      if (next) setTimeout(() => goto(level!.id, next.id), 600);
    }
  }, [lesson, isDone, lessons, level]);

  function changeVideoLang(l: VideoLang) {
    setVideoLang(l);
    setPlaying(false); // إعادة طلب رابط جديد للغة المختارة
    localStorage.setItem("malooky.vlang", l);
  }

  const effectiveLang = lesson ? pickLang(lesson, videoLang) : "ar";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 0, minHeight: "calc(100vh - 64px)" }} className="learn-grid">
      {/* ============ عمود المشغل ============ */}
      <div style={{ padding: "22px 26px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <Link href="/my" className="btn btn-ghost btn-sm">← كورساتي</Link>
          <span className="chip">{p.courseTitle}</span>
          <span className="chip chip-accent">{level?.title_ar}</span>
        </div>

        {/* المشغل الآمن */}
        <div className="player-wrap" data-lesson={lesson?.id}>
          {playing ? (
            <SecurePlayer
              key={`${lesson?.id}-${effectiveLang}-${playing}`}
              lessonId={lesson!.id}
              lang={effectiveLang}
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(140deg, #10282b, #0b1c1e)", color: "#fff", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}
            >
              <span style={{ fontSize: 46 }}>▶</span>
              <span className="font-head" style={{ fontSize: 19, fontWeight: 600 }}>{lesson?.title_ar}</span>
              <span style={{ fontSize: 12.5, opacity: 0.6 }}>البث محمي — سجّل المشاهدة للبدء</span>
            </button>
          )}
          {/* علامة مائية متحركة فوق الفيديو */}
          {playing && <WatermarkOverlay text={`${p.user.name} · ${p.user.email}`} />}
        </div>

        {/* شريط الدرس */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <div className="font-head" style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{lesson?.title_ar}</div>
          <div className="chip" style={{ gap: 8 }}>
            🌐 لغة الفيديو:
            <select
              className="select"
              style={{ padding: "2px 6px", width: "auto", fontSize: 13 }}
              value={effectiveLang}
              onChange={(e) => changeVideoLang(e.target.value as VideoLang)}
            >
              {(lesson?.langs || ["ar"]).map((l) => (
                <option key={l} value={l}>{l === "ar" ? "العربية" : "English"}</option>
              ))}
            </select>
          </div>
          <button className={`btn btn-sm ${isDone ? "btn-outline" : "btn-accent"}`} disabled={isDone || doneBusy} onClick={markDone}>
            {isDone ? "مكتمل ✓" : doneBusy ? "…" : "تحديد كمكتمل ✓"}
          </button>
        </div>

        {/* نص/جسم الدرس */}
        {lesson?.body_ar && (
          <div className="card pad" style={{ marginTop: 16 }}>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 15 }}>{lesson.body_ar}</div>
          </div>
        )}
        {lesson?.drive_url && (
          <a className="btn btn-outline" style={{ marginTop: 14 }} href={lesson.drive_url} target="_blank" rel="noreferrer">
            📂 ملفات التمرين على Drive
          </a>
        )}

        {/* التنقل بين الدروس */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, gap: 10 }}>
          {(() => {
            const idx = lessons.findIndex((l) => l.id === lesson?.id);
            const prev = lessons[idx - 1];
            return prev ? (
              <button className="btn btn-outline btn-sm" onClick={() => goto(level!.id, prev.id)}>→ السابق</button>
            ) : <span />;
          })()}
          {(() => {
            const idx = lessons.findIndex((l) => l.id === lesson?.id);
            const next = lessons[idx + 1];
            if (next) return <button className="btn btn-primary btn-sm" onClick={() => goto(level!.id, next.id)}>التالي ←</button>;
            const nextLevel = levels[levelIdx + 1];
            if (nextLevel && levelUnlocked(levels, levelIdx + 1, p.access, progress, p.lessons)) {
              return <button className="btn btn-primary btn-sm" onClick={() => goto(nextLevel.id)}>المستوى التالي: {nextLevel.title_ar} ←</button>;
            }
            if (nextLevel) return <span className="chip chip-lock">🔒 أكمل {level?.title_ar} 100% لفتح {nextLevel.title_ar}</span>;
            return <span className="chip chip-gold">🎉 أنهيت الكورس بالكامل</span>;
          })()}
        </div>
      </div>

      {/* ============ الشريط الجانبي ============ */}
      <aside className="learn-side" style={{ borderInlineStart: "1px solid var(--border)", background: "var(--surface)", padding: "18px 16px", maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>محتوى الكورس</div>
        {levels.map((lv, i) => {
          const lvUnlocked = levelUnlocked(levels, i, p.access, progress, p.lessons);
          const lvP = levelProgress(lv, p.lessons, progress);
          const active = lv.id === level?.id;
          return (
            <div key={lv.id} style={{ marginBottom: 12 }}>
              <button
                onClick={() => lvUnlocked && goto(lv.id)}
                style={{
                  width: "100%", textAlign: "start", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: "var(--radius)", cursor: lvUnlocked ? "pointer" : "not-allowed",
                  background: active ? "var(--primary-soft)" : "transparent", border: "none",
                  opacity: lvUnlocked ? 1 : 0.55,
                }}
              >
                <span className="chip" style={{ minWidth: 30, justifyContent: "center" }}>{lvUnlocked ? i + 1 : "🔒"}</span>
                <span style={{ flex: 1 }}>
                  <strong className="font-head" style={{ fontSize: 14.5 }}>{lv.title_ar}</strong>
                  <span className="progress-track" style={{ display: "block", marginTop: 6 }}>
                    <span className="progress-fill" style={{ display: "block", width: `${lvP}%` }} />
                  </span>
                </span>
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{lvP}%</span>
              </button>
              {active && (
                <div style={{ marginTop: 6, display: "grid", gap: 2 }}>
                  {(["exercises", "writing", "mistakes", "feedback", "faq"] as const).map((sk) => {
                    const items = lessons.filter((l) => l.subsection === sk);
                    if (items.length === 0) return null;
                    return (
                      <div key={sk} style={{ paddingInlineStart: 12 }}>
                        <div className="muted" style={{ fontSize: 12, fontWeight: 700, padding: "6px 8px 2px" }}>
                          {SUB_ICON[sk]} {SUB_AR[sk]}
                        </div>
                        {items.map((l) => {
                          const lDone = progress.some((pr) => pr.lesson_id === l.id && pr.completed);
                          const current = l.id === lesson?.id;
                          return (
                            <button
                              key={l.id}
                              onClick={() => goto(lv.id, l.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "start",
                                padding: "7px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                                background: current ? "var(--accent-soft)" : "transparent",
                                fontWeight: current ? 700 : 400, fontSize: 13.5,
                              }}
                            >
                              <span style={{ width: 16, color: lDone ? "var(--success)" : "var(--muted)" }}>{lDone ? "✓" : "○"}</span>
                              <span style={{ flex: 1 }}>{l.title_ar}</span>
                              {l.is_free_preview && <span className="chip" style={{ fontSize: 10, padding: "1px 7px" }}>مجاني</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="muted" style={{ fontSize: 11.5, marginTop: 10, padding: "0 6px" }}>
          🔒 الفيديوهات محمية بعلامة مائية تحمل بياناتك — إعادة النشر مكشوفة الهوية.
        </div>
      </aside>

      <style>{`
        @media (max-width: 980px) {
          .learn-grid { grid-template-columns: 1fr !important; }
          .learn-side { border: none !important; max-height: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ============ المشغل الآمن ============ */

function SecurePlayer({
  lessonId,
  lang,
}: {
  lessonId: string;
  lang: VideoLang;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/video-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, lang }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "تعذّر تشغيل الفيديو");
        if (alive) setSrc(d.embedUrl);
      })
      .catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [lessonId, lang]);

  if (err) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16/9", color: "#fff", background: "#000" }}>{err}</div>;
  if (!src) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16/9", color: "#9db", background: "#000" }}>جارٍ فتح البث الآمن…</div>;

  return (
    <iframe
      src={src}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onContextMenu={(e) => e.preventDefault()}
      title="video"
    />
  );
}

/* ============ العلامة المائية المتحركة ============ */

function WatermarkOverlay({ text }: { text: string }) {
  const [pos, setPos] = useState({ x: 8, y: 8 });
  useEffect(() => {
    const iv = setInterval(() => {
      setPos((prev) => {
        const x = prev.x <= 4 ? Math.random() * 60 : prev.x <= 55 ? prev.x - Math.random() * 8 : 4;
        const y = prev.y <= 8 ? Math.random() * 70 + 8 : prev.y - Math.random() * 10;
        return { x, y: Math.max(4, Math.min(80, y)) };
      });
    }, 2600);
    return () => clearInterval(iv);
  }, []);
  return (
    <>
      <span className="watermark" style={{ insetInlineStart: `${pos.x}%`, top: `${pos.y}%` }}>{text}</span>
      <span className="watermark" style={{ insetInlineEnd: "6%", bottom: "6%", opacity: 0.22 }}>{stars(5)} malooky</span>
    </>
  );
}
