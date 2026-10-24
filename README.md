# TilImlo — Yangilangan O‘zbek Lotin Alifbosi (2026), Kirill Tarjimoni va Morfologik Tahlil Platformasi

[![Website](https://img.shields.io/badge/Website-tilimlo.uz-1d4ed8?style=flat-square)](https://tilimlo.uz)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Express-Full--Stack-339933?style=flat-square&logo=node.js)](https://nodejs.org/)

**TilImlo** (`tilimlo.uz`) — O‘zbek tilining **2026-yilgi takomillashtirilgan lotin alifbosi (`Ö ö`, `Ğ ğ`, `Ş ş`, `Ç ç`)**, **amaldagi 1995-yilgi lotin yozuvi (`O‘ o‘`, `G‘ g‘`, `Sh sh`, `Ch ch`)** va **kirill yozuvi (`Ў ў`, `Ғ ғ`, `Ш ш`, `Ч ч`)** o‘rtasida yuqori aniqlikda o‘girish, imlo xatolarini tekshirish, grafik morfologik tahlil qilish hamda sun’iy intellekt yordamida tilshunoslik maslahatlarini olish uchun mo‘ljallangan zamonaviy veb-platforma.

---

## Asosiy Imkoniyatlar (6 ta Modul)

Platforma foydalanuvchi qulayligi va yuqori tezlikni ta’minlash maqsadida **6 ta mustaqil sahifaga (SPA modullariga)** ajratilgan:

### 1. `01. Tarjimon va Imlo` — Uch Yozuvli Konvertor va Imlo Tekshiruv
- **3 Yozuv o‘rtasida lahzali o‘girish**:
  - **2026 Yangilangan Lotin**: `Öğirlik va şijoat barcha çoraklarda öz samarasini körsatdi.`
  - **1995 Amaldagi Lotin**: `O‘g‘irlik va shijoat barcha choraklarda o‘z samarasini ko‘rsatdi.`
  - **Kirill Yozuvi**: `Ўғирлик ва шижоат барча чоракларда ўз самарасини кўрсатди.`
- **Avto-aniqlash (Auto-detect)**: Kiritilgan matn qaysi alifboda ekanligini avtomatik aniqlaydi.
- **Noformal yozuvni aqlli tiklash**: Apostrofsiz (`'` siz) yozilgan so‘zlarni (`sozlarni -> sözlarni`, `togrisidagi -> töğrisidagi`, `oquvchi -> öquvçi`, `ozbekiston -> özbekiston`) kontekst va o‘zak lug‘ati asosida avtomatik tiklaydi.
- **Imlo va X/H tekshiruvi**: X/H harflari almashib ketishi (`xozir -> hozir`, `hamkor`, `xabar`), tutuq belgisi (`ma’no`, `ta’lim`, `jur’at`) va bo‘g‘in ko‘chirish qoidalarini tekshiradi.
- **Ovozli o‘qish (TTS) va Ovozdan matnga (STT)**: O‘zbek tilida tabiiy ovozli talaffuz hamda mikrofon orqali matn kiritish.
- **Maxsus 2026 Virtual Klaviaturasi**: `Ö`, `Ğ`, `Ş`, `Ç`, `’` harflarini tez kiritish paneli.

### 2. `02. Morfologik Tahlil` — O‘zak va Qo‘shimchalar Grafik Diagrammasi
- Har bir kiritilgan o‘zbekcha so‘zni tarkibiy morfemalarga ajratadi:
  - **`Özak [∩]`** (Ko‘k blok) — so‘zning tub lug‘aviy ma’nosi.
  - **`Söz yasovçi [∧]`** (Binafsha blok) — yangi lug‘aviy ma’no hosil qiluvchi qo‘shimchalar (`-çi`, `-lik`, `-dosh`, `-kor`, `-la` va h.k.).
  - **`Luğaviy şakl [△]`** (Zumrad blok) — ko‘plik (`-lar`), erkalash-kichraytirish, daraja va fe’l nisbatlari.
  - **`Sintaktik şakl [▭]`** (Kahrabo blok) — egalik (`-im`, `-ing`, `-i`) va kelishik (`-ning`, `-ni`, `-ga`, `-da`, `-dan`) hamda shaxs-son qo‘shimchalari.
- **Interaktiv SVG Daraxt Diagrammasi**: So‘zning o‘zakdan boshlab qanday tartibda yasalganligini (Derivation Flow) va har bir morfemaning grammatik vazifasini grafik ko‘rinishda namoyish etadi.

### 3. `03. Uç Yozuvli Luğat` — Imlo va Morfemik Lug‘at
- So‘zlarni bir vaqtning o‘zida **2026 Lotin**, **1995 Lotin** va **Kirill** yozuvlarida qidirish.
- Har bir so‘z uchun bo‘g‘inlarga ajratish (`bo‘-g‘in`), so‘z turkumi, ma’nosi va talaffuz audiolarini ko‘rsatish.
- Foydalanuvchi tomonidan yangi so‘z qo‘shish va mavjud lug‘at bazasini boyitish imkoniyati (`localStorage` xotirasida saqlanadi).

### 4. `04. AI Savol-Javob Chatbot` — Sun’iy Intellekt Tilshunos Maslahatchisi
- O‘zbek tili imlo qoidalari, 2026-yilgi alifbo islohoti, paronimlar, sinonimlar va murakkab grammatik savollar bo‘yicha real vaqtda javob beruvchi AI yordamchi.
- Barcha AI so‘rovlari xavfsiz server-side proxy (`/api/ai/chat`, `/api/ai/proofread`, `/api/ai/lexicon`) orqali amalga oshiriladi.

### 5. `05. Maşqlar` — 2026 Alifbo va Imlo Viktorinasi
- Yangi diacritik harflar (`Ö`, `Ğ`, `Ş`, `Ç`), X/H farqlari va tutuq belgisi bo‘yicha interaktiv test mashqlari.
- Har bir javobdan so‘ng batafsil filologik izoh va ballar hisoboti.

### 6. `06. 2026 Qoidalar` — 29 Harfli Alifbo Qo‘llanmasi
- O‘zbek lotin alifbosining barcha 29 ta harfi, IPA fonetik transkripsiyasi, 1995-yilgi va Kirill muqobillari hamda audio namunalar jadvali.

---

## 2026-yilgi O‘zbek Lotin Alifbosi O‘zgarishlari Jadvali

Islohotning asosiy maqsadi — **bir tovushga bir harf** tamoyilini to‘liq qaror toptirish hamda apostrof (`‘`) bilan bog‘liq texnik muammolarni bartaraf etishdir:

| Tovush tavsifi | 2026 Yangilangan Lotin | 1995 Amaldagi Lotin | Kirill Yozuvi | IPA Transkripsiya | Misol (2026 / 1995 / Kirill) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| O‘rta-keng, lablangan unli | **`Ö ö`** | `O‘ o‘` | `Ў ў` | `/ø/`, `/ɵ/` | **Özbekiston** / O‘zbekiston / Ўзбекистон |
| Chuqur til orqa, sirg‘aluvchi undosh | **`Ğ ğ`** | `G‘ g‘` | `Ғ ғ` | `/ʁ/` | **Ğalaba** / G‘alaba / Ғалаба |
| Til oldi, shovqinli sirg‘aluvchi | **`Ş ş`** | `Sh sh` | `Ш ш` | `/ʃ/` | **Şahar** / Shahar / Шаҳар |
| Til oldi, qorishiq portlovchi | **`Ç ç`** | `Ch ch` | `Ч ч` | `/tʃ/` | **Çiroq** / Chiroq / Чироқ |

> **Eslatma**: `ng` harf birikmasi (`/ŋ/` burun tovushi, masalan: *ko‘ngil -> köngil*) hamda arabcha o‘zlashmalardagi tutuq belgisi (`’`, masalan: *ma’no*, *ta’lim*) o‘zgarishsiz saqlab qolingan.

---

## Texnologik Stek

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons
- **Backend / API Proxy**: Node.js, Express (`server.ts`), `@google/genai` SDK (`gemini-3-flash-preview`)
- **Lingvistik Dvigatel**: Custom deterministik transliteratsiya, fonetik X/H tekshiruvchi va morfemik analizator (`src/utils/uzbekLinguistics.ts`)
- **Xavfsizlik va Maxfiylik**:
  - Server-side API kalit himoyasi (`GEMINI_API_KEY` hech qachon brauzerga uzatilmaydi)
  - XSS sanitizatsiyasi, HTTP Security Headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) va API Rate-Limiting
  - F12 / DevTools klavishlari va kontekst menyusi himoyasi (`src/components/SecurityPrivacyManager.tsx`)
  - Maxfiylik siyosati va Cookie rozilik banneri (foydalanuvchi matnlari faqat mahalliy `localStorage` da saqlanadi)
- **Testlash**: Node.js built-in test runner (`node:test` + `tsx`)

---

## Loyihani Ishga Tushirish (Installation & Setup)

### 1. Talablar
- **Node.js** `v20+` (yoki `v22+`)
- **npm** `v10+`

### 2. Paketlarni o‘rnatish
```bash
git clone https://github.com/your-username/tilimlo.git
cd tilimlo
npm install
```

### 3. Muhit o‘zgaruvchilarini (`.env`) sozlash
Loyiha ildizida `.env` faylini yarating (`.env.example` asosida):

```env
# AI Tilshunos va chuqur tahrir funksiyalari uchun Google Gemini API kaliti
GEMINI_API_KEY="sizning_gemini_api_kalitingiz"
```
*(Agar `GEMINI_API_KEY` kiritilmagan bo‘lsa ham, 3 yozuvli tarjimon, imlo tekshiruv, morfologik tahlil, lug‘at va mashqlar to‘liq lokal rejimda ishlayveradi).*

### 4. Development rejimida ishga tushirish
```bash
npm run dev
```
Ilova `http://localhost:3000` manzilida ishga tushadi.

### 5. Production uchun yig‘ish (Build)
```bash
npm run build
npm start
```

---

## Avtomatlashtirilgan Testlar (Unit Tests)

Lingvistik konvertor, noformal apostrofsiz so‘zlarni tiklash, morfologik tahlil, kirill-lotin qoidalari hamda xavfsizlik/sanitizatsiya funksiyalarini tekshirish uchun:

```bash
npx tsx --test src/utils/uzbekLinguistics.test.ts src/utils/securityUtils.test.ts
```

Testlar qamrovi:
- 2026 Lotin <-> 1995 Lotin <-> Kirill ikki tomonlama konvertatsiyasi
- `Ye / Yo / Yu / Ya` va `Е / Э / Ц` pozitsion kirill qoidalari
- Apostrofsiz (`sozlarni`, `togrisidagi`, `oquvchi`) matnlarni avtomatik tiklash
- So‘zni o‘zak va qo‘shimchalarga (`Özak`, `Söz yasovçi`, `Luğaviy şakl`, `Sintaktik şakl`) ajratish
- XSS sanitizatsiyasi, kalit maskalash va Cookie ruxsatlari

---

## Loyiha Tuzilmasi (Project Structure)

```text
├── public/
│   ├── favicon.svg              # TilImlo vektor logotipi
│   ├── og-banner.svg            # Ijtimoiy tarmoqlar uchun OpenGraph banneri
│   ├── robots.txt               # Qidiruv tizimlari (Google/Yandex) uchun yo'riqnoma
│   └── sitemap.xml              # Uch yozuvli SEO Sitemap
├── src/
│   ├── components/
│   │   ├── TranslatorWorkspace.tsx         # 01. Uch yozuvli tarjimon va imlo tekshiruv
│   │   ├── MorphologicalDiagramSection.tsx # 02. Grafik morfologik tahlil va SVG daraxt
│   │   ├── DictionaryView.tsx              # 03. Uch yozuvli interaktiv lug'at
│   │   ├── AiLinguistChatView.tsx          # 04. AI Tilshunos savol-javob chatboti
│   │   ├── ExercisesView.tsx               # 05. 2026 Imlo mashqlari va viktorina
│   │   ├── AlphabetGuideView.tsx           # 06. 29 harfli 2026 alifbo qo'llanmasi
│   │   ├── TriScriptSeoSection.tsx         # Qidiruv tizimlari uchun 3 yozuvli ma'lumotnoma
│   │   └── SecurityPrivacyManager.tsx      # Cookie banner, Maxfiylik modal va F12 himoyasi
│   ├── data/
│   │   └── uzbekLinguisticsData.ts         # Alifbo jadvali, lug'at bazasi, morfemalar va mashqlar
│   ├── utils/
│   │   ├── uzbekLinguistics.ts             # Konvertor, imlo va morfologik tahlil algoritmlari
│   │   ├── uzbekLinguistics.test.ts        # Lingvistik unit testlar
│   │   ├── securityUtils.ts                # Sanitizatsiya, xavfsizlik va maxfiylik yordamchilari
│   │   ├── securityUtils.test.ts           # Xavfsizlik unit testlari
│   │   └── speechUtils.ts                  # Ovozli o'qish (TTS) yordamchisi
│   ├── App.tsx                             # Asosiy SPA yo'naltiruvchi va navigatsiya
│   ├── index.css                           # Tailwind v4 va zamonaviy apparat-tezlashtirilgan animatsiyalar
│   └── main.tsx                            # React kirish nuqtasi
├── server.ts                               # Express server, xavfsizlik sarlavhalari va AI API proxy
├── index.html                              # SEO meta-teglar va JSON-LD Schema.org strukturasi
└── package.json
```

---

## Litsenziya

Ushbu loyiha ta’lim, ilmiy-filologik tadqiqotlar va o‘zbek tilining raqamli rivoji uchun ochiq manbali (MIT) shaklda taqdim etilgan.
