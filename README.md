# 🛡️ WhatsApp Group Moderator & Admin Assistant Bot
### بوت إدارة ومراقبة مجموعات واتساب الذكي المتكامل

نظام متكامل ومجهز للإنتاج (Production-Ready) لإدارة ومراقبة مجموعات WhatsApp تلقائياً، مبني بأحدث تقنيات **Node.js, TypeScript, Express, Prisma ORM, React (Vite), Tailwind CSS** مع محرك رقابة لغوي متقدم يدعم خصائص اللغة العربية والتطبيع الدلالي، ومحرك قواعد سريع في الذاكرة (In-Memory Cache) بسرعة استجابة أقل من 1ms.

---

## 🌟 المميزات الأساسية (Core Features)

1. **مراقبة الرسائل الفورية**: فحص كافة الرسائل الواردة في المجموعات المحددة عبر الـ WhatsApp Adapter.
2. **محرك معالجة النصوص العربية المتقدم (`ArabicNormalizer`)**:
   - توحيد أشكال الألف (`أ`, `إ`, `آ`, `ٱ` إلى `ا`).
   - توحيد التاء المربوطة والهاء (`ة` إلى `ه`).
   - توحيد الياء والألف المقصورة (`ى`, `ي` إلى `ي`).
   - إزالة كافة حركات التشكيل والتنوين والشدة والرموز القرآنية.
   - إزالة علامات التطويل والتكشيدة (`ـ`).
   - تنظيف المحارف المخفية (Zero-width characters) وتكرار الأحرف الزائد.
3. **نظام القواعد والكلمات الممنوعة (Rules Engine)**:
   - تصنيفات متعددة: `SPAM`, `INSULT`, `ADVERTISEMENT`, `PROFANITY`, `HARASSMENT`, `CUSTOM`.
   - مستويات خطورة: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
   - دعم الكلمات، العبارات، والتعابير النمطية (Regex).
   - قائمة استثناءات وعبارات مصرح بها (Exceptions Whitelist).
4. **نظام فحص الروابط والنطاقات المستثناة (URL Detector)**:
   - منع الروابط غير المصرح بها مع دعم قائمة النطاقات المسموحة (مثل `youtube.com`, `github.com`).
5. **كاشف الإعلانات وأرقام الهواتف (Ads & Contact Detector)**:
   - اكتشاف العروض التسويقية وأرقام الهواتف العربية والدولية.
6. **الرقابة بالذكاء الاصطناعي (AI Moderation - اختياري)**:
   - دعم تكامل اختياري مع OpenAI GPT-4o-mini و Google Gemini لتحليل السياق الدلالي مع نظام قاطع الدورة (Circuit Breaker) والـ Fallback التلقائي.
7. **نظام المخالفات والعقوبات التصاعدي**:
   - المخالفة 1: تحذير أول وتنبيه المشرف.
   - المخالفة 2: تحذير مشدد (2/3).
   - المخالفة 3: حذف الرسالة + تطبيق الإجراء الإداري التلقائي (`WARN`, `MUTE`, `KICK`).
8. **نظام التنبيهات متعدد القنوات**:
   - إرسال تقرير مفصل للأدمن يحتوي على (اسم العضو، رقمه، نص الرسالة، القاعدة المخترقة، الإجراء، والوقت).
   - دعم: WhatsApp Direct Alert, Telegram Bot, Email (SMTP), Webhook (Discord).
9. **أوامر الإدارة من داخل المجموعة (Admin Commands)**:
   - `!rules` (عرض القوانين للجميع).
   - `!status` (فحص حالة البوت).
   - `!warnings` (عرض سجل مخالفات العضو).
   - `!addword <كلمة>` (إضافة كلمة ممنوعة فوراً).
   - `!delword <كلمة>` (حذف كلمة من الممنوعات).
   - `!moderation on/off` (تشغيل أو إيقاف المراقبة بالمجموعة).
10. **لوحة تحكم عصرية كاملة (React + Tailwind CSS + RTL)**:
    - إحصائيات حية، إدارة المجموعات، إدارة الكلمات، سجل المخالفات، قائمة الأعضاء، ومحاكي رسائل تفاعلي لاختبار القواعد مباشرة.

---

## 🏗️ معمارية النظام (System Architecture)

```text
               +----------------------------------+
               |        WhatsApp Providers        |
               | (Simulator / Baileys / CloudAPI) |
               +-----------------+----------------+
                                 |
                                 v
               +-----------------+----------------+
               |         Incoming Message         |
               +-----------------+----------------+
                                 |
               +-----------------v----------------+
               |        Message Processor         |
               +--------+----------------+--------+
                        |                |
             [Admin Command?]      [Group Monitored?]
                        |                |
                        v                v
               +--------+-------+  +-----+--------+
               | CommandHandler |  | Rules Engine |
               +----------------+  +-----+--------+
                                         |
                        +----------------+----------------+
                        |                |                |
                        v                v                v
                 ArabicNormalizer   UrlDetector      AdsDetector
                        |                |                |
                        +----------------+----------------+
                                         |
                             [Violation Detected?]
                                         |
                                         v
                        +----------------+----------------+
                        |       Violations Manager        |
                        +----------------+----------------+
                                         |
                        +----------------+----------------+
                        |                |                |
                        v                v                v
                  Delete Msg       Send Warning     Notify Admin
               (WhatsApp Adapter) (WhatsApp Group) (Telegram/WA/Email)
```

---

## 🚀 متطلبات التشغيل (Prerequisites)

- **Node.js**: إصدار 20 LTS أو أحدث.
- **npm** أو **pnpm** أو **yarn**.
- **PostgreSQL** أو حساب **Supabase** (أو Docker لتشغيل قاعدة البيانات بضغطة زر).

---

## 🛠️ خطوات التثبيت والتشغيل المحلي على Windows 11 / VS Code

### الخطوة 1: استنساخ المستودع والدخول للمجلد
```powershell
cd C:\Users\makte\.gemini\antigravity-ide\scratch\whatsapp-group-moderator
```

### الخطوة 2: تثبيت حزم الـ Backend
```powershell
npm install
```

### الخطوة 3: إعداد متغيرات البيئة (`.env`)
قم بنسخ ملف `.env.example` إلى `.env`:
```powershell
cp .env.example .env
```
تأكد من ضبط المتغيرات المناسبة (قاعدة البيانات، مفاتيح JWT، نوع المزود `WHATSAPP_PROVIDER=simulator`).

### الخطوة 4: تجهيز قاعدة البيانات والبيانات الأولية (Prisma)
```powershell
# إنشاء جداول قاعدة البيانات
npm run prisma:db:push

# إدخال البيانات والكلمات التجريبية وحساب المشرف
npm run prisma:seed
```

> **بيانات حساب المشرف الافتراضي:**
> - البريد: `admin@moderator.local`
> - كلمة المرور: `AdminSecurePassword123!`

### الخطوة 5: تثبيت وتشغيل لوحة التحكم (Frontend)
في نافذة Terminal جديدة:
```powershell
cd frontend
npm install
npm run dev
```
ستعمل لوحة التحكم على: **`http://localhost:5173`**

### الخطوة 6: تشغيل خادم الـ Backend
في نافذة الـ Terminal الرئيسية:
```powershell
npm run dev
```
سيعمل الخادم على: **`http://localhost:4000`**

---

## 🧪 تشغيل الاختبارات التلقائية (Testing with Vitest)

تم توفير حزمة اختبارات شاملة تغطي كافة وظائف التطبيع، كشف الروابط، القواعد، ونظام المخالفات:
```powershell
npm test
```

---

## 🐳 التشغيل باستخدام Docker Compose

لتشغيل كامل النظام (قاعدة بيانات PostgreSQL + Backend + Frontend Dashboard) بأمر واحد:
```powershell
docker-compose up -d --build
```
- لوحة التحكم: `http://localhost:5173`
- الخادم والـ API: `http://localhost:4000`
- قاعدة البيانات: `localhost:5432`

---

## 📡 واجهات الـ REST API الرئيسية

| المسار | الطريقة | الوصف |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | تسجيل دخول المشرف واستلام JWT Token |
| `/api/stats/dashboard` | `GET` | إحصائيات لوحة التحكم ومعدلات المخالفات الحية |
| `/api/groups` | `GET` | جلب قائمة المجموعات المراقبة |
| `/api/groups/:id/settings` | `PUT` | تحديث سياسات وإعدادات المجموعة |
| `/api/words` | `GET / POST` | جلب وإضافة الكلمات الممنوعة |
| `/api/words/:id` | `PUT / DELETE` | تعديل أو حذف كلمة ممنوعة |
| `/api/violations` | `GET` | جلب سجل المخالفات مع خيارات الفلترة المتقدمة |
| `/api/violations/members` | `GET` | قائمة الأعضاء ورصيد مخالفات كل عضو |
| `/api/simulator/message` | `POST` | إرسال رسالة تجريبية وفحص الرد الفوري |
| `/api/webhook` | `GET / POST` | نقطة استقبال Meta WhatsApp Cloud API Webhooks |

---

## 📜 الترخيص (License)
هذا المشروع مرخص تحت رخصة **MIT License**.
