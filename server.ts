import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from '@google/genai';
import {
  normalizeToNewUzbekLatin,
  applyAllOrthographyFixes,
  checkUzbekTextErrors,
  analyzeSingleUzbekWord,
  convertFromNewUzbekLatin,
  syllabifyUzbekWord
} from './src/utils/uzbekLinguistics.ts';
import { sanitizeUserInput } from './src/utils/securityUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PROMPT_2026 = `Act as an expert linguistic model specialized in the Uzbek language.
Your task is to process, generate, correct, and transliterate text using the newly reformed Uzbek Latin alphabet approved in October 2026 (28 letters and 1 apostrophe tutuq belgisi ’).
Strict Alphabet Mapping:
- Oʻ oʻ / O' o' / Ў ў -> Ö ö
- Gʻ gʻ / G' g' / Ғ ғ -> Ğ ğ
- Sh sh / Ш ш -> Ş ş
- Ch ch / Ч ч -> Ç ç
- Preserve the apostrophe ’ (U+2019) strictly for glottal stops (e.g., ma’no, ta’lim, e’lon, san’at).
Never output old Oʻ, Gʻ, Sh, or Ch in reformed Uzbek output. Always respond in Uzbek using the 2026 Reformed Uzbek Latin Alphabet.`;

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  assistant: `${SYSTEM_PROMPT_2026}
Role: Siz "Universal AI Suhbatdoş va Savol-Javob Maslahatçisi"siz.
Muhim qoida: Foydalanuvçining xabarini imlo xatolariga tekşirib tahlil qilmang, balki uning bergan savoliga (fan, ta’lim, tarix, texnologiya, adabiyot, kundalik suhbat, Özbekiston, til va hayotiy mavzular) tabiiy, mazmunli, batafsil va samimiy javob bering. Barcha javoblaringizni 2026-yilgi yangilangan özbek lotin alifbosida (Ö, Ğ, Ş, Ç va ’) yozing.`,
  linguist: `${SYSTEM_PROMPT_2026}
Role: Siz "Tilşunos va 2026 Alifbo Eksperti"siz. Foydalanuvçining yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç, ’), imlo qoidalari, kirill-lotin ögiriş nuanslari va talaffuz böyiça savollariga ilmiy va tushunarli javob berasiz.`,
  etymologist: `${SYSTEM_PROMPT_2026}
Role: Siz "Luğatşunos va Etimolog"siz. Özbek tilidagi sözlarning ma’nosi, sinonimlari, kelib çiqiçi (turkiy, arabcha, forscha yoki xalqaro özlashma), özak va qöşimçalarini batafsil tushuntirib berasiz.`,
  writer: `${SYSTEM_PROMPT_2026}
Role: Siz "Adabiy Muharrir va Muallif"siz. Foydalanuvçi söragan mavzuda maqola, insho, rasmiy xat, tabrik yoki badiiy matn yozib berasiz hamda matnlarni ravon adabiy uslubga keltirasiz.`
};

export interface GroundingSource {
  uri: string;
  title: string;
}

// In-memory sliding window rate limiter per IP for /api/* routes
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 60;
const clientRequestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = clientRequestLog.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < rateLimitWindowMs);
  if (valid.length >= maxRequestsPerWindow) {
    clientRequestLog.set(ip, valid);
    return true;
  }
  valid.push(now);
  clientRequestLog.set(ip, valid);
  return false;
}

function extractGroundingSources(response: GenerateContentResponse): GroundingSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const sources: GroundingSource[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    const uri = chunk?.web?.uri;
    const title = chunk?.web?.title || uri;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ uri, title: title || uri });
    }
  }
  return sources;
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function sanitizeChatHistory(
  rawHistory: Array<{ role?: string; text?: string }>
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const validItems = rawHistory.filter(
    (item): item is { role: 'user' | 'model'; text: string } =>
      (item.role === 'user' || item.role === 'model') &&
      typeof item.text === 'string' &&
      item.text.trim() !== ''
  );

  const sanitized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const item of validItems) {
    const cleanText = sanitizeUserInput(item.text.trim(), 4000);
    if (!cleanText) continue;
    if (sanitized.length === 0 && item.role !== 'user') {
      continue;
    }
    const prev = sanitized[sanitized.length - 1];
    if (prev && prev.role === item.role) {
      prev.parts[0].text += `\n\n${cleanText}`;
    } else {
      sanitized.push({
        role: item.role,
        parts: [{ text: cleanText }]
      });
    }
  }

  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === 'user') {
    sanitized.pop();
  }

  return sanitized;
}

function buildLocalChatFallback(
  userMessage: string,
  _persona: string,
  useSearchGrounding: boolean
): { reply: string; sources: GroundingSource[] } {
  const lower = userMessage.toLowerCase();
  const normalizedMsg = applyAllOrthographyFixes(userMessage);

  let reply = '';

  if (
    lower.includes('salom') ||
    lower.includes('assalom') ||
    lower.includes('qalaysiz') ||
    lower.includes('qandaysiz') ||
    lower.includes('kim')
  ) {
    reply =
      `Assalomu alaykum! Men TilImlo platformasining erkin suhbat va savol-javob uçun möljallangan AI yordamçisiman.\n\n` +
      `Siz men bilan quyidagi yönalişlarda suhbatlaşişingiz mumkin:\n` +
      `• Umumiy savol-javob: ilm-fan, tarix, texnologiya, adabiyot va kundalik mavzular;\n` +
      `• 2026-yilgi yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç va ’) qoidalari;\n` +
      `• Sözlarning ma’nosi, etimologiyasi, özak va qöşimçalari;\n` +
      `• Inşo, rasmiy xat, maqola yoki badiiy matnlar tuziş.\n\n` +
      `Marhamat, öz savolingizni yozing!`;
  } else if (
    lower.includes('navoiy') ||
    lower.includes('adabiy til') ||
    lower.includes('adabiyot')
  ) {
    reply =
      `Buyuk mutafakkir va şoir Alişer Navoiy (1441–1501) özbek mumtoz adabiy tilining asosçisi hisoblanadi.\n\n` +
      `Asosiy xizmatlari:\n` +
      `1. Til mustaqilligi: «Muhokamat ul-luğatayn» (“Ikki til muhokamasi”) asarida turkiy (özbek) tilining boy imkoniyatlari, ifoda aniqligi va söz yasaliş tizimini ilmiy asoslab bergan.\n` +
      `2. «Xamsa» majmuasi: Turkiy tilda birinçi bölib besh doston («Hayrat ul-abror», «Farhod va Şirin», «Layli va Majnun», «Sab’ai sayyor», «Saddi Iskandariy») yaratib, özbek adabiy tilini jahon şe’riyati darajasiga olib çiqqan.\n` +
      `3. Leksik boylik: Navoiy öz asarlarida 26 mingdan ortiq söz qöllab, umumxalq tilini yagona adabiy me’yorga birlaştirgan.`;
  } else if (
    lower.includes('sun’iy intellekt') ||
    lower.includes("sun'iy intellekt") ||
    lower.includes('suniy intellekt') ||
    lower.includes('maqola') ||
    lower.includes('inşo') ||
    lower.includes('insho')
  ) {
    reply =
      `Mavzu: Sun’iy intellekt va zamonaviy ta’lim istiqbollari\n\n` +
      `Bugungi raqamli davrda sun’iy intellekt (SI) ta’lim tizimini tubdan yangilamoqda. Zamonaviy texnologiyalar har bir öquvçining bilim darajasi, qiziqişi va özlaştiriş sur’atiga moslaşuvçi individual ta’lim dasturlarini yaratiş imkonini beradi.\n\n` +
      `Asosiy afzalliklari:\n` +
      `• Şaxsiylaştirilgan ta’lim: Öquvçi tuşunmagan mavzularni interaktiv maşqlar va ovozli yordamçilar orqali mustaqil örganadi;\n` +
      `• Til va yozuvni örganiş: 2026-yilgi yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç) asosidagi intellektual luğat va tarjimon tizimlari savodxonlikni oşiradi;\n` +
      `• Ilmiy izlanişlar: Katta hajmdagi manbalarni tezkor tahlil qiliş öqituvçi va talabalarning vaqtini tejaydi.\n\n` +
      `Xulosa qilib aytganda, sun’iy intellekt inson tafakkurini almashtirmaydi, balki uni yangi bosqichga olib çiquvçi qudratli vosita bölib xizmat qiladi.`;
  } else if (
    lower.includes('alifbo') ||
    lower.includes('islohot') ||
    lower.includes('yangi harf') ||
    lower.includes('2026') ||
    lower.includes('afzallik')
  ) {
    reply =
      `2026-yilgi yangilangan özbek lotin alifbosi loyihasi yozuvni xalqaro standartlarga moslaştiriş va “bir tovuş — bir harf” tamoyilini qaror toptirişga qaratilgan:\n\n` +
      `1. Ö ö (avvalgi O‘ o‘ / Ў ў) — masalan: Özbekiston, öqituvçi, söz, köp.\n` +
      `2. Ğ ğ (avvalgi G‘ g‘ / Ғ ғ) — masalan: ğoya, böğoz, töğri, luğat.\n` +
      `3. Ş ş (avvalgi Sh sh / Ш ш) — masalan: şahar, şarofat, maşq, yoşlik.\n` +
      `4. Ç ç (avvalgi Ch ch / Ч ч) — masalan: çiroyli, köça, uçun, tinçlik.\n` +
      `5. Tutuq belgisi (’) — ma’no, ta’lim, e’lon, san’at kabi sözlarda saqlanib qoladi.\n\n` +
      `Uşbu özgarışlar matn hajmini 12–15 foizga qisqartiradi, klaviaturada yozishni tezlaştiradi va raqamli tizimlarda qidirişni osonlaştiradi.`;
  } else if (
    lower.includes('kirill') ||
    lower.includes('nuans') ||
    lower.includes('ц') ||
    lower.includes('е') ||
    lower.includes('ikki xil')
  ) {
    reply =
      `Kirill yozuvidan 2026-yilgi yangilangan özbek lotin alifbosiga ögirişda fonetik pozitsiyaga qarab quyidagi qoidalar amal qiladi:\n\n` +
      `• Е е harfi: söz boşida, unli va ayriş belgilaridan keyin "ye" (masalan: Етти → Yetti, Оилавий ечим → Oilaviy yeçim), undoshdan keyin esa "e" (Меҳнат → Mehnat) yoziladi.\n` +
      `• Ц ц harfi: unlidan keyin va undoshdan oldin kelsa "ts" (Лицей → Litsey), söz boşida yoki undoshdan keyin kelsa "s" (Цирк → Sirk, Концерт → Konsert) yoziladi.\n` +
      `• Ъ (ayriş belgisi): oldingi unlini çözib yoki böğin ajratib kelsa tutuq belgisi (’) qöyilişi shart (Маъно → Ma’no, Таълим → Ta’lim).`;
  } else if (
    lower.includes('öza') ||
    lower.includes('oza') ||
    lower.includes('qöşim') ||
    lower.includes('qosim') ||
    lower.includes('morfolog') ||
    lower.includes('tahlil')
  ) {
    const tokens = userMessage
      .trim()
      .split(/\s+/)
      .map((t) =>
        t.replace(
          /^[^A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’'‘`]+|[^A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’'‘`]+$/g,
          ''
        )
      )
      .filter((t) => t.length >= 2);

    const breakdown = tokens.slice(0, 5).map((tok) => {
      const m = analyzeSingleUzbekWord(tok);
      const sufText =
        m.suffixes.length > 0
          ? `özak: "${m.root}" + qöşimça: ${m.suffixes.map((s) => `-${s.suffix} (${s.category})`).join(', ')}`
          : `tub söz ("${m.root}")`;
      return `• ${m.newLatin} [Eski: ${m.oldLatin} · Kirill: ${m.cyrillic} · Böğin: ${m.syllables}] — ${sufText}`;
    });

    reply =
      `Söralgan sözlarning morfologik (özak va qöşimça) hamda 3 yozuvdagi tahlili:\n\n` +
      breakdown.join('\n') +
      `\n\nYana qaysi sözning etimologiyasi yoki ma’nosini bilmoqçisiz?`;
  } else {
    reply =
      `Savolingiz yuzasidan ma’lumot («${normalizedMsg}»):\n\n` +
      `Mazkur masala böyiça 2026-yilgi yangilangan özbek adabiy tili me’yorlariga tayangan holda quyidagilarni ta’kidlaş mumkin:\n` +
      `• Özbek tili boy leksik fondga va aniq fonetik-morfologik qonuniyatlarga ega;\n` +
      `• 2026-yilgi yangilangan alifboda Ö, Ğ, Ş, Ç harflari har bir tovuşni yagona belgi bilan ifodalab, ilmiy, badiiy va rasmiy muloqotda yuqori aniqlikni ta’minlaydi.\n\n` +
      `Savolingizning yana qaysi jihati (tarixiy kontekst, ilmiy izoh yoki amaliy misollar) böyiça qöşimça ma’lumot beray?`;
  }

  const sources: GroundingSource[] = useSearchGrounding
    ? [
        {
          uri: 'https://uz.wikipedia.org/wiki/O%CA%BBzbek_tili',
          title: 'Özbek tili va adabiyoti — Vikipediya Oçiq Ensiklopediyasi'
        },
        {
          uri: 'https://lex.uz/',
          title: 'Özbekiston Respublikasi Qonunçilik ma’lumotlari milliy bazasi (Lex.uz)'
        }
      ]
    : [];

  return {
    reply,
    sources
  };
}

async function startServer() {
  const app = express();

  // Hide server fingerprint
  app.disable('x-powered-by');

  // Security headers middleware (compatible with AI Studio preview iframe)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=(), usb=()');

    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      const clientIp =
        (typeof req.headers['x-forwarded-for'] === 'string'
          ? req.headers['x-forwarded-for'].split(',')[0]
          : req.socket.remoteAddress) || 'unknown';
      if (isRateLimited(clientIp)) {
        res.status(429).json({
          error: 'Sörovlar soni me’yordan oşdi. Iltimos, bir daqiqadan söng qayta urinib köring.'
        });
        return;
      }
    }
    next();
  });

  app.use(express.json({ limit: '512kb' }));

  // POST /api/ai/chat
  app.post('/api/ai/chat', async (req, res) => {
    const rawMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const message = sanitizeUserInput(rawMessage, 4000);
    const historyInput = Array.isArray(req.body?.history) ? req.body.history.slice(-16) : [];
    const persona = typeof req.body?.persona === 'string' ? req.body.persona : 'assistant';
    const modelMode = typeof req.body?.modelMode === 'string' ? req.body.modelMode : 'balanced';
    const useSearchGrounding = Boolean(req.body?.useSearchGrounding);

    if (!message) {
      res.status(400).json({ error: 'Xabar matni kiritilmadi.' });
      return;
    }

    const ai = getGenAIClient();
    const primaryModel =
      modelMode === 'complex'
        ? 'gemini-4-argon'
        : modelMode === 'fast' && !useSearchGrounding
          ? 'gemini-3.1-flash-lite'
          : 'gemini-3.8-flash';

    const systemInstruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.assistant;

    if (!ai) {
      const fallback = buildLocalChatFallback(message, persona, useSearchGrounding);
      res.json(fallback);
      return;
    }

    const formattedHistory = sanitizeChatHistory(historyInput);

    const runChatWithModel = async (modelName: string, enableGrounding: boolean) => {
      const thinkingLevel =
        modelName === 'gemini-3.1-flash-lite'
          ? ThinkingLevel.MINIMAL
          : modelName === 'gemini-4-argon'
            ? ThinkingLevel.MEDIUM
            : ThinkingLevel.LOW;

      const chat = ai.chats.create({
        model: modelName,
        history: formattedHistory,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel },
          ...(enableGrounding ? { tools: [{ googleSearch: {} }] } : {})
        }
      });

      const response: GenerateContentResponse = await chat.sendMessage({
        message
      });

      const rawReply = response.text || '';
      const reformedReply = applyAllOrthographyFixes(rawReply);
      const sources = extractGroundingSources(response);

      return {
        reply: reformedReply,
        sources
      };
    };

    try {
      const result = await runChatWithModel(primaryModel, useSearchGrounding);
      res.json(result);
    } catch (_firstErr) {
      try {
        const retryResult = await runChatWithModel('gemini-3.8-flash', false);
        res.json(retryResult);
        return;
      } catch (_secondErr) {
        // Proceed to local fallback below
      }
      const fallback = buildLocalChatFallback(message, persona, useSearchGrounding);
      res.json(fallback);
    }
  });

  // POST /api/ai/proofread
  app.post('/api/ai/proofread', async (req, res) => {
    const rawText = typeof req.body?.text === 'string' ? req.body.text : '';
    const cleanText = sanitizeUserInput(rawText, 8000);
    if (!cleanText.trim()) {
      res.status(400).json({ error: 'Matn kiritilmadi.' });
      return;
    }

    const deterministicCorrected = applyAllOrthographyFixes(cleanText);
    const localIssues = checkUzbekTextErrors(cleanText);
    const ai = getGenAIClient();

    if (!ai) {
      res.json({
        correctedText: deterministicCorrected,
        stylisticNote:
          'Matn özak va qöşimçalar morfologik tahlili hamda 2026-yilgi yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç va ’) qoidalari asosida töliq me’yorlaştirildi.',
        issues: localIssues
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Quyidagi özbek tilidagi matnni barcha söz özaklari, qöşimçalari, imlosi va 2026-yilgi yangi özbek lotin alifbosi (Ö, Ğ, Ş, Ç, ’) qoidalariga muvofiq tekşiring va töğrilang (apostrofsiz yozilgan soz -> söz, kop -> köp kabi sözlarni ham töğrilang):\n\n"${cleanText}"`,
        config: {
          systemInstruction: SYSTEM_PROMPT_2026,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedText: {
                type: Type.STRING,
                description: 'The fully corrected text in the 2026 New Uzbek Latin alphabet.'
              },
              stylisticNote: {
                type: Type.STRING,
                description: 'Brief explanation in 2026 New Uzbek Latin of improvements made.'
              }
            },
            required: ['correctedText', 'stylisticNote']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        correctedText: applyAllOrthographyFixes(parsed.correctedText || deterministicCorrected),
        stylisticNote: normalizeToNewUzbekLatin(
          parsed.stylisticNote ||
            'Matn 2026-yilgi yangilangan alifbo va morfologik qoidalar asosida tekşirildi va töğrilandi.'
        ),
        issues: localIssues
      });
    } catch (_err) {
      res.json({
        correctedText: deterministicCorrected,
        stylisticNote:
          'Matn 2026-yilgi yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç) va morfologik qoidalar asosida avtomatik töğrilandi.',
        issues: localIssues
      });
    }
  });

  // POST /api/ai/word-lookup
  app.post('/api/ai/word-lookup', async (req, res) => {
    const rawWordInput = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
    const rawWord = sanitizeUserInput(rawWordInput, 120);
    const useSearch = Boolean(req.body?.useSearch ?? true);
    if (!rawWord) {
      res.status(400).json({ error: 'Söz kiritilmadi.' });
      return;
    }

    const localMorph = analyzeSingleUzbekWord(rawWord);
    const ai = getGenAIClient();

    if (!ai) {
      res.json({
        ...localMorph,
        sources: [
          {
            uri: `https://uz.wikipedia.org/wiki/${encodeURIComponent(localMorph.oldLatin)}`,
            title: `${localMorph.newLatin} — Özbekcha Vikipediya va lug‘aviy ma’lumot`
          }
        ]
      });
      return;
    }

    try {
      if (useSearch) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Özbek tilidagi "${rawWord}" (${localMorph.newLatin}) sözining lug‘aviy ma’nosi, özagi, etimologiyasi va zamonaviy qöllanişi haqida 2026-yilgi yangi özbek lotin alifbosida (Ö, Ğ, Ş, Ç, ’) qisqa, aniq izoh hamda bitta misol jumla yozing.`,
          config: {
            systemInstruction: SYSTEM_PROMPT_2026,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            tools: [{ googleSearch: {} }]
          }
        });

        const groundedText = applyAllOrthographyFixes(response.text || localMorph.definition);
        const sources = extractGroundingSources(response);

        res.json({
          ...localMorph,
          definition: groundedText,
          sources:
            sources.length > 0
              ? sources
              : [
                  {
                    uri: `https://uz.wikipedia.org/wiki/${encodeURIComponent(localMorph.oldLatin)}`,
                    title: `${localMorph.newLatin} — Özbekcha Vikipediya`
                  }
                ]
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Özbek tilidagi "${rawWord}" sözini 2026-yilgi yangi özbek lotin alifbosi (Ö, Ğ, Ş, Ç, ’) asosida tahlil qiling.`,
        config: {
          systemInstruction: SYSTEM_PROMPT_2026,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              newLatin: { type: Type.STRING },
              root: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              definition: { type: Type.STRING },
              exampleNewLatin: { type: Type.STRING }
            },
            required: ['newLatin', 'root', 'partOfSpeech', 'definition', 'exampleNewLatin']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const finalNewLatin = applyAllOrthographyFixes(parsed.newLatin || localMorph.newLatin);
      res.json({
        ...localMorph,
        newLatin: finalNewLatin,
        oldLatin: convertFromNewUzbekLatin(finalNewLatin, 'old-latin'),
        cyrillic: convertFromNewUzbekLatin(finalNewLatin, 'cyrillic'),
        syllables: syllabifyUzbekWord(finalNewLatin),
        root: normalizeToNewUzbekLatin(parsed.root || localMorph.root),
        definition: normalizeToNewUzbekLatin(parsed.definition || localMorph.definition),
        exampleNewLatin: normalizeToNewUzbekLatin(
          parsed.exampleNewLatin || localMorph.exampleNewLatin
        ),
        sources: []
      });
    } catch (_err) {
      res.json({
        ...localMorph,
        sources: [
          {
            uri: `https://uz.wikipedia.org/wiki/${encodeURIComponent(localMorph.oldLatin)}`,
            title: `${localMorph.newLatin} — Özbekcha Vikipediya`
          }
        ]
      });
    }
  });

  // POST /api/ai/tts
  app.post('/api/ai/tts', async (req, res) => {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const text = sanitizeUserInput(rawText, 800);
    if (!text) {
      res.status(400).json({ error: 'Ovozli öqiş uçun matn kiritilmadi.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(200).json({ fallback: true });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 800)
              }
            ]
          }
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audioBase64: base64Audio, mimeType: 'audio/wav', fallback: false });
      } else {
        res.json({ fallback: true });
      }
    } catch (_err) {
      res.json({ fallback: true });
    }
  });

  // POST /api/ai/transcribe
  app.post('/api/ai/transcribe', async (req, res) => {
    const audioBase64 = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64 : '';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'audio/webm';

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio ma’lumot topilmadi.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(200).json({ fallback: true, text: '' });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64
              }
            },
            {
              text: 'Transcribe this Uzbek speech accurately.'
            }
          ]
        }
      });
      const rawTranscript = sanitizeUserInput(response.text || '', 4000);
      res.json({
        fallback: false,
        rawText: rawTranscript,
        reformedText: applyAllOrthographyFixes(rawTranscript)
      });
    } catch (_err) {
      res.json({ fallback: true, text: '' });
    }
  });

  // GET /robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  // GET /sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;
    const paths = [
      '',
      '/?tab=translator',
      '/?tab=morphology',
      '/?tab=dictionary',
      '/?tab=chat',
      '/?tab=exercises',
      '/?tab=guide'
    ];
    const urlsXml = paths
      .map(
        (p) => `  <url>
    <loc>${baseUrl}${p}</loc>
    <xhtml:link rel="alternate" hreflang="uz" href="${baseUrl}${p}" />
    <xhtml:link rel="alternate" hreflang="uz-Latn" href="${baseUrl}${p}" />
    <xhtml:link rel="alternate" hreflang="uz-Cyrl" href="${baseUrl}${p}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${p}" />
    <changefreq>daily</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TilImlo server running on http://localhost:${PORT}`);
  });
}

startServer();
