"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { money, fmtDate, stars } from "@/lib/ui";
import type { Course, Lesson, Level } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const TABS = [
  { key: "overview", ar: "نظرة عامة" },
  { key: "courses", ar: "الكورسات" },
  { key: "students", ar: "الطلاب" },
  { key: "orders", ar: "طلبات التحويل" },
  { key: "packages", ar: "الباقات والكوبونات" },
  { key: "payments", ar: "طرق الدفع" },
  { key: "content", ar: "المحتوى التشويقي" },
  { key: "vip", ar: "دورة VIP" },
  { key: "consults", ar: "الاستشارات" },
  { key: "donations", ar: "التبرعات" },
  { key: "audit", ar: "سجل التغييرات" },
] as const;

async function act(action: string, payload: Row = {}): Promise<{ ok: boolean; error?: string; data?: any }> {
  const res = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: d.error || "فشل الإجراء" };
  return { ok: true, data: d };
}

export default function DashClient({ me, data }: { me: { id: string; email: string }; data: Row }) {
  const [tab, setTab] = useState<string>("overview");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const router = useRouter();

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  async function run(action: string, payload?: Row, label?: string) {
    setBusy(action);
    let r: Awaited<ReturnType<typeof act>>;
    try {
      r = await act(action, payload);
    } catch (error) {
      r = { ok: false, error: error instanceof Error ? error.message : "تعذّر الاتصال بالخادم" };
    } finally {
      setBusy("");
    }
    if (r.ok) {
      const auditWarning = r.data?.auditWarning;
      flash(auditWarning ? `تم الحفظ، لكن تعذّر تسجيله في سجل التغييرات: ${auditWarning}` : label || "تم الحفظ ✓");
      router.refresh();
    } else {
      flash(`✗ ${r.error}`);
    }
    return r;
  }

  const stats = useMemo(() => {
    const students = (data.profiles as Row[]).filter((p) => p.role === "student");
    const pendingOrders = (data.orders as Row[]).filter((o) => o.status === "pending");
    const revenue = (data.orders as Row[])
      .filter((o) => o.status === "approved")
      .reduce((acc, o) => acc + (o.amount || 0), 0);
    const donationsTotal = (data.donations as Row[]).reduce((acc, d) => acc + (d.amount_cents || 0), 0);
    return { students, pendingOrders, revenue, donationsTotal };
  }, [data]);

  return (
    <div className="container" style={{ padding: "28px 20px 70px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <h1 className="section-title" style={{ margin: 0 }}>لوحة التحكم</h1>
        <span className="chip chip-accent">{me.email}</span>
        {toast && <span className="chip">{toast}</span>}
      </div>

      {/* التبويبات */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-outline"}`}
            style={{ whiteSpace: "nowrap" }}
            onClick={() => setTab(t.key)}
          >
            {t.ar}
            {t.key === "orders" && stats.pendingOrders.length > 0 && (
              <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 999, padding: "0 7px", fontSize: 11, marginInlineStart: 6 }}>
                {stats.pendingOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview data={data} stats={stats} />}
      {tab === "courses" && <CoursesTab data={data} run={run} busy={busy} />}
      {tab === "students" && <StudentsTab data={data} run={run} busy={busy} />}
      {tab === "orders" && <OrdersTab data={data} run={run} busy={busy} />}
      {tab === "packages" && <PackagesTab data={data} run={run} busy={busy} />}
      {tab === "payments" && <PaymentsTab data={data} run={run} busy={busy} />}
      {tab === "content" && <ContentTab data={data} run={run} busy={busy} />}
      {tab === "vip" && <VipTab data={data} run={run} busy={busy} />}
      {tab === "consults" && <ConsultsTab data={data} run={run} busy={busy} />}
      {tab === "donations" && <DonationsTab data={data} stats={stats} />}
      {tab === "audit" && <AuditTab data={data} />}
    </div>
  );
}

/* ================= نظرة عامة ================= */

function Overview({ data, stats }: { data: Row; stats: { students: Row[]; pendingOrders: Row[]; revenue: number; donationsTotal: number } }) {
  const courses = data.courses as Course[];
  const mainCourses = courses.filter((c) => c.kind === "main");
  const single = mainCourses.length === 1;
  return (
    <div className="grid grid-2">
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 14 }}>إحصائيات سريعة</h3>
        <div style={{ display: "grid", gap: 10, fontSize: 15 }}>
          <div>👥 الطلاب: <strong>{stats.students.length}</strong></div>
          <div>📚 الكورسات: <strong>{mainCourses.length}</strong> {single && <span className="chip" style={{ fontSize: 11 }}>وضع الكورس الواحد</span>}</div>
          <div>🎓 المستويات: <strong>{(data.levels as Row[]).length}</strong></div>
          <div>🎬 الدروس: <strong>{(data.lessons as Row[]).length}</strong></div>
          <div>⏳ طلبات معلّقة: <strong>{stats.pendingOrders.length}</strong></div>
          <div>🎁 التبرعات: <strong>{money(stats.donationsTotal)}</strong></div>
        </div>
      </div>
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 14 }}>طلبات تحتاج موافقتك</h3>
        {stats.pendingOrders.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>لا يوجد طلبات معلّقة ✓</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {stats.pendingOrders.slice(0, 5).map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
                <span>{o.full_name || o.email}</span>
                <a className="chip" href={o.proof_url} target="_blank" rel="noreferrer">الإثبات</a>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card pad" style={{ gridColumn: "1/-1" }}>
        <h3 className="font-head" style={{ marginBottom: 10 }}>وضع الكورس الواحد / المتعدد</h3>
        <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
          {single
            ? "يوجد كورس رئيسي واحد — الواجهة تعرضه مباشرة دون تحليلات أو «الأكثر مشاهدة». عند إضافة كورس ثانٍ ستتحول الواجهة تلقائياً لشبكة كورسات مع شارات «جديد» والرواج."
            : "يوجد أكثر من كورس — الواجهة تعرض شبكة كورسات مع شارة «جديد» وإحصاءات الرواج."}
        </p>
      </div>
    </div>
  );
}

/* ================= الكورسات ================= */

function CoursesTab({ data, run, busy }: { data: Row; run: (a: string, p?: Row, l?: string) => Promise<any>; busy: string }) {
  const courses = data.courses as Course[];
  const levels = data.levels as Level[];
  const lessons = data.lessons as Lesson[];
  const videos = data.lessonVideos as Row[];
  const [openCourse, setOpenCourse] = useState<string | null>(courses[0]?.id || null);
  const [form, setForm] = useState<Row>({});

  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* إضافة كورس */}
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>➕ كورس جديد</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input className="input" placeholder="العنوان (عربي)" value={form.title_ar || ""} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          <input className="input" placeholder="Title (EN)" value={form.title_en || ""} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          <input className="input" placeholder="سعر بالسنت (مثال 9900 = 99$)" value={form.price_cents || ""} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} />
          <select className="select" value={form.relation || "sequential"} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
            <option value="sequential">متسلسل</option>
            <option value="unrelated">مستقل</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={!!form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} /> مجاني
          </label>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>يُحفظ كمسودة غير منشورة. راجع المحتوى ثم انشره من قائمة الكورسات.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          disabled={busy === "upsertCourse" || !form.title_ar}
          onClick={async () => {
            const r = await run("upsertCourse", { ...form, is_new: true }, "تم إنشاء الكورس ✓");
            if (r.ok) setForm({});
          }}
        >
          إنشاء الكورس
        </button>
      </div>

      {/* قائمة الكورسات */}
      {courses.map((c) => {
        const cLevels = levels.filter((l) => l.course_id === c.id).sort((a, b) => a.sort - b.sort);
        const open = openCourse === c.id;
        return (
          <div key={c.id} className="card pad">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpenCourse(open ? null : c.id)}>{open ? "▾" : "▸"}</button>
              <strong className="font-head" style={{ fontSize: 17 }}>{c.title_ar}</strong>
              <span className="chip">{c.slug}</span>
              {c.is_published ? <span className="chip chip-gold">منشور</span> : <span className="chip chip-lock">مسودة</span>}
              <span style={{ flex: 1 }} />
              <button
                className={`btn btn-sm ${c.is_published ? "btn-outline" : "btn-primary"}`}
                disabled={busy === "setCoursePublished"}
                onClick={() => {
                  const nextPublished = !c.is_published;
                  const prompt = nextPublished
                    ? `نشر «${c.title_ar}»؟ سيتاح للطلاب ظهوره ومحتواه المنشور.`
                    : `إلغاء نشر «${c.title_ar}»؟ سيختفي من الكتالوج العام، وسيبقى محفوظاً ويمكن إعادة نشره.`;
                  if (confirm(prompt)) {
                    void run("setCoursePublished", { id: c.id, is_published: nextPublished }, nextPublished ? "تم نشر الكورس ✓" : "تم إلغاء النشر؛ الكورس محفوظ ويمكن استعادته ✓");
                  }
                }}
              >
                {c.is_published ? "إلغاء النشر" : "نشر"}
              </button>
            </div>

            {open && (
              <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                {/* تعديل الكورس */}
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                  <input className="input" defaultValue={c.title_ar} onBlur={(e) => e.target.value !== c.title_ar && run("upsertCourse", { ...c, title_ar: e.target.value }, "تم")}/>
                  <input className="input" defaultValue={c.subtitle_ar || ""} placeholder="وصف قصير" onBlur={(e) => e.target.value !== (c.subtitle_ar || "") && run("upsertCourse", { ...c, subtitle_ar: e.target.value }, "تم")} />
                  <input className="input" defaultValue={c.price_cents ?? ""} placeholder="السعر (سنت)" onBlur={(e) => e.target.value !== String(c.price_cents ?? "") && run("upsertCourse", { ...c, price_cents: e.target.value }, "تم")} />
                  <input className="input" defaultValue={c.cover_url || ""} placeholder="رابط الغلاف" onBlur={(e) => e.target.value !== (c.cover_url || "") && run("upsertCourse", { ...c, cover_url: e.target.value }, "تم")} />
                  <select className="select" defaultValue={c.relation} onChange={(e) => run("upsertCourse", { ...c, relation: e.target.value }, "تم")}>
                    <option value="sequential">متسلسل</option>
                    <option value="unrelated">مستقل</option>
                  </select>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <input type="checkbox" defaultChecked={c.is_new} onChange={(e) => run("upsertCourse", { ...c, is_new: e.target.checked }, "تم")} /> شارة «جديد»
                  </label>
                </div>

                {/* المستويات */}
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="font-head" style={{ fontWeight: 700 }}>المستويات ({cLevels.length})</div>
                  {cLevels.map((lv, i) => (
                    <div key={lv.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span className="chip">{i + 1}</span>
                        <input
                          className="input"
                          style={{ maxWidth: 220 }}
                          defaultValue={lv.title_ar}
                          onBlur={(e) => e.target.value !== lv.title_ar && run("upsertLevel", { ...lv, title_ar: e.target.value }, "تم")}
                        />
                        <select className="select" style={{ maxWidth: 130 }} defaultValue={lv.relation} onChange={(e) => run("upsertLevel", { ...lv, relation: e.target.value }, "تم")}>
                          <option value="sequential">يتطلب السابق</option>
                          <option value="unrelated">مفتوح</option>
                        </select>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
                          <input type="checkbox" defaultChecked={lv.is_free} onChange={(e) => run("upsertLevel", { ...lv, is_free: e.target.checked }, "تم")} /> مجاني
                        </label>
                        <span style={{ flex: 1 }} />
                        <button className="btn btn-danger btn-sm" onClick={() => confirm("حذف المستوى؟") && run("deleteLevel", { id: lv.id }, "تم الحذف")}>حذف</button>
                      </div>

                      {/* الدروس */}
                      <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                        {lessons.filter((l) => l.level_id === lv.id).sort((a, b) => a.sort - b.sort).map((l) => {
                          const vids = videos.filter((v) => v.lesson_id === l.id);
                          return (
                            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, flexWrap: "wrap", padding: "6px 8px", background: "var(--bg)", borderRadius: 8 }}>
                              <strong>{l.title_ar}</strong>
                              <span className="chip" style={{ fontSize: 10.5 }}>{l.subsection}</span>
                              {l.is_free_preview && <span className="chip chip-gold" style={{ fontSize: 10.5 }}>معاينة</span>}
                              {vids.length > 0 ? (
                                vids.map((v) => <span key={v.id} className="chip" style={{ fontSize: 10.5 }}>🎬 {v.lang}{v.bunny_video_id ? " ✓" : " (فارغ)"}</span>)
                              ) : (
                                <span className="chip chip-lock" style={{ fontSize: 10.5 }}>لا فيديو</span>
                              )}
                              <span style={{ flex: 1 }} />
                              <button className="btn btn-danger btn-sm" style={{ padding: "3px 10px" }} onClick={() => confirm("حذف الدرس؟") && run("deleteLesson", { id: l.id }, "تم")}>حذف</button>
                            </div>
                          );
                        })}
                      </div>
                      <AddLesson levelId={lv.id} run={run} busy={busy} />
                    </div>
                  ))}
                  <AddLevel courseId={c.id} nextSort={cLevels.length} run={run} busy={busy} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddLevel({ courseId, nextSort, run, busy }: { courseId: string; nextSort: number; run: any; busy: string }) {
  const [title, setTitle] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input className="input" placeholder="اسم المستوى الجديد (مثال: متقدم +)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button
        className="btn btn-accent"
        disabled={!title || busy === "upsertLevel"}
        onClick={async () => {
          const r = await run("upsertLevel", { courseId, title_ar: title, sort: nextSort, relation: "sequential" }, "تمت إضافة المستوى");
          if (r.ok) setTitle("");
        }}
      >
        ➕ مستوى
      </button>
    </div>
  );
}

function AddLesson({ levelId, run, busy }: { levelId: string; run: any; busy: string }) {
  const [f, setF] = useState<Row>({ subsection: "exercises", kind: "video", langs: ["ar"] });
  return (
    <div style={{ marginTop: 12, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
      <input className="input" placeholder="عنوان الدرس" value={f.title_ar || ""} onChange={(e) => setF({ ...f, title_ar: e.target.value })} />
      <select className="select" value={f.subsection} onChange={(e) => setF({ ...f, subsection: e.target.value })}>
        <option value="exercises">تمارين</option>
        <option value="writing">طريقة الكتابة</option>
        <option value="mistakes">الأخطاء الشائعة</option>
        <option value="feedback">الفيد باك</option>
        <option value="faq">الأسئلة الشائعة</option>
      </select>
      <select className="select" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
        <option value="video">فيديو</option>
        <option value="drive">رابط درايف</option>
        <option value="text">نص</option>
      </select>
      <input className="input" placeholder="رابط Drive (اختياري)" value={f.drive_url || ""} onChange={(e) => setF({ ...f, drive_url: e.target.value })} />
      <button
        className="btn btn-primary btn-sm"
        disabled={!f.title_ar || busy === "upsertLesson"}
        onClick={async () => {
          const r = await run("upsertLesson", { ...f, levelId }, "تمت إضافة الدرس");
          if (r.ok) setF({ subsection: "exercises", kind: "video", langs: ["ar"] });
        }}
      >
        ➕ درس
      </button>
      <VideoAttach run={run} busy={busy} />
    </div>
  );
}

function VideoAttach({ run, busy }: { run: any; busy: string }) {
  const [lessonId, setLessonId] = useState("");
  const [videoId, setVideoId] = useState("");
  const [lang, setLang] = useState("ar");
  return (
    <div style={{ display: "flex", gap: 6, gridColumn: "1/-1", flexWrap: "wrap" }}>
      <input className="input" style={{ maxWidth: 210 }} placeholder="ID الدرس (uuid)" value={lessonId} onChange={(e) => setLessonId(e.target.value)} />
      <input className="input" style={{ maxWidth: 210 }} placeholder="Bunny Video ID" value={videoId} onChange={(e) => setVideoId(e.target.value)} />
      <select className="select" style={{ maxWidth: 100 }} value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="ar">عربي</option>
        <option value="en">EN</option>
      </select>
      <button className="btn btn-outline btn-sm" disabled={!lessonId || !videoId || busy === "attachVideo"} onClick={() => run("attachVideo", { lessonId, bunnyVideoId: videoId, lang }, "تم ربط الفيديو")}>
        🔗 ربط فيديو
      </button>
    </div>
  );
}

/* ================= الطلاب ================= */

function StudentsTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const profiles = data.profiles as Row[];
  const courses = data.courses as Course[];
  const levels = data.levels as Level[];
  const access = data.access as Row[];
  const progress = data.progress as Row[];
  const [nf, setNf] = useState<Row>({});
  const [grantUser, setGrantUser] = useState<Row | null>(null);

  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* إضافة طالب يدوياً */}
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>➕ إضافة مشترك يدوياً</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input className="input" placeholder="البريد الإلكتروني" value={nf.email || ""} onChange={(e) => setNf({ ...nf, email: e.target.value })} />
          <input className="input" placeholder="كلمة مرور مؤقتة (6+)" value={nf.password || ""} onChange={(e) => setNf({ ...nf, password: e.target.value })} />
          <input className="input" placeholder="الاسم" value={nf.fullName || ""} onChange={(e) => setNf({ ...nf, fullName: e.target.value })} />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          disabled={!nf.email || !nf.password || busy === "createUser"}
          onClick={async () => {
            const r = await run("createUser", nf, "تم إنشاء الحساب — شاركه بيانات الدخول");
            if (r.ok) setNf({});
          }}
        >
          إنشاء الحساب
        </button>
      </div>

      {/* الجدول */}
      <div className="card pad" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>الدور</th>
              <th>الوصولات</th>
              <th>التقدم</th>
              <th>منح / استثناء</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const acc = access.filter((a) => a.user_id === p.id);
              const prog = progress.filter((pr) => pr.user_id === p.id && pr.completed).length;
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name || "—"}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{p.email}</div>
                  </td>
                  <td>
                    <select className="select" style={{ width: 110, padding: "4px 8px", fontSize: 13 }} value={p.role} onChange={(e) => run("setRole", { userId: p.id, role: e.target.value }, "تم تغيير الدور")}>
                      <option value="student">طالب</option>
                      <option value="admin">أدمن</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {acc.length === 0 ? <span className="muted">لا شيء</span> : acc.map((a) => (
                      <span key={a.id} className="chip" style={{ fontSize: 10.5, marginInlineEnd: 4 }}>
                        {a.course_id ? (courses.find((c) => c.id === a.course_id)?.title_ar || "كورس") : "مستوى"} · {a.source}
                      </span>
                    ))}
                  </td>
                  <td style={{ fontSize: 13 }}>{prog} درس مكتمل</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setGrantUser(grantUser?.id === p.id ? null : p)}>منح</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {grantUser && (
          <GrantBox
            user={grantUser}
            courses={courses}
            levels={levels}
            access={access}
            run={run}
            close={() => setGrantUser(null)}
          />
        )}
      </div>
    </div>
  );
}

function GrantBox({ user, courses, levels, access, run, close }: { user: Row; courses: Course[]; levels: Level[]; access: Row[]; run: any; close: () => void }) {
  const [courseId, setCourseId] = useState("");
  const [levelId, setLevelId] = useState("");
  const userAccess = access.filter((a) => a.user_id === user.id);
  return (
    <div className="card pad" style={{ marginTop: 12, background: "var(--primary-soft)" }}>
      <div className="font-head" style={{ fontWeight: 700, marginBottom: 10 }}>منح وصول لـ {user.email}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select className="select" style={{ maxWidth: 240 }} value={courseId} onChange={(e) => { setCourseId(e.target.value); setLevelId(""); }}>
          <option value="">— كورس كامل —</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title_ar}</option>)}
        </select>
        {courseId && (
          <select className="select" style={{ maxWidth: 240 }} value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            <option value="">كل المستويات</option>
            {levels.filter((l) => l.course_id === courseId).map((l) => <option key={l.id} value={l.id}>{l.title_ar}</option>)}
          </select>
        )}
        <button
          className="btn btn-primary btn-sm"
          disabled={!courseId}
          onClick={async () => {
            const r = await run("grant", { userId: user.id, courseId: levelId ? null : courseId, levelId: levelId || null, source: "grant" }, "تم المنح ✓");
            if (r.ok) close();
          }}
        >
          منح
        </button>
      </div>
      {userAccess.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>الوصولات الحالية:</div>
          {userAccess.map((a) => (
            <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <span className="chip">{a.course_id ? (courses.find((c) => c.id === a.course_id)?.title_ar || "كورس") : "مستوى"} · {a.source}</span>
              <button className="btn btn-danger btn-sm" style={{ padding: "2px 10px" }} onClick={() => run("revoke", { userId: user.id, courseId: a.course_id, levelId: a.level_id }, "تم السحب")}>سحب</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= طلبات التحويل ================= */

function OrdersTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const orders = data.orders as Row[];
  return (
    <div className="card pad" style={{ overflowX: "auto" }}>
      <h3 className="font-head" style={{ marginBottom: 12 }}>طلبات التحويل اليدوي (واتساب)</h3>
      <table className="table">
        <thead>
          <tr><th>الطالب</th><th>واتساب</th><th>الإثبات</th><th>الحالة</th><th>التاريخ</th><th>إجراء</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><strong>{o.full_name || "—"}</strong><div className="muted" style={{ fontSize: 12 }}>{o.email}</div></td>
              <td dir="ltr" style={{ fontSize: 13 }}>{o.whatsapp}</td>
              <td><a className="chip" href={o.proof_url} target="_blank" rel="noreferrer">عرض الإثبات</a></td>
              <td>
                <span className={`chip ${o.status === "pending" ? "chip-accent" : o.status === "approved" ? "chip-gold" : "chip-lock"}`}>
                  {o.status === "pending" ? "معلّق" : o.status === "approved" ? "مقبول" : "مرفوض"}
                </span>
              </td>
              <td className="muted" style={{ fontSize: 12.5 }}>{fmtDate(o.created_at)}</td>
              <td>
                {o.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary btn-sm" disabled={busy === "approveOrder"} onClick={() => run("approveOrder", { id: o.id }, "تم القبول والتفعيل ✓")}>قبول</button>
                    <button className="btn btn-danger btn-sm" disabled={busy === "rejectOrder"} onClick={() => run("rejectOrder", { id: o.id }, "تم الرفض")}>رفض</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p className="muted">لا توجد طلبات.</p>}
    </div>
  );
}

/* ================= الباقات والكوبونات ================= */

function PackagesTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const packages = data.packages as Row[];
  const courses = data.courses as Course[];
  const coupons = data.coupons as Row[];
  const [pf, setPf] = useState<Row>({ all_courses: true, is_active: true });
  const [cf, setCf] = useState<Row>({ percent_off: 20, active: true });

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>➕ باقة جديدة</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <input className="input" placeholder="اسم الباقة" value={pf.title_ar || ""} onChange={(e) => setPf({ ...pf, title_ar: e.target.value })} />
          <input className="input" placeholder="السعر بالسنت (29900 = 299$)" value={pf.price_cents || ""} onChange={(e) => setPf({ ...pf, price_cents: e.target.value })} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={!!pf.all_courses} onChange={(e) => setPf({ ...pf, all_courses: e.target.checked })} /> كل الكورسات
          </label>
        </div>
        {!pf.all_courses && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {courses.map((c) => (
              <label key={c.id} style={{ fontSize: 13.5, display: "flex", gap: 6, alignItems: "center", border: "1px solid var(--border)", borderRadius: 999, padding: "4px 12px" }}>
                <input
                  type="checkbox"
                  checked={(pf.course_ids || []).includes(c.id)}
                  onChange={(e) => {
                    const list: string[] = pf.course_ids || [];
                    setPf({ ...pf, course_ids: e.target.checked ? [...list, c.id] : list.filter((x) => x !== c.id) });
                  }}
                />
                {c.title_ar}
              </label>
            ))}
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={!pf.title_ar || !pf.price_cents || busy === "upsertPackage"} onClick={async () => { const r = await run("upsertPackage", pf, "تم إنشاء الباقة"); if (r.ok) setPf({ all_courses: true, is_active: true }); }}>
          إنشاء الباقة
        </button>
      </div>

      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>الباقات ({packages.length})</h3>
        <table className="table">
          <thead><tr><th>الباقة</th><th>السعر</th><th>النطاق</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.title_ar}</strong></td>
                <td>{money(p.price_cents)}</td>
                <td style={{ fontSize: 13 }}>{p.all_courses ? "كل الكورسات" : (p.course_ids || []).length + " كورسات"}</td>
                <td><span className={`chip ${p.is_active ? "chip-gold" : "chip-lock"}`}>{p.is_active ? "مفعّلة" : "موقوفة"}</span></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => run("upsertPackage", { ...p, is_active: !p.is_active }, "تم")}>{p.is_active ? "إيقاف" : "تفعيل"}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => confirm("حذف الباقة؟") && run("deletePackage", { id: p.id }, "تم الحذف")}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>🏷️ كوبونات الخصم</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="input" style={{ maxWidth: 160 }} placeholder="CODE" value={cf.code || ""} onChange={(e) => setCf({ ...cf, code: e.target.value.toUpperCase() })} />
          <input className="input" style={{ maxWidth: 120 }} type="number" min={1} max={100} placeholder="%" value={cf.percent_off || ""} onChange={(e) => setCf({ ...cf, percent_off: Number(e.target.value) })} />
          <button className="btn btn-accent" disabled={!cf.code || busy === "upsertCoupon"} onClick={async () => { const r = await run("upsertCoupon", cf, "تم إنشاء الكوبون"); if (r.ok) setCf({ percent_off: 20, active: true }); }}>
            إضافة كوبون
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {coupons.map((c) => (
            <span key={c.code} className="chip chip-accent">
              {c.code} — {c.percent_off}%
              <button style={{ border: "none", background: "none", cursor: "pointer", color: "var(--danger)", fontWeight: 700 }} onClick={() => run("deleteCoupon", { code: c.code }, "تم الحذف")}>✕</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= طرق الدفع ================= */

function PaymentsTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const methods = data.methods as Row[];
  const AR: Record<string, string> = { stripe: "بطاقة / Stripe", whatsapp_transfer: "تحويل + إثبات واتساب" };
  return (
    <div className="grid" style={{ gap: 18 }}>
      {methods.map((m) => (
        <div key={m.id} className="card pad" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <strong className="font-head" style={{ fontSize: 17 }}>{AR[m.key] || m.key}</strong>
          <span className={`chip ${m.enabled ? "chip-gold" : "chip-lock"}`}>{m.enabled ? "مفعّلة ✓" : "موقوفة"}</span>
          <span style={{ flex: 1 }} />
          <button className={`btn btn-sm ${m.enabled ? "btn-danger" : "btn-primary"}`} onClick={() => run("togglePaymentMethod", { key: m.key, enabled: !m.enabled }, "تم")}>
            {m.enabled ? "إيقاف" : "تفعيل"}
          </button>
        </div>
      ))}
      <div className="card pad">
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          💡 ملاحظة Stripe: أضف المفاتيح STRIPE_SECRET_KEY و STRIPE_WEBHOOK_SECRET في ملف .env المحلي، وأضف Webhook على المسار <code>/api/stripe/webhook</code> بحدث <code>checkout.session.completed</code>. التحويل اليدوي يظهر تلقائياً في تبويب «طلبات التحويل».
        </p>
      </div>
    </div>
  );
}

/* ================= المحتوى التشويقي ================= */

function ContentTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const testimonials = data.testimonials as Row[];
  const top = data.topStudents as Row[];
  const works = data.works as Row[];
  const faqs = data.faqs as Row[];
  const [t, setT] = useState<Row>({ rating: 5, approved: true });
  const [s, setS] = useState<Row>({});
  const [w, setW] = useState<Row>({ approved: true });
  const [f, setF] = useState<Row>({});

  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* شهادات */}
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>⭐ أفضل التعليقات</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))" }}>
          <input className="input" placeholder="اسم الطالب" value={t.student_name || ""} onChange={(e) => setT({ ...t, student_name: e.target.value })} />
          <input className="input" placeholder="نص التعليق" value={t.body_ar || ""} onChange={(e) => setT({ ...t, body_ar: e.target.value })} />
          <input className="input" type="number" min={1} max={5} placeholder="النجوم" value={t.rating || 5} onChange={(e) => setT({ ...t, rating: Number(e.target.value) })} />
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={!t.student_name || !t.body_ar} onClick={async () => { const r = await run("upsertTestimonial", t, "تمت الإضافة"); if (r.ok) setT({ rating: 5, approved: true }); }}>
          إضافة تعليق
        </button>
        <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
          {testimonials.map((x) => (
            <div key={x.id} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13.5, padding: "6px 10px", background: "var(--bg)", borderRadius: 8 }}>
              <span style={{ color: "var(--gold)" }}>{stars(x.rating)}</span>
              <strong>{x.student_name}</strong>
              <span className="muted" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.body_ar}</span>
              <span className={`chip ${x.approved ? "chip-gold" : "chip-lock"}`}>{x.approved ? "معروض" : "مخفي"}</span>
              <button className="btn btn-outline btn-sm" style={{ padding: "2px 8px" }} onClick={() => run("upsertTestimonial", { ...x, approved: !x.approved }, "تم")}>{x.approved ? "إخفاء" : "عرض"}</button>
              <button className="btn btn-danger btn-sm" style={{ padding: "2px 8px" }} onClick={() => run("deleteTestimonial", { id: x.id }, "تم الحذف")}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* أفضل الطلاب */}
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>🏆 أفضل الطلاب</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))" }}>
          <input className="input" placeholder="اسم الطالب" value={s.student_name || ""} onChange={(e) => setS({ ...s, student_name: e.target.value })} />
          <input className="input" placeholder="السبب (مثال: أكمل المستوى المتقدم)" value={s.reason_ar || ""} onChange={(e) => setS({ ...s, reason_ar: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={!s.student_name} onClick={async () => { const r = await run("upsertTopStudent", { ...s, sort: top.length }, "تمت الإضافة"); if (r.ok) setS({}); }}>
          إضافة طالب
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {top.map((x) => (
            <span key={x.id} className="chip" style={{ gap: 8 }}>
              🏆 {x.student_name}
              <button style={{ border: "none", background: "none", cursor: "pointer", color: "var(--danger)", fontWeight: 700 }} onClick={() => run("deleteTopStudent", { id: x.id }, "تم الحذف")}>✕</button>
            </span>
          ))}
        </div>
      </div>

      {/* أعمال الطلاب */}
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>🖼️ أعمال الطلاب</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))" }}>
          <input className="input" placeholder="اسم الطالب" value={w.student_name || ""} onChange={(e) => setW({ ...w, student_name: e.target.value })} />
          <input className="input" placeholder="رابط الصورة" value={w.image_url || ""} onChange={(e) => setW({ ...w, image_url: e.target.value })} />
          <input className="input" placeholder="تعليق" value={w.caption_ar || ""} onChange={(e) => setW({ ...w, caption_ar: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={!w.image_url || !w.student_name} onClick={async () => { const r = await run("upsertWork", w, "تمت الإضافة"); if (r.ok) setW({ approved: true }); }}>
          إضافة عمل
        </button>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {works.map((x) => (
            <div key={x.id} style={{ width: 130, textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.image_url} alt="" style={{ width: 130, height: 130, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
              <div style={{ fontSize: 12, marginTop: 4 }}>{x.student_name}</div>
              <button className="btn btn-danger btn-sm" style={{ padding: "1px 8px", fontSize: 11 }} onClick={() => run("deleteWork", { id: x.id }, "تم الحذف")}>حذف</button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="card pad">
        <h3 className="font-head" style={{ marginBottom: 12 }}>❓ الأسئلة الشائعة</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input className="input" placeholder="السؤال" value={f.question_ar || ""} onChange={(e) => setF({ ...f, question_ar: e.target.value })} />
          <textarea className="textarea" rows={2} placeholder="الجواب" value={f.answer_ar || ""} onChange={(e) => setF({ ...f, answer_ar: e.target.value })} />
          <button className="btn btn-primary btn-sm" disabled={!f.question_ar || !f.answer_ar} onClick={async () => { const r = await run("upsertFaq", { ...f, sort: faqs.length }, "تمت الإضافة"); if (r.ok) setF({}); }}>
            إضافة سؤال
          </button>
        </div>
        <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
          {faqs.map((x) => (
            <div key={x.id} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13.5, padding: "6px 10px", background: "var(--bg)", borderRadius: 8 }}>
              <strong style={{ flex: 1 }}>{x.question_ar}</strong>
              <button className="btn btn-danger btn-sm" style={{ padding: "2px 8px" }} onClick={() => run("deleteFaq", { id: x.id }, "تم الحذف")}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= VIP ================= */

function VipTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const vip = data.vip as Row | null;
  const [f, setF] = useState<Row>({
    enabled: vip?.enabled || false,
    title_ar: vip?.title_ar || "",
    starts_at: vip?.starts_at || "",
    join_url: vip?.join_url || "",
    description_ar: vip?.description_ar || "",
  });
  return (
    <div className="card pad" style={{ maxWidth: 640 }}>
      <h3 className="font-head" style={{ marginBottom: 6 }}>🎥 دورة VIP المباشرة</h3>
      <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>فعّلها أو أبطئها بضغطة واحدة — تظهر شارة «مباشر» في الرئيسية وصفحة VIP.</p>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, margin: "12px 0" }}>
        <input type="checkbox" checked={!!f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} />
        {f.enabled ? "مفعّلة الآن" : "غير مفعّلة"}
      </label>
      <div style={{ display: "grid", gap: 10 }}>
        <input className="input" placeholder="عنوان الجلسة" value={f.title_ar || ""} onChange={(e) => setF({ ...f, title_ar: e.target.value })} />
        <input className="input" type="datetime-local" value={f.starts_at || ""} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
        <input className="input" placeholder="رابط الجلسة (Zoom/Meet)" value={f.join_url || ""} onChange={(e) => setF({ ...f, join_url: e.target.value })} />
        <textarea className="textarea" rows={2} placeholder="وصف قصير" value={f.description_ar || ""} onChange={(e) => setF({ ...f, description_ar: e.target.value })} />
        <button className="btn btn-primary" disabled={busy === "setVip"} onClick={() => run("setVip", f, "تم حفظ إعدادات VIP")}>حفظ</button>
      </div>
    </div>
  );
}

/* ================= الاستشارات ================= */

function ConsultsTab({ data, run, busy }: { data: Row; run: any; busy: string }) {
  const consults = data.consults as Row[];
  return (
    <div className="grid" style={{ gap: 12 }}>
      {consults.length === 0 && <p className="muted">لا توجد طلبات استشارة.</p>}
      {consults.map((c) => (
        <div key={c.id} className="card pad">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong>{c.name}</strong> <a className="muted" href={`mailto:${c.email}`} style={{ fontSize: 13 }}>{c.email}</a>
            {c.phone && <a className="chip" href={`https://wa.me/${String(c.phone).replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">واتساب</a>}
            <span style={{ flex: 1 }} />
            <span className={`chip ${c.status === "new" ? "chip-accent" : ""}`}>{c.status === "new" ? "جديد" : c.status === "contacted" ? "تم التواصل" : "مغلق"}</span>
          </div>
          <p style={{ margin: "10px 0", fontSize: 14.5 }}>{c.message}</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-outline btn-sm" onClick={() => run("setConsultStatus", { id: c.id, status: "contacted" }, "تم")}>تم التواصل</button>
            <button className="btn btn-outline btn-sm" onClick={() => run("setConsultStatus", { id: c.id, status: "closed" }, "تم")}>إغلاق</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab({ data }: { data: Row }) {
  const entries = data.auditLogs as Row[];
  if (!data.auditLogsReady) {
    return <div className="card pad"><strong>سجل التغييرات غير مهيأ في قاعدة البيانات.</strong><p className="muted">شغّل ترحيل قاعدة البيانات <code>supabase/migrations/20261001000000_admin_audit.sql</code> ثم أعد تحميل اللوحة.</p></div>;
  }
  const label: Record<string, string> = {
    setRole: "تغيير دور مستخدم", grant: "منح وصول", revoke: "سحب وصول", upsertCourse: "حفظ كورس",
    setCoursePublished: "تغيير حالة نشر كورس", upsertLevel: "حفظ مستوى", deleteLevel: "حذف مستوى",
    upsertLesson: "حفظ درس", deleteLesson: "حذف درس", approveOrder: "قبول طلب تحويل", rejectOrder: "رفض طلب تحويل",
    upsertPackage: "حفظ باقة", deletePackage: "حذف باقة", upsertCoupon: "حفظ كوبون", deleteCoupon: "حذف كوبون",
    togglePaymentMethod: "تغيير طريقة دفع", savePaymentInstructions: "تحديث تعليمات الدفع",
    upsertTestimonial: "حفظ تقييم", deleteTestimonial: "حذف تقييم", upsertTopStudent: "حفظ طالب مميز",
    deleteTopStudent: "حذف طالب مميز", upsertWork: "حفظ عمل طالب", deleteWork: "حذف عمل طالب",
    upsertFaq: "حفظ سؤال شائع", deleteFaq: "حذف سؤال شائع", setConsultStatus: "تحديث استشارة",
    setVip: "تحديث جلسة VIP", attachVideo: "ربط فيديو", createUser: "إنشاء مستخدم",
  };
  return (
    <div className="card pad" style={{ overflowX: "auto" }}>
      <h2 className="font-head" style={{ marginBottom: 6 }}>سجل تغييرات الإدارة</h2>
      <p className="muted" style={{ marginTop: 0 }}>آخر 100 تغيير ناجح. الحقول الحساسة مستبعدة من اللقطات.</p>
      {!entries.length ? <p className="muted">لا توجد تغييرات مسجلة بعد.</p> : (
        <table className="table">
          <thead><tr><th>الوقت</th><th>المنفّذ</th><th>الإجراء</th><th>الكيان</th><th>قبل</th><th>بعد</th></tr></thead>
          <tbody>{entries.map((entry) => (
            <tr key={entry.id}>
              <td dir="ltr" style={{ whiteSpace: "nowrap" }}>{new Date(entry.created_at).toLocaleString("ar")}</td>
              <td>{entry.actor_email}</td>
              <td>{label[entry.action] || entry.action}</td>
              <td>{entry.entity_type}{entry.entity_id ? ` · ${entry.entity_id}` : ""}</td>
              <td><AuditSnapshot value={entry.before_data} /></td>
              <td><AuditSnapshot value={entry.after_data} /></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

function AuditSnapshot({ value }: { value: unknown }) {
  if (value == null) return <span className="muted">—</span>;
  const text = JSON.stringify(value);
  return <details><summary>عرض</summary><pre style={{ maxWidth: 300, maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", fontSize: 11 }}>{text}</pre></details>;
}

/* ================= التبرعات ================= */

function DonationsTab({ data, stats }: { data: Row; stats: { donationsTotal: number } }) {
  const donations = data.donations as Row[];
  return (
    <div className="card pad">
      <h3 className="font-head" style={{ marginBottom: 8 }}>🎁 التبرعات</h3>
      <p style={{ fontSize: 15 }}>الإجمالي: <strong>{money(stats.donationsTotal)}</strong> من {donations.length} تبرع</p>
      <table className="table">
        <thead><tr><th>المتبرع</th><th>المبلغ</th><th>المصدر</th><th>التاريخ</th></tr></thead>
        <tbody>
          {donations.map((d) => (
            <tr key={d.id}>
              <td>{d.name || d.email || "—"}</td>
              <td><strong>{money(d.amount_cents)}</strong></td>
              <td><span className="chip">{d.source === "stripe" ? "Stripe" : "يدوي"}</span></td>
              <td className="muted" style={{ fontSize: 12.5 }}>{fmtDate(d.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {donations.length === 0 && <p className="muted">لا توجد تبرعات بعد.</p>}
    </div>
  );
}
