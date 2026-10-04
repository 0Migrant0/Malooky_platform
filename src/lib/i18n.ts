export type Lang = "ar" | "en" | "zh";
export type VideoLang = "ar" | "en";

export const languages: {
  code: Lang;
  labelAr: string;
  labelEn: string;
  labelNative: string;
  dir: "rtl" | "ltr";
}[] = [
  { code: "ar", labelAr: "العربية", labelEn: "Arabic", labelNative: "العربية", dir: "rtl" },
  { code: "en", labelAr: "الإنجليزية", labelEn: "English", labelNative: "English", dir: "ltr" },
  { code: "zh", labelAr: "الصينية", labelEn: "Chinese", labelNative: "中文", dir: "ltr" },
];

const ar = {
  brand: "ملوكي", tagline: "أكاديمية الكاليجرافيتي العربي", nav_home: "الرئيسية", nav_courses: "الكورسات",
  nav_vip: "دورة VIP", nav_consult: "استشارة", nav_donate: "تبرع", login: "تسجيل الدخول", logout: "خروج",
  dash: "لوحة التحكم", my_courses: "كورساتي", hero_kicker: "أكاديمية القلم في إبد",
  hero_title_1: "تعلّم فن الكاليجرافيتي", hero_title_2: "بأسلوب عربي عصري",
  hero_sub: "كورسات مصوّرة باحترافية، تتقدّم خطوة بخطوة مع متابعة وتقييم مباشر من الأستاذ.",
  cta_start: "ابدأ رحلتك", cta_browse: "تصفح الكورسات", courses_all: "كل الكورسات", course_new: "جديد",
  course_levels: "مستويات", level: "المستوى", lessons: "دروس", students: "طلاب", hours: "ساعات", free: "مجاني",
  buy: "اشترك الآن", buy_bundle: "اشترِ الحزمة", includes: "ماذا يتضمن هذا الكورس؟", curriculum: "محتوى الكورس",
  locked_level: "يُفتح بعد إكمال المستوى السابق 100%", progress: "التقدم", completed: "مكتمل",
  continue_learning: "متابعة التعلم", start_level: "ابدأ المستوى", testimonials: "أفضل التعليقات",
  top_students: "أفضل الطلاب", works: "أعمال الطلاب", faq: "الأسئلة الأكثر شيوعاً", donate_title: "ادعم المنصة",
  donate_sub: "تبرعك يساعدنا على إنتاج محتوى تعليمي مجاني بجودة عالية.", amount: "المبلغ", donate_now: "تبرع الآن",
  consult_title: "احجز استشارة خاصة", consult_sub: "أرسل طلبك وسيتواصل معك الأستاذ لتحديد الموعد.", name: "الاسم",
  email: "البريد الإلكتروني", phone: "رقم الجوال / واتساب", message: "رسالتك", send: "إرسال",
  sent_ok: "تم الإرسال بنجاح، شكراً لك!", vip_title: "الدورة المباشرة VIP", vip_off: "الدورة المباشرة غير مفعّلة حالياً",
  vip_on: "الدورة المباشرة مفعّلة الآن", join_vip: "انضم الآن", session: "الجلسة", language: "اللغة",
  video_lang: "لغة الفيديو", site_lang: "لغة الموقع", mark_done: "تحديد كمكتمل", done: "مكتمل ✓", next: "التالي",
  prev: "السابق", exercises: "تمارين", writing_method: "طريقة الكتابة", mistakes: "الأخطاء الشائعة",
  feedback: "الفيد باك", section_faq: "الأسئلة الشائعة", login_title: "الدخول إلى ملوكي",
  login_sub: "الحسابات تُنشأ من إدارة الأكاديمية أو بعد الشراء.", password: "كلمة المرور", signin: "دخول",
  courses_price: "السعر", one_time: "دفعة واحدة", bundle: "حزمة شاملة",
  security_note: "جميع الفيديوهات محمية ومشفّرة ولا يمكن تحميلها.", not_enrolled: "غير مسجل في هذا الكورس",
  enroll_required: "سجّل في الكورس للمتابعة", footer_rights: "جميع الحقوق محفوظة",
  error_generic: "حدث خطأ، حاول مرة أخرى", loading: "جارٍ التحميل…",
} as const;

const en: Dict = {
  brand: "Malooky", tagline: "Academy of Arabic Calligraffiti", nav_home: "Home", nav_courses: "Courses",
  nav_vip: "VIP Live", nav_consult: "Consulting", nav_donate: "Donate", login: "Sign in", logout: "Sign out",
  dash: "Dashboard", my_courses: "My courses", hero_kicker: "The pen academy",
  hero_title_1: "Learn the art of Calligraffiti", hero_title_2: "in a modern Arabic style",
  hero_sub: "Professionally produced courses, step by step, with direct follow-up and feedback from the instructor.",
  cta_start: "Start your journey", cta_browse: "Browse courses", courses_all: "All courses", course_new: "New",
  course_levels: "levels", level: "Level", lessons: "lessons", students: "students", hours: "hours", free: "Free",
  buy: "Enroll now", buy_bundle: "Buy bundle", includes: "What does this course include?", curriculum: "Curriculum",
  locked_level: "Unlocks after completing the previous level 100%", progress: "Progress", completed: "Completed",
  continue_learning: "Continue learning", start_level: "Start level", testimonials: "Top reviews", top_students: "Top students",
  works: "Student works", faq: "FAQ", donate_title: "Support the platform",
  donate_sub: "Your donation helps us produce more high-quality free content.", amount: "Amount", donate_now: "Donate now",
  consult_title: "Book a private consultation", consult_sub: "Send your request and the instructor will contact you to schedule.",
  name: "Name", email: "Email", phone: "Phone / WhatsApp", message: "Your message", send: "Send",
  sent_ok: "Sent successfully, thank you!", vip_title: "VIP Live Course", vip_off: "The live course is currently disabled",
  vip_on: "The live course is live now", join_vip: "Join now", session: "Session", language: "Language",
  video_lang: "Video language", site_lang: "Site language", mark_done: "Mark as completed", done: "Completed ✓",
  next: "Next", prev: "Previous", exercises: "Exercises", writing_method: "Writing method", mistakes: "Common mistakes",
  feedback: "Feedback", section_faq: "FAQ", login_title: "Sign in to Malooky",
  login_sub: "Accounts are created by the academy or after purchase.", password: "Password", signin: "Sign in",
  courses_price: "Price", one_time: "One-time", bundle: "Full bundle",
  security_note: "All videos are protected and encrypted — downloading is disabled.", not_enrolled: "Not enrolled in this course",
  enroll_required: "Enroll to continue", footer_rights: "All rights reserved", error_generic: "Something went wrong, please try again",
  loading: "Loading…",
};


const zh: Dict = {
  brand: "马卢基", tagline: "阿拉伯书法涂鸦学院", nav_home: "首页", nav_courses: "课程", nav_vip: "VIP 直播课",
  nav_consult: "咨询", nav_donate: "支持我们", login: "登录", logout: "退出", dash: "管理面板", my_courses: "我的课程",
  hero_kicker: "阿拉伯书法涂鸦学院", hero_title_1: "学习书法涂鸦艺术", hero_title_2: "感受现代阿拉伯风格",
  hero_sub: "专业课程带你循序渐进地学习，并获得导师的直接指导与反馈。", cta_start: "开启创作之旅",
  cta_browse: "浏览课程", courses_all: "全部课程", course_new: "新课", course_levels: "个阶段", level: "阶段",
  lessons: "课时", students: "名学员", hours: "小时", free: "免费", buy: "立即报名", buy_bundle: "购买课程包",
  includes: "课程内容", curriculum: "课程大纲", locked_level: "完成上一阶段 100% 后解锁", progress: "学习进度",
  completed: "已完成", continue_learning: "继续学习", start_level: "开始学习", testimonials: "学员评价",
  top_students: "优秀学员", works: "学员作品", faq: "常见问题", donate_title: "支持创作平台",
  donate_sub: "您的支持将帮助我们持续制作高质量的免费教育内容。", amount: "金额", donate_now: "立即支持",
  consult_title: "预约私人咨询", consult_sub: "提交申请后，导师将与您联系安排时间。", name: "姓名", email: "电子邮箱",
  phone: "电话 / WhatsApp", message: "留言", send: "发送", sent_ok: "发送成功，谢谢！", vip_title: "VIP 直播课程",
  vip_off: "直播课程目前未开放", vip_on: "VIP 直播现已开放", join_vip: "立即加入", session: "课程", language: "语言",
  video_lang: "视频语言", site_lang: "网站语言", mark_done: "标记为已完成", done: "已完成 ✓", next: "下一课",
  prev: "上一课", exercises: "练习", writing_method: "书写方法", mistakes: "常见错误", feedback: "反馈",
  section_faq: "常见问题", login_title: "登录马卢基", login_sub: "账号由学院创建或在购买后开通。", password: "密码",
  signin: "登录", courses_price: "价格", one_time: "一次性付款", bundle: "完整课程包", security_note: "所有视频均经过加密保护，无法下载。",
  not_enrolled: "您尚未报名此课程", enroll_required: "报名课程后继续学习", footer_rights: "版权所有", error_generic: "出错了，请重试", loading: "加载中…",
};

export type Dict = Record<keyof typeof ar, string>;
export const dict: Record<Lang, Dict> = { ar, en, zh };

type CopyRow = readonly [string, string, string];
const copyRows: CopyRow[] = [
  ["ملوكي", "Malooky", "马卢基"], ["جميع الحقوق محفوظة", "All rights reserved", "版权所有"],
  ["روابط", "Explore", "快速链接"], ["ملاحظة أمان", "Security note", "安全说明"],
  ["أكاديمية الكاليجرافيتي العربي — نعلّم فن الحرف الحديث خطوة بخطوة، مع متابعة مباشرة من الأستاذ.", "Arabic calligraffiti academy — learn modern lettering step by step with direct instructor feedback.", "阿拉伯书法涂鸦学院 — 循序渐进学习现代字母艺术，并获得导师的直接指导。"],
  ["جميع الفيديوهات مشفّرة ومحمية بعلامة مائية لكل مشاهد — التحميل وإعادة النشر ممنوع ومحفوظ الحقوق.", "Videos are encrypted and watermarked for each viewer. Downloading and redistribution are prohibited.", "所有视频均已加密，并为每位观看者添加水印。禁止下载和传播。"],
  ["الرئيسية", "Home", "首页"], ["الكورسات", "Courses", "课程"], ["تبرع", "Donate", "支持我们"],
  ["التعلم", "Learning", "学习"], ["كورسات متدرجة بمستويات مفتوحة بالتتابع — أكمل كل مستوى 100% لتفتح التالي.", "Progressive courses with sequential levels — complete each level to 100% to unlock the next.", "循序渐进的课程 — 完成当前阶段 100% 后即可解锁下一阶段。"],
  ["استشارة", "Consulting", "咨询"], ["دورة VIP", "VIP Live", "VIP 直播课"], ["تسجيل الدخول", "Sign in", "登录"],
  ["خروج", "Sign out", "退出"], ["اللوحة", "Dashboard", "管理面板"], ["لوحة التحكم", "Dashboard", "管理面板"],
  ["كورساتي", "My courses", "我的课程"], ["اختر اللغة", "Choose language", "选择语言"], ["القائمة", "Menu", "菜单"],
  ["اختر كورسك", "Choose your course", "选择课程"], ["لا توجد كورسات منشورة بعد.", "No courses have been published yet.", "暂无已发布课程。"],
  ["رحلة متكاملة من التأسيس إلى الاحتراف", "A complete journey from fundamentals to mastery.", "从基础到精通的完整学习之旅。"],
  ["قاعدة البيانات غير مهيأة بعد — شغّل", "The database is not configured yet — run", "数据库尚未配置 — 请运行"],
  ["من لوحة Supabase ثم حدّث الصفحة.", "in the Supabase dashboard, then refresh this page.", "在 Supabase 控制台中执行，然后刷新页面。"],
  ["آراء الطلاب", "Student reviews", "学员评价"], ["أفضل التعليقات", "Top reviews", "精选评价"], ["نفتخر بهم", "Our students", "优秀学员"],
  ["أفضل الطلاب", "Top students", "优秀学员"], ["من الميدان", "From the studio", "学员创作"], ["أعمال الطلاب", "Student work", "学员作品"],
  ["مساعدة", "Help", "帮助"], ["الأسئلة الأكثر شيوعاً", "Frequently asked questions", "常见问题"], ["الأسئلة الشائعة", "Frequently asked questions", "常见问题"],
  ["ادعم استمرار المحتوى", "Support more learning content", "支持持续创作教育内容"],
  ["تبرعك يساعدنا على إنتاج محتوى تعليمي مجاني بجودة عالية للجميع.", "Your donation helps us create high-quality educational content for everyone.", "您的支持将帮助我们为所有人制作高质量的免费教育内容。"],
  ["احجز استشارة خاصة", "Book a private consultation", "预约私人咨询"],
  ["دروس خاصة", "Private lessons", "私人课程"],
  ["دروس خاصة مباشرة عبر واتساب", "Private lessons via WhatsApp", "通过 WhatsApp 预约私人课程"],
  ["مرحباً، أود الاستفسار عن حجز درس خاص.", "Hello, I would like to ask about booking a private lesson.", "您好，我想咨询预约私人课程。"],
  ["راسل الأستاذ مباشرة على واتساب لترتيب درس خاص.", "Message the instructor on WhatsApp to arrange a private lesson.", "通过 WhatsApp 联系导师，安排私人课程。"],
  ["تواصل عبر واتساب", "Contact on WhatsApp", "通过 WhatsApp 联系"],
  ["نعتذر، خدمة حجز الدروس الخاصة عبر واتساب غير متاحة حالياً. يُرجى المحاولة لاحقاً.", "Sorry, private lesson bookings via WhatsApp are currently unavailable. Please try again later.", "抱歉，目前无法通过 WhatsApp 预约私人课程，请稍后再试。"],
  ["الدورة المباشرة غير مفعّلة حالياً", "The live course is not currently active", "直播课程目前未开放"],
  ["تابعنا لمعرفة موعد الدورة القادمة.", "Follow us for the next course date.", "关注我们，了解下期课程时间。"],
  ["● مباشر الآن", "● Live now", "● 正在直播"],
  ["دورة VIP المباشرة", "VIP live course", "VIP 直播课程"],
  ["انضم للجلسة الآن ←", "Join the session now ←", "立即加入课程 ←"],
  ["رابط الجلسة خاص بكل مشترك — لا تشاركه، وسيتم تتبع الدخول.", "The session link is unique to each student. Do not share it; access is monitored.", "课程链接仅供本人使用，请勿分享；系统会记录访问情况。"], ["احجز استشارة", "Book a consultation", "预约咨询"],
  ["أرسل طلبك وسيتواصل معك الأستاذ لتحديد الموعد وطريقة الجلسة.", "Send your request and the instructor will contact you to arrange a time and format.", "提交申请后，导师将联系您安排时间和咨询方式。"],
  ["تم حفظ طلبك بنجاح — شكراً لك!", "Your request was sent successfully — thank you!", "申请已成功提交，感谢您！"], ["إرسال طلب آخر", "Send another request", "再次提交申请"],  ["الحقول مطلوبة", "Please complete the required fields.", "请填写必填字段。"],
  ["بيانات الدخول غير صحيحة", "Incorrect email or password", "邮箱或密码不正确"], ["البريد وكلمة المرور مطلوبان", "Email and password are required", "请输入邮箱和密码"], ["محاولات كثيرة، انتظر قليلاً", "Too many attempts. Please wait a moment.", "尝试次数过多，请稍后再试。"],
  ["تعذّر الاتصال بالخادم، حاول مرة أخرى.", "Could not connect to the server. Please try again.", "无法连接服务器，请重试。"],
  ["إعادة المحاولة", "Retry", "重试"],
  ["تعذّر تحميل هذه الصفحة، حاول مرة أخرى.", "Could not load this page. Please try again.", "无法加载此页面，请重试。"],
  ["تم الحفظ، لكن تعذّر تسجيله في سجل التغييرات", "Saved, but the change could not be recorded in the audit log.", "已保存，但未能记录到操作日志。"],
  ["الخدمة غير مهيأة حالياً، حاول مرة أخرى لاحقاً.", "This service is not configured yet. Please try again later.", "此服务尚未配置，请稍后重试。"],
  ["مبلغ غير صالح", "Invalid amount.", "金额无效。"],
  ["أدخل مبلغاً صحيحاً", "Enter a valid amount.", "请输入有效金额。"],
  ["تعذّر بدء عملية التبرع — تأكد من إعداد Stripe أو استخدم التحويل اليدوي.", "Could not start the donation. Check Stripe settings or use a manual transfer.", "无法开始捐赠，请检查 Stripe 设置或使用银行转账。"],
  ["تم استلام تأكيد التبرع، شكراً لدعمك.", "Your donation is confirmed. Thank you for your support.", "已收到捐赠确认，感谢您的支持。"], ["تبرع آخر", "Donate again", "再次支持"],
  ["الاسم", "Name", "姓名"], ["البريد الإلكتروني", "Email address", "电子邮箱"], ["رقم الجوال / واتساب", "Phone / WhatsApp", "电话 / WhatsApp"],
  ["إعادة النشر", "Redistribution", "转发"], ["محتوى الكورس", "Course content", "课程内容"],
  ["تعلّم", "Learn", "开始学习"], ["السعر", "Price", "价格"], ["إتمام الدفع", "Complete payment", "完成付款"],
  ["مبلغ آخر", "Other amount", "其他金额"], ["تبرع الآن", "Donate now", "立即支持"], ["الدفع الآمن عبر Stripe.", "Secure payment via Stripe.", "通过 Stripe 安全付款。"], ["الاسم (اختياري)", "Name (optional)", "姓名（可选）"], ["البريد (اختياري)", "Email (optional)", "邮箱（可选）"], ["جارٍ التحويل…", "Redirecting…", "正在跳转…"],
  ["رقم الهاتف / واتساب", "Phone / WhatsApp", "电话 / WhatsApp"], ["رسالتك", "Your message", "留言"], ["إرسال الطلب", "Send request", "提交申请"], ["ادعم المنصة 🎁", "Support the platform 🎁", "支持创作平台 🎁"],
  ["تبرعك يساعدنا على إنتاج محتوى تعليمي مجاني بجودة عالية.", "Your donation helps us produce high-quality free learning content.", "您的支持将帮助我们制作高质量的免费教育内容。"],
  ["الدخول إلى ملوكي", "Sign in to Malooky", "登录马卢基"], ["الحسابات تُنشأ من إدارة الأكاديمية أو بعد الشراء.", "Accounts are created by the academy or after purchase.", "账号由学院创建或在购买后开通。"],
  ["كلمة المرور", "Password", "密码"], ["جارٍ الدخول…", "Signing in…", "正在登录…"],
  ["دخول", "Sign in", "登录"],
  ["إنشاء حساب", "Create account", "创建账户"],
  ["ليس لديك حساب؟ أنشئ حساباً جديداً.", "New here? Create an account.", "还没有账户？创建新账户。"],
  ["لديك حساب بالفعل؟ سجّل الدخول.", "Already have an account? Sign in.", "已有账户？登录。"],
  ["أنشئ حساباً للبدء في التعلم.", "Create an account to start learning.", "创建账户，开始学习。"],
  ["إنشاء الحساب", "Create account", "创建账户"],
  ["إنشاء الحساب…", "Creating account…", "正在创建账户…"],
  ["يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", "Password must be at least 8 characters.", "密码至少需要 8 个字符。"],
  ["تعذّر إنشاء الحساب. تحقق من البيانات وحاول مجدداً.", "Could not create the account. Check your details and try again.", "无法创建账户，请检查信息后重试。"],
  ["تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده قبل تسجيل الدخول.", "Account created. Check your email to confirm it before signing in.", "账户已创建。请检查邮箱并确认后再登录。"],
  ["بيانات التسجيل غير صالحة", "Invalid sign-up details", "注册信息无效"], ["تابع تقدمك وكمّل من حيث توقفت.", "Track your progress and pick up where you left off.", "查看学习进度，并从上次停下的地方继续。"],
  ["لم تُسجّل في أي كورس بعد", "You are not enrolled in any courses yet", "您尚未报名任何课程"], ["تصفح الكورسات", "Browse courses", "浏览课程"],
  ["مستويات مكتملة", "levels completed", "阶段已完成"], ["ابدأ الكورس", "Start course", "开始课程"], ["متابعة التعلم", "Continue learning", "继续学习"],
  ["وصول جزئي", "Partial access", "部分访问权限"], ["الدورة المباشرة غير مفعّلة حالياً", "The live course is not currently active", "直播课程目前未开放"],
  ["تابعنا لمعرفة موعد الدورة القادمة.", "Follow us for the next course date.", "关注我们，了解下期课程时间。"], ["دورة VIP المباشرة", "VIP live course", "VIP 直播课程"],
  ["رابط الجلسة خاص بكل مشترك — لا تشاركه، وسيتم تتبع الدخول.", "The session link is unique to each student. Do not share it; access is monitored.", "课程链接仅供本人使用，请勿分享；系统会记录访问情况。"],
  ["كورس", "Course", "课程"], ["محتوى الكورس — المستويات", "Course content — levels", "课程内容 — 阶段"],
  ["المستويات متسلسلة: يُفتح المستوى التالي بعد إكمال السابق 100% (ما لم يمنحك الأستاذ استثناءً).", "Levels unlock in sequence after completing the previous level to 100%, unless the instructor grants an exception.", "阶段按顺序解锁：完成上一阶段 100% 后解锁下一阶段，导师批准例外情况除外。"],
  ["المستويات متسلسلة: تُفتح المرحلة التالية بعد إكمال السابقة 100% (إلا باستثناء من الأستاذ).", "Levels unlock in sequence after the previous one is 100% complete, unless the instructor grants an exception.", "完成上一阶段 100% 后解锁下一阶段，导师批准例外情况除外。"],
  ["تمارين (فيديوهات + درايف)", "Exercises (videos + Drive)", "练习（视频 + Drive）"], ["طريقة كتابة توضيحية", "Writing demonstrations", "书写示范"],
  ["الأخطاء الشائعة", "Common mistakes", "常见错误"], ["الفيد باك", "Feedback", "反馈"], ["عنصر", "items", "项"],
  ["محتوى الكورس", "Course content", "课程内容"], ["البث محمي — سجّل المشاهدة للبدء", "Secure stream — start playback to watch", "安全视频流 — 点击播放开始观看"],
  ["لغة الفيديو:", "Video language:", "视频语言："], ["العربية", "Arabic", "阿拉伯语"], ["مكتمل ✓", "Completed ✓", "已完成 ✓"],
  ["تحديد كمكتمل ✓", "Mark as complete ✓", "标记为已完成 ✓"], ["السابق", "Previous", "上一课"], ["التالي", "Next", "下一课"],
  ["المستوى التالي:", "Next level:", "下一阶段："], ["🎉 أنهيت الكورس بالكامل", "🎉 You completed the entire course", "🎉 您已完成全部课程"],
  ["رجوع", "Back", "返回"], ["مجاني", "Free", "免费"],  ["مستويات", "levels", "个阶段"], ["دروس", "lessons", "课时"],  ["طلاب", "students", "名学员"], ["مكتمل ✓", "Completed ✓", "已完成 ✓"], ["مكتمل", "Completed", "已完成"], ["ساعات", "hours", "小时"],
  ["التالي", "Next", "下一课"], ["السابق", "Previous", "上一课"], ["التقدم", "Progress", "学习进度"], ["المستوى", "Level", "阶段"], ["اللغة", "Language", "语言"], ["الاسم", "Name", "姓名"],
  ["فيديوهات محمية", "Protected videos", "加密视频"], ["كورس", "Course", "课程"], ["تمارين", "Exercises", "练习"], ["طريقة الكتابة", "Writing method", "书写方法"], ["الفيد باك", "Feedback", "反馈"], ["أكمل", "Complete", "完成"], ["لفتح", "to unlock", "解锁"], ["الفيديوهات محمية بعلامة مائية تحمل بياناتك — إعادة النشر مكشوفة الهوية.", "Videos are watermarked with your details; redistribution can be traced to you.", "视频带有您的个人水印，分享后可追溯身份。"], ["ماذا يتضمن هذا الكورس؟", "What does this course include?", "课程内容"],
  ["اختر اللغة", "Choose language", "选择语言"], ["القائمة", "Menu", "菜单"], ["اشترك الآن", "Enroll now", "立即报名"], ["السعر", "Price", "价格"],
  ["الطلاب", "Students", "学员"], ["نظرة عامة", "Overview", "概览"], ["طلبات التحويل", "Transfer requests", "转账申请"],
  ["الباقات والكوبونات", "Packages and coupons", "套餐与优惠券"], ["طرق الدفع", "Payment methods", "付款方式"], ["المحتوى التشويقي", "Featured content", "精选内容"],
  ["الاستشارات", "Consultations", "咨询"], ["التبرعات", "Donations", "捐赠"], ["سجل التغييرات", "Audit log", "操作日志"],
  ["فشل الإجراء", "Action failed", "操作失败"], ["تعذّر الاتصال بالخادم", "Could not connect to the server", "无法连接到服务器"], ["تم الحفظ ✓", "Saved ✓", "已保存 ✓"],
  ["إحصائيات سريعة", "Quick statistics", "快速统计"], ["طلاب:", "Students:", "学员："], ["الكورسات:", "Courses:", "课程："], ["المستويات:", "Levels:", "阶段："], ["الدروس:", "Lessons:", "课时："], ["التبرعات:", "Donations:", "捐赠："], ["طلبات تحتاج موافقتك", "Requests awaiting your approval", "等待您审核的申请"], ["الإثبات", "Proof", "凭证"],
  ["وضع الكورس الواحد / المتعدد", "Single / multiple course mode", "单课程 / 多课程模式"], ["وضع الكورس الواحد", "Single-course mode", "单课程模式"],
  ["طلبات معلّقة:", "Pending requests:", "待处理申请："], ["لا يوجد طلبات معلّقة ✓", "No pending requests ✓", "没有待处理申请 ✓"],
  ["منشور", "Published", "已发布"], ["مسودة", "Draft", "草稿"], ["نشر", "Publish", "发布"], ["إلغاء النشر", "Unpublish", "取消发布"],
  ["العنوان (عربي)", "Title (Arabic)", "标题（阿拉伯语）"],  ["Title (EN)", "Title (EN)", "标题（英语）"], ["البريد", "Email", "邮箱"], ["سبب (مثال: أكمل المستوى المتقدم)", "Reason (e.g. completed the advanced level)", "原因（例如：完成高级阶段）"], ["وصف قصير", "Short description", "简短描述"],
  ["رابط الغلاف", "Cover image URL", "封面图片链接"], ["اسم المستوى", "Level name", "阶段名称"], ["اسم المستوى الجديد (مثال: متقدم +)", "New level name (e.g. Advanced +)", "新阶段名称（例如：高级 +）"],
  ["عنوان الدرس", "Lesson title", "课时标题"], ["فيديو", "Video", "视频"], ["رابط درايف", "Drive link", "Drive 链接"], ["نص", "Text", "文本"],
  ["إضافة مشترك يدوياً", "Add student manually", "手动添加学员"], ["إنشاء الحساب", "Create account", "创建账号"], ["الطالب", "Student", "学员"],
  ["الدور", "Role", "角色"], ["الوصولات", "Access", "访问权限"], ["التقدم", "Progress", "进度"], ["طالب", "Student", "学员"], ["أدمن", "Admin", "管理员"],
  ["لا شيء", "None", "无"], ["درس مكتمل", "lessons completed", "课时已完成"], ["منح", "Grant", "授权"], ["سحب", "Revoke", "撤销"],
  ["منح وصول لـ", "Grant access to", "授予访问权限："], ["— كورس كامل —", "— Full course —", "— 完整课程 —"], ["كل المستويات", "All levels", "所有阶段"],
  ["الوصولات الحالية:", "Current access:", "当前权限："], ["مستوى", "Level", "阶段"], ["طلبات التحويل اليدوي (واتساب)", "Manual transfer requests (WhatsApp)", "手动转账申请（WhatsApp）"],
  ["واتساب", "WhatsApp", "WhatsApp"], ["عرض الإثبات", "View proof", "查看凭证"], ["الحالة", "Status", "状态"], ["التاريخ", "Date", "日期"], ["إجراء", "Action", "操作"],
  ["معلّق", "Pending", "待处理"], ["مقبول", "Approved", "已批准"], ["مرفوض", "Rejected", "已拒绝"], ["قبول", "Approve", "批准"], ["رفض", "Reject", "拒绝"], ["لا توجد طلبات.", "No requests.", "暂无申请。"],
  ["اسم الباقة", "Package name", "套餐名称"], ["السعر بالسنت (29900 = 299$)", "Price in cents (29900 = $299)", "价格（美分，29900 = 299 美元）"], ["إنشاء الباقة", "Create package", "创建套餐"],
  ["الباقات", "Packages", "套餐"], ["النطاق", "Scope", "范围"], ["مفعّلة", "Active", "已启用"], ["موقوفة", "Disabled", "已停用"], ["إيقاف", "Disable", "停用"], ["تفعيل", "Enable", "启用"],
  ["كوبونات الخصم", "Discount coupons", "折扣券"], ["CODE", "CODE", "CODE"], ["إضافة كوبون", "Add coupon", "添加优惠券"], ["مفعّلة ✓", "Active ✓", "已启用 ✓"],
  ["نص التعليق (عربي)", "Review text (Arabic)", "评价内容（阿拉伯语）"], ["اسم الطالب", "Student name", "学员姓名"], ["النجوم", "Stars", "星级"], ["إضافة تعليق", "Add review", "添加评价"],
  ["معروض", "Visible", "显示中"], ["مخفي", "Hidden", "已隐藏"], ["إخفاء", "Hide", "隐藏"], ["السبب (عربي)", "Reason (Arabic)", "原因（阿拉伯语）"], ["إضافة طالب", "Add student", "添加学员"],
  ["رابط الصورة", "Image URL", "图片链接"], ["تعليق", "Caption", "说明"], ["إضافة عمل", "Add work", "添加作品"], ["السؤال", "Question", "问题"], ["الجواب", "Answer", "答案"], ["إضافة سؤال", "Add question", "添加问题"],
  ["مفعّلة الآن", "Active now", "当前已启用"], ["غير مفعّلة", "Inactive", "当前未启用"], ["رابط الجلسة (Zoom/Meet)", "Session link (Zoom/Meet)", "课程链接（Zoom/Meet）"],
  ["لا توجد طلبات استشارة.", "No consultation requests.", "暂无咨询申请。"], ["جديد", "New", "新申请"], ["تم التواصل", "Contacted", "已联系"], ["مغلق", "Closed", "已关闭"], ["إغلاق", "Close", "关闭"],
  ["تغيير دور مستخدم", "Change user role", "更改用户角色"], ["منح وصول", "Grant access", "授予访问权限"], ["سحب وصول", "Revoke access", "撤销访问权限"], ["حفظ كورس", "Save course", "保存课程"],
  ["تغيير حالة نشر كورس", "Change course publishing status", "更改课程发布状态"], ["حفظ مستوى", "Save level", "保存阶段"], ["حذف مستوى", "Delete level", "删除阶段"], ["حفظ درس", "Save lesson", "保存课时"],
  ["حذف درس", "Delete lesson", "删除课时"], ["قبول طلب تحويل", "Approve transfer request", "批准转账申请"], ["رفض طلب تحويل", "Reject transfer request", "拒绝转账申请"],
  ["تحديث استشارة", "Update consultation", "更新咨询申请"], ["تحديث جلسة VIP", "Update VIP session", "更新 VIP 课程"], ["ربط فيديو", "Attach video", "关联视频"], ["إنشاء مستخدم", "Create user", "创建用户"],
];

const UI_COPY = Object.fromEntries(copyRows.map(([source, enText, zhText]) => [source, { ar: source, en: enText, zh: zhText }])) as Record<string, Record<Lang, string>>;
export const uiCopy = UI_COPY satisfies Record<string, Record<Lang, string>>;
export type UiCopyKey = keyof typeof uiCopy;

export function translate(lang: Lang, source: string): string {
  return uiCopy[source]?.[lang] ?? source;
}

/** Select authored content in the requested language, then English, then Arabic. */
export function localizedField(lang: Lang, fields: { ar?: string | null; en?: string | null; zh?: string | null }): string {
  const choices = lang === "ar" ? [fields.ar, fields.en, fields.zh] : lang === "zh" ? [fields.zh, fields.en, fields.ar] : [fields.en, fields.ar, fields.zh];
  return choices.find((value): value is string => Boolean(value?.trim())) ?? "";
}

export function formatDate(lang: Lang, date: Date): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "en", { dateStyle: "full", timeStyle: "short" }).format(date);
}

export type ApiErrorContext = "checkout" | "manual-order" | "video" | "login" | "signup" | "consult" | "donation" | "progress" | "dashboard" | "session";

const apiErrorFallbacks: Record<ApiErrorContext, Record<Lang, string>> = {
  checkout: {
    ar: "تعذّر بدء عملية الدفع، حاول مرة أخرى.",
    en: "Could not start checkout. Please try again.",
    zh: "无法开始付款，请重试。",
  },
  "manual-order": {
    ar: "تعذّر إرسال الطلب، حاول مرة أخرى.",
    en: "Could not submit the enrollment request. Please try again.",
    zh: "无法提交报名申请，请重试。",
  },
  video: {
    ar: "تعذّر تشغيل الفيديو، حاول مرة أخرى.",
    en: "Could not load the video. Please try again.",
    zh: "无法加载视频，请重试。",
  },
  login: {
    ar: "تعذّر تسجيل الدخول، حاول مرة أخرى.",
    en: "Sign-in failed. Please try again.",
    zh: "登录失败，请重试。",
  },
  signup: {
    ar: "تعذّر إنشاء الحساب، حاول مرة أخرى.",
    en: "Could not create your account. Please try again.",
    zh: "无法创建账户，请重试。",
  },
  consult: {
    ar: "تعذّر إرسال الطلب، حاول مرة أخرى.",
    en: "Submission failed. Please try again.",
    zh: "提交失败，请重试。",
  },
  donation: {
    ar: "تعذّر بدء التبرع، حاول مرة أخرى.",
    en: "Could not start the donation. Please try again.",
    zh: "捐赠未能开始，请重试。",
  },
  progress: {
    ar: "تعذّر حفظ التقدم، حاول مرة أخرى.",
    en: "Could not save your progress. Please try again.",
    zh: "无法保存学习进度，请重试。",
  },
  dashboard: {
    ar: "تعذّر تنفيذ الإجراء، حاول مرة أخرى.",
    en: "The action failed. Please try again.",
    zh: "操作失败，请重试。",
  },
  session: {
    ar: "تعذّر التحقق من الجلسة، حاول تحديث الصفحة.",
    en: "Could not verify your session. Please refresh the page.",
    zh: "无法验证登录状态，请刷新页面。",
  },
};

const apiErrorCopy: Record<string, Partial<Record<Lang, string>>> = {
  "تسجيل الدخول مطلوب": { en: "Please sign in first.", zh: "请先登录。" },
  "الكورس غير موجود": { en: "Course not found.", zh: "未找到课程。" },
  "نوع غير معروف": { en: "Unknown checkout type.", zh: "未知的付款类型。" },
  "الدفع غير متاح حالياً، حاول مرة أخرى لاحقاً.": { en: "Payments are unavailable right now. Please try again later.", zh: "暂时无法付款，请稍后再试。" },
  "طلبات كثيرة": { en: "Too many requests. Please wait a moment.", zh: "请求过多，请稍后再试。" },
  "طلبات كثيرة جداً": { en: "Too many requests. Please wait a moment.", zh: "请求过多，请稍后再试。" },
  "الحقول والإثبات مطلوبة": { en: "Please provide the required details and proof of payment.", zh: "请填写必填信息并上传付款凭证。" },
  "ارفع صورة إثبات التحويل واكتب رقم واتساب": { en: "Upload proof of payment and enter your WhatsApp number.", zh: "请上传付款凭证并填写 WhatsApp 号码。" },
  "حجم الصورة كبير (الحد 8MB)": { en: "The image is too large (8 MB maximum).", zh: "图片过大（最大 8 MB）。" },
  "إعدادات Bunny غير مكتملة — أضف مفاتيح البيئة (BUNNY_LIBRARY_ID, BUNNY_STREAM_KEY, BUNNY_TOKEN_AUTH_KEY)": {
    en: "Video streaming is not configured. Please contact support.",
    zh: "视频播放服务尚未配置，请联系支持团队。",
  },
  "lessonId مطلوب": { en: "A lesson is required to load this video.", zh: "缺少课时信息，无法加载视频。" },
  "الدرس غير موجود": { en: "Lesson not found.", zh: "未找到课时。" },
  "المستوى غير موجود": { en: "Course level not found.", zh: "未找到课程阶段。" },
  "الكورس غير متاح": { en: "This course is unavailable.", zh: "此课程暂不可用。" },
  "غير مصرّح — أكمل المستوى السابق أو سجّل في الكورس": {
    en: "You do not have access to this lesson. Complete the previous level or enroll in the course.",
    zh: "您无权访问此课时。请完成上一阶段或报名课程。",
  },
  "لا يوجد فيديو مرفوع لهذه اللغة بعد": { en: "No video is available in this language yet.", zh: "此语言版本的视频暂不可用。" },
};

export function localizeApiError(lang: Lang, source: unknown, context: ApiErrorContext): string {
  if (typeof source !== "string") return apiErrorFallbacks[context][lang];
  if (lang === "ar") return source;
  if (source.trim().length === 0) return apiErrorFallbacks[context][lang];
  const knownCopy = uiCopy[source]?.[lang] ?? apiErrorCopy[source]?.[lang];
  return knownCopy ?? apiErrorFallbacks[context][lang];
}

export function pageDescription(lang: Lang): string {
  const descriptions: Record<Lang, string> = {
    ar: "منصة ملوكي التعليمية لتعلم فن الكاليجرافيتي العربي — كورسات مصورة باحترافية مع متابعة وتقييم مباشر.",
    en: "Learn Arabic calligraffiti through professionally produced courses, with step-by-step instruction and direct feedback.",
    zh: "通过专业课程学习阿拉伯书法涂鸦，循序渐进，并获得导师的直接指导与反馈。",
  };
  return descriptions[lang];
}

export function openGraphLocale(lang: Lang): string {
  return lang === "ar" ? "ar_AR" : lang === "zh" ? "zh_CN" : "en_US";
}

export function pageTitle(lang: Lang, pathname: string): string {
  const titles: Record<string, string> = {
    "/": lang === "zh" ? "阿拉伯书法涂鸦学院" : lang === "en" ? "Arabic Calligraffiti Academy" : "أكاديمية الكاليجرافيتي العربي",
    "/courses": translate(lang, "الكورسات"), "/login": dict[lang].login, "/consult": translate(lang, "دروس خاصة"),
    "/donate": dict[lang].nav_donate, "/my": dict[lang].my_courses, "/vip": dict[lang].nav_vip, "/dash": dict[lang].dash,
  };
  const exact = titles[pathname] || (pathname.startsWith("/courses/") ? translate(lang, "كورس") : pathname.startsWith("/learn/") ? dict[lang].continue_learning : dict[lang].brand);
  if (pathname === "/") {
    return lang === "zh" ? "马卢基 | 阿拉伯书法涂鸦学院" : lang === "en" ? "Malooky | Arabic Calligraffiti Academy" : "ملوكي | أكاديمية الكاليجرافيتي العربي";
  }
  return `${exact} | ${lang === "zh" ? "马卢基" : lang === "en" ? "Malooky" : "ملوكي"}`;
}

export function pageMetadata(lang: Lang, pathname: string): { title: string; description: string; locale: string } {
  return {
    title: pageTitle(lang, pathname),
    description: pageDescription(lang),
    locale: openGraphLocale(lang),
  };
}

export function t(lang: Lang): Dict {
  return dict[lang];
}
export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
