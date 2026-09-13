# رحلتنا — V2.3 Buttons & UI Fix

نسخة كاملة من المشروع مع إصلاح واجهة الشريك والربط.

## أهم الإصلاحات
- أزرار الانتقال إلى صفحة الشريك مرتبطة مباشرة بحالة التطبيق.
- زر الرجوع للرئيسية داخل صفحة الشريك.
- زر إنشاء كود الدعوة واضح ويعرض حالة التحميل.
- زر نسخ كود الدعوة مع رسالة نجاح/فشل.
- خانة كود الدعوة وزر الانضمام في صف منظم ومتجاوب.
- حالة انتظار الطرف الآخر ظاهرة بوضوح.
- تحسين تنسيق كارت ربط الشريك وصفحة الشريك على الموبايل والكمبيوتر.

## التشغيل
احتفظ بملف `.env.local` الخاص بك في جذر المشروع، ثم:

```bash
npm install
npm run dev
```

متغيرات البيئة المطلوبة:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

لا يوجد SQL جديد مطلوب لهذا التعديل.

## V2.4 — Reactions & Notifications

- إضافة Reactions على رسائل التشجيع: ❤️ 🔥 👏 💪 ⭐.
- منع تكرار نفس Reaction من نفس المستخدم على نفس الرسالة.
- إضافة Notifications للتشجيع والتفاعل.
- عداد غير المقروء + تعليم إشعار واحد أو كل الإشعارات كمقروءة.
- Realtime للإشعارات والتفاعلات.
- RLS على `encouragement_reactions` و`notifications`.
- Migration جديدة: `supabase/migrations/004_v2_4.sql`.

> يجب تشغيل Migration 004 على مشروع Supabase قبل استخدام خصائص V2.4.


## V2.5 — Theme Engine
- Personal theme editor and JSON import/export
- Shared theme request flow for connected partners
- Partner consent before activating a shared theme
- Realtime synchronization for themes, requests, and settings
