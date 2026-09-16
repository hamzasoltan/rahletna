# رحلتنا — V2.6

تطبيق **رحلتنا — أفضل نسخة من نفسي**: نظام متابعة شخصي لشخصين، كل واحد مسؤول عن خطواته، مع إمكانية مشاركة الرحلة مع شريك.

## ما يتضمنه الإصدار الحالي

### الأساس
- React + TypeScript + Vite.
- Supabase Auth + Database + Realtime + Storage.
- واجهة عربية RTL، Mobile First، Dark/Light Mode.
- مهام يومية: إضافة، إتمام، حذف، تصنيف، أولوية، وقت، وربط بهدف.
- RLS بحيث لا يستطيع الشريك تعديل أو إتمام مهام الطرف الآخر.

### V2.1
- أهداف مع مراحل Milestones.
- عادات مع تسجيل يومي.
- History / Calendar.

### V2.2
- Smart Dashboard.
- Weekly Review.
- Achievements.

### V2.3
- Solo Mode.
- Gender-aware Arabic UI.
- Partner View للقراءة فقط.
- Avatar/profile improvements.
- إصلاحات أزرار التنقل والربط.

### V2.4
- Reactions على رسائل التشجيع: ❤️ 🔥 👏 💪 ⭐.
- Notifications.
- Unread counter.
- Mark one/all as read.
- Realtime للإشعارات والتفاعلات.
- RLS للتفاعلات والإشعارات.

### V2.6
- إصلاح Bug تاريخ المهمة عند الانتقال بين الأيام.
- كل date-only values تستخدم Local Date Key بصيغة `YYYY-MM-DD`.
- إضافة المهمة تستخدم `today()` وقت الضغط الفعلي على زر الإضافة.
- تحديث اليوم تلقائيًا عند focus/visibility وكل 30 ثانية.
- تحميل المهام بنطاق `[بداية الشهر، بداية الشهر التالي)`.
- إصلاح الـ Streak والـ History والعادات لتجنب انزياح اليوم.
- قائمة المهام لها مساحة ثابتة وVertical Scroll داخلي بدل تمديد الصفحة.
- كروت خطواتي اليوم ورحلة الشريك متساوية الارتفاع داخل الـ grid.
- Database default لـ `task_date` أصبح صريحًا على توقيت `Africa/Cairo` بدون تعديل الداتا القديمة.

## Supabase migrations

شغّل migrations بالترتيب:

1. `001_init.sql`
2. `002_v2_1.sql`
3. `003_v2_3.sql`
4. `004_v2_4.sql`
5. `005_v2_6_date_default.sql`

> الـ migration رقم 005 لا يغيّر المهام القديمة؛ هو فقط يضبط القيمة الافتراضية للمهام التي لا ترسل `task_date`.

## التشغيل

أنشئ `.env.local` في جذر المشروع:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

ثم:

```bash
npm install
npm run dev
```

## ملاحظة عن اختبار هذه النسخة

تم فحص بنية المشروع والـ ZIP والملفات المصدرية، كما تم فحص TypeScript مبدئيًا. تعذر إكمال `npm install` داخل بيئة التنفيذ بسبب انتهاء المهلة، لذلك لا يُعتبر `npm run build` أو اختبار Browser/Supabase Integration اختبارًا ناجحًا هنا.
