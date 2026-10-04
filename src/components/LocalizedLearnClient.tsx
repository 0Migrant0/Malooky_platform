"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Access, Lesson, Level, Progress } from "@/lib/types";
import type { VideoLang } from "@/lib/i18n";
import { localizedField, localizeApiError, translate } from "@/lib/i18n";
import { readApiResponse } from "@/lib/client-api";
import { useLang } from "@/components/LangProvider";
import { lessonsOfLevel, levelProgress, levelUnlocked, pickLang } from "@/lib/access";
import { stars } from "@/lib/ui";

const SUBSECTION_COPY = { exercises: "تمارين", writing: "طريقة الكتابة", mistakes: "الأخطاء الشائعة", feedback: "الفيد باك", faq: "الأسئلة الشائعة" } as const;
const SUBSECTION_ICON = { exercises: "🏋️", writing: "✍️", mistakes: "⚠️", feedback: "⭐", faq: "❓" } as const;

export interface LearnViewProps {
  course: { title_ar: string; title_en: string | null };
  slug: string;
  levels: Level[];
  lessons: Lesson[];
  access: Access[];
  progress: Progress[];
  currentLevelId: string;
  currentLessonId: string;
  user: { id: string; email: string; name: string };
}

export default function LocalizedLearnClient(p: LearnViewProps) {
  const { lang, tr } = useLang();
  const levels = p.levels;
  const [levelId, setLevelId] = useState(p.currentLevelId);
  const [lessonId, setLessonId] = useState(p.currentLessonId);
  const [progress, setProgress] = useState<Progress[]>(p.progress);
  const [videoLang, setVideoLang] = useState<VideoLang>("ar");
  const [playing, setPlaying] = useState(false);
  const [doneBusy, setDoneBusy] = useState(false);
  const [doneError, setDoneError] = useState("");
  const doneInFlight = useRef(false);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSelection = useRef({ levelId, lessonId });
  currentSelection.current = { levelId, lessonId };
  const level = levels.find((item) => item.id === levelId) || levels[0];
  const levelIdx = levels.findIndex((item) => item.id === level?.id);
  const lessons = useMemo(() => lessonsOfLevel(level?.id || "", p.lessons), [level, p.lessons]);
  const lesson = lessons.find((item) => item.id === lessonId) || lessons[0];
  const courseTitle = localizedField(lang, { ar: p.course.title_ar, en: p.course.title_en });
  const levelTitle = level ? localizedField(lang, { ar: level.title_ar, en: level.title_en }) : "";

  useEffect(() => {
    const saved = localStorage.getItem("malooky.vlang");
    setVideoLang(saved === "en" ? "en" : "ar");
  }, []);

  const isDone = progress.some((item) => item.lesson_id === lesson?.id && item.completed);
  const goto = (nextLevelId: string, nextLessonId?: string) => {
    if (completionTimer.current) clearTimeout(completionTimer.current);
    completionTimer.current = null;
    currentSelection.current = { levelId: nextLevelId, lessonId: nextLessonId || lessonId };
    setDoneError("");
    setLevelId(nextLevelId);
    if (nextLessonId) setLessonId(nextLessonId);
    setPlaying(false);
    window.history.replaceState(null, "", `/learn/${p.slug}?level=${nextLevelId}${nextLessonId ? `&lesson=${nextLessonId}` : ""}`);
  };
  const markDone = useCallback(async () => {
    if (!lesson || isDone || doneInFlight.current) return;
    doneInFlight.current = true;
    setDoneBusy(true);
    setDoneError("");
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, completed: true }) });
      const result = await readApiResponse(response, (data) => data.ok === true);
      if (!result.ok) {
        setDoneError(localizeApiError(lang, result.error, "progress"));
        return;
      }
      setProgress((prev) => [...prev.filter((item) => item.lesson_id !== lesson.id), { lesson_id: lesson.id, completed: true, updated_at: new Date().toISOString() }]);
      const next = lessons[lessons.findIndex((item) => item.id === lesson.id) + 1];
      if (next) completionTimer.current = setTimeout(() => {
        if (currentSelection.current.lessonId === lesson.id && currentSelection.current.levelId === level?.id) goto(level!.id, next.id);
        completionTimer.current = null;
      }, 600);
    } catch {
      setDoneError(localizeApiError(lang, undefined, "progress"));
    } finally {
      doneInFlight.current = false;
      setDoneBusy(false);
    }
  }, [lesson, isDone, lessons, level, lang]);
  useEffect(() => () => { if (completionTimer.current) clearTimeout(completionTimer.current); }, []);

  function changeVideoLang(next: VideoLang) {
    setVideoLang(next);
    setPlaying(false);
    localStorage.setItem("malooky.vlang", next);
  }

  const effectiveLang = lesson ? pickLang(lesson, videoLang) : "ar";
  const subsectionLabel = (source: string) => translate(lang, source);
  const lessonTitle = lesson ? localizedField(lang, { ar: lesson.title_ar, en: lesson.title_en }) : "";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 0, minHeight: "calc(100vh - 64px)" }} className="learn-grid">
      <div style={{ padding: "22px 26px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <Link href="/my" className="btn btn-ghost btn-sm">← {tr("كورساتي")}</Link>
          <span className="chip">{courseTitle}</span>
          <span className="chip chip-accent">{levelTitle}</span>
        </div>
        <div className="player-wrap" data-lesson={lesson?.id}>
          {playing ? <SecurePlayer key={`${lesson?.id}-${effectiveLang}-${playing}`} lessonId={lesson!.id} lang={effectiveLang} siteLang={lang} loadingText={tr("جارٍ فتح البث الآمن…")} videoTitle={tr("فيديو")} /> : (
            <button onClick={() => setPlaying(true)} style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(140deg, #10282b, #0b1c1e)", color: "#fff", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ fontSize: 46 }}>▶</span><span className="font-head" style={{ fontSize: 19, fontWeight: 600 }}>{lessonTitle}</span><span style={{ fontSize: 12.5, opacity: 0.6 }}>{tr("البث محمي — سجّل المشاهدة للبدء")}</span>
            </button>
          )}
          {playing && <WatermarkOverlay text={`${p.user.name} · ${p.user.email}`} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <div className="font-head" style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{lessonTitle}</div>
          <div className="chip" style={{ gap: 8 }}>🌐 {tr("لغة الفيديو:")}<select className="select" style={{ padding: "2px 6px", width: "auto", fontSize: 13 }} value={effectiveLang} onChange={(event) => changeVideoLang(event.target.value as VideoLang)}>{(lesson?.langs || ["ar"]).map((item) => <option key={item} value={item}>{item === "ar" ? tr("العربية") : tr("الإنجليزية")}</option>)}</select></div>
          <button className={`btn btn-sm ${isDone ? "btn-outline" : "btn-accent"}`} disabled={isDone || doneBusy} onClick={markDone}>{isDone ? tr("مكتمل ✓") : doneBusy ? tr("جارٍ الحفظ…") : tr("تحديد كمكتمل ✓")}</button>
        </div>
        {doneError && <div role="alert" style={{ color: "var(--danger)", marginTop: 10 }}>{doneError}</div>}
        {lesson?.body_ar && <div className="card pad" style={{ marginTop: 16 }}><div style={{ whiteSpace: "pre-wrap", fontSize: 15 }}>{localizedField(lang, { ar: lesson.body_ar, en: lesson.body_en })}</div></div>}
        {lesson?.drive_url && <a className="btn btn-outline" style={{ marginTop: 14 }} href={lesson.drive_url} target="_blank" rel="noreferrer">📂 {tr("ملفات التمرين على Drive")}</a>}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, gap: 10 }}>
          {(() => { const previous = lessons[lessons.findIndex((item) => item.id === lesson?.id) - 1]; return previous ? <button className="btn btn-outline btn-sm" onClick={() => goto(level!.id, previous.id)}>→ {tr("السابق")}</button> : <span />; })()}
          {(() => {
            const next = lessons[lessons.findIndex((item) => item.id === lesson?.id) + 1];
            if (next) return <button className="btn btn-primary btn-sm" onClick={() => goto(level!.id, next.id)}>{tr("التالي")} ←</button>;
            const nextLevel = levels[levelIdx + 1];
            if (nextLevel && levelUnlocked(levels, levelIdx + 1, p.access, progress, p.lessons)) return <button className="btn btn-primary btn-sm" onClick={() => goto(nextLevel.id)}>{tr("المستوى التالي:")} {localizedField(lang, { ar: nextLevel.title_ar, en: nextLevel.title_en })} ←</button>;
            if (nextLevel) return <span className="chip chip-lock">🔒 {tr("أكمل")} {levelTitle} 100% {tr("لفتح")} {localizedField(lang, { ar: nextLevel.title_ar, en: nextLevel.title_en })}</span>;
            return <span className="chip chip-gold">{tr("🎉 أنهيت الكورس بالكامل")}</span>;
          })()}
        </div>
      </div>
      <aside className="learn-side" style={{ borderInlineStart: "1px solid var(--border)", background: "var(--surface)", padding: "18px 16px", maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>{tr("محتوى الكورس")}</div>
        {levels.map((item, index) => {
          const unlocked = levelUnlocked(levels, index, p.access, progress, p.lessons);
          const percent = levelProgress(item, p.lessons, progress);
          const active = item.id === level?.id;
          return <div key={item.id} style={{ marginBottom: 12 }}><button onClick={() => unlocked && goto(item.id)} style={{ width: "100%", textAlign: "start", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius)", cursor: unlocked ? "pointer" : "not-allowed", background: active ? "var(--primary-soft)" : "transparent", border: "none", opacity: unlocked ? 1 : 0.55 }}><span className="chip" style={{ minWidth: 30, justifyContent: "center" }}>{unlocked ? index + 1 : "🔒"}</span><span style={{ flex: 1 }}><strong className="font-head" style={{ fontSize: 14.5 }}>{localizedField(lang, { ar: item.title_ar, en: item.title_en })}</strong><span className="progress-track" style={{ display: "block", marginTop: 6 }}><span className="progress-fill" style={{ display: "block", width: `${percent}%` }} /></span></span><span style={{ fontSize: 11.5, color: "var(--muted)" }}>{percent}%</span></button>
            {active && <div style={{ marginTop: 6, display: "grid", gap: 2 }}>{(Object.keys(SUBSECTION_COPY) as Array<keyof typeof SUBSECTION_COPY>).map((key) => { const items = lessons.filter((entry) => entry.subsection === key); if (!items.length) return null; const subsectionTitle = SUBSECTION_COPY[key]; return <div key={key} style={{ paddingInlineStart: 12 }}><div className="muted" style={{ fontSize: 12, fontWeight: 700, padding: "6px 8px 2px" }}>{SUBSECTION_ICON[key]} {subsectionLabel(subsectionTitle)}</div>{items.map((entry) => { const completed = progress.some((progressItem) => progressItem.lesson_id === entry.id && progressItem.completed); const current = entry.id === lesson?.id; return <button key={entry.id} onClick={() => goto(item.id, entry.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "start", padding: "7px 10px", borderRadius: 10, border: "none", cursor: "pointer", background: current ? "var(--accent-soft)" : "transparent", fontWeight: current ? 700 : 400, fontSize: 13.5 }}><span style={{ width: 16, color: completed ? "var(--success)" : "var(--muted)" }}>{completed ? "✓" : "○"}</span><span style={{ flex: 1 }}>{localizedField(lang, { ar: entry.title_ar, en: entry.title_en })}</span>{entry.is_free_preview && <span className="chip" style={{ fontSize: 10, padding: "1px 7px" }}>{tr("مجاني")}</span>}</button>; })}</div>; })}</div>}
          </div>;
        })}
        <div className="muted" style={{ fontSize: 11.5, marginTop: 10, padding: "0 6px" }}>🔒 {tr("الفيديوهات محمية بعلامة مائية تحمل بياناتك — إعادة النشر مكشوفة الهوية.")}</div>
      </aside>
      <style>{`@media (max-width: 980px) { .learn-grid { grid-template-columns: 1fr !important; } .learn-side { border: none !important; max-height: none !important; } }`}</style>
    </div>
  );
}


function SecurePlayer({ lessonId, lang, siteLang, loadingText, videoTitle }: { lessonId: string; lang: VideoLang; siteLang: "ar" | "en" | "zh"; loadingText: string; videoTitle: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setSrc(null);
    setError(null);
    void (async () => {
      try {
        const response = await fetch("/api/video-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, lang }) });
        const result = await readApiResponse(response, (data) => typeof data.embedUrl === "string" && data.embedUrl.trim().length > 0);
        if (!alive) return;
        if (!result.ok || typeof result.data.embedUrl !== "string" || !result.data.embedUrl.trim()) {
          setError(result.ok ? undefined : result.error);
          return;
        }
        setSrc(result.data.embedUrl);
      } catch {
        if (alive) setError(undefined);
      }
    })();
    return () => { alive = false; };
  }, [lessonId, lang, attempt]);
  if (error !== null) return <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", aspectRatio: "16/9", color: "#fff", background: "#000" }}><span>{localizeApiError(siteLang, error, "video")}</span><button className="btn btn-outline btn-sm" onClick={() => setAttempt((value) => value + 1)}>{translate(siteLang, "إعادة المحاولة")}</button></div>;
  if (!src) return <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16/9", color: "#9db", background: "#000" }}>{loadingText}</div>;
  return <iframe src={src} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onContextMenu={(event) => event.preventDefault()} title={videoTitle} />;
}

function WatermarkOverlay({ text }: { text: string }) {
  const [pos, setPos] = useState({ x: 8, y: 8 });
  useEffect(() => {
    const interval = setInterval(() => setPos((previous) => {
      const x = previous.x <= 4 ? Math.random() * 60 : previous.x <= 55 ? previous.x - Math.random() * 8 : 4;
      const y = previous.y <= 8 ? Math.random() * 70 + 8 : previous.y - Math.random() * 10;
      return { x, y: Math.max(4, Math.min(80, y)) };
    }), 2600);
    return () => clearInterval(interval);
  }, []);
  return <><span className="watermark" style={{ insetInlineStart: `${pos.x}%`, top: `${pos.y}%` }}>{text}</span><span className="watermark" style={{ insetInlineEnd: "6%", bottom: "6%", opacity: 0.22 }}>{stars(5)} malooky</span></>;
}
