# رحلتنا — أفضل نسخة من نفسي v2

نسخة React + TypeScript + Vite + Supabase. التطبيق ليس mock: كل البيانات بعد ضبط Supabase تُحفظ في PostgreSQL مع Auth وRLS.

## التشغيل
1. أنشئ مشروع Supabase.
2. افتح SQL Editor وشغّل `supabase/migrations/001_init.sql`.
3. انسخ `.env.example` إلى `.env.local` وضع Project URL وPublishable Key.
4. `npm install`
5. `npm run dev`

Supabase حاليًا يوصي باستخدام `VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` مع `@supabase/supabase-js` في تطبيقات Vite/React.

## ما تم
- Email/password Auth
- Profiles
- إنشاء/استخدام كود دعوة وربط شخصين
- RLS تمنع تعديل بيانات الشريك
- Tasks يومية + حالات + أولوية + وقت + تصنيف
- Goals + Habits schema
- History + streak
- Partner read-only view
- Encouragements
- Dark mode
- Responsive RTL UI

## ملاحظات الإنتاج
- لا تضع أي service-role key في الواجهة.
- راجع إعدادات Email Confirmation وRedirect URLs في Supabase قبل النشر.
- يمكن إضافة Storage للصور وRealtime في المرحلة التالية.
