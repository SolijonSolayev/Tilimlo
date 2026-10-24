import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Globe,
  Sparkles,
  Zap,
  Cpu,
  RotateCcw,
  Volume2,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  Mic,
  MicOff,
  ShieldCheck
} from 'lucide-react';
import { speakUzbekText, createUzbekSpeechRecognizer } from '../utils/speechUtils';
import { sanitizeUserInput } from '../utils/securityUtils';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  modeLabel?: string;
  timestamp: string;
}

type PersonaType = 'assistant' | 'linguist' | 'etymologist' | 'writer';
type ModelSpeedMode = 'complex' | 'balanced' | 'fast';

interface AiLinguistChatViewProps {
  onSendToTranslator: (text: string) => void;
}

const PERSONAS: Array<{
  id: PersonaType;
  label: string;
  roleTitle: string;
  description: string;
}> = [
  {
    id: 'assistant',
    label: 'Universal Suhbatdoş',
    roleTitle: 'Erkin Suhbat va Savol-Javob Maslahatçisi',
    description:
      'Xatolarni tekşirişdan taşqari har qanday mavzuda (fan, tarix, ta’lim, texnologiya, adabiyot va kundalik hayot) 2026-yilgi yangi özbek alifbosida savollarga javob beradi.'
  },
  {
    id: 'linguist',
    label: 'Tilşunos Ekspert',
    roleTitle: '2026 Alifbo va Qoidalar Ustosi',
    description:
      'Yangilangan 28 harfli alifbo (Ö, Ğ, Ş, Ç), tutuq belgisi (’) va kirilldan ögiriş qoidalari böyiça ilmiy savollarga javob beradi.'
  },
  {
    id: 'etymologist',
    label: 'Luğatşunos va Etimolog',
    roleTitle: 'Söz Ma’nolari va Kelib Çiqiçi Tahlilçisi',
    description:
      'Özbek tilidagi sözlarning izohi, sinonimlari, etimologiyasi (turkiy, arabcha, forscha) hamda özak-qöşimçalarini tushuntiradi.'
  },
  {
    id: 'writer',
    label: 'Muallif va Muharrir',
    roleTitle: 'Inşo, Rasmiy Xat va Badiiy Matn Yozuvçisi',
    description:
      'Söralgan mavzuda maqola, insho, rasmiy murojaat, tabrik yoki badiiy matn tuzib beradi.'
  }
];

const STARTER_PROMPTS = [
  'Alisher Navoiyning özbek adabiy tili rivojidagi örni haqida gapirib ber',
  '2026-yilgi yangilangan özbek lotin alifbosidagi Ö, Ğ, Ş, Ç harflarining afzalliklari nimada?',
  'Sun’iy intellekt va zamonaviy ta’lim mavzusida qisqa maqola yozib ber',
  'Kirilldagi «Е», «Ц» va «Ъ» harflari yangi alifboda qachon ikki xil yoziladi?'
];

const QUICK_CHARS = ['Ö', 'ö', 'Ğ', 'ğ', 'Ş', 'ş', 'Ç', 'ç', '’'];

const MODE_LABELS: Record<ModelSpeedMode, string> = {
  complex: 'Chuqur Tahlil',
  balanced: 'Standart',
  fast: 'Tezkor'
};

export const AiLinguistChatView: React.FC<AiLinguistChatViewProps> = ({
  onSendToTranslator
}) => {
  const [persona, setPersona] = useState<PersonaType>('assistant');
  const [modelMode, setModelMode] = useState<ModelSpeedMode>('fast');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome-turn',
      role: 'model',
      text: 'Assalomu alaykum! Men erkin suhbat va savol-javob uçun möljallangan tezkor AI suhbatdoşman. Mendan istalgan mavzuda (ilm-fan, tarix, adabiyot, yangi 2026-yilgi özbek alifbosi, söz ma’nolari yoki matn yozish) söraşingiz mumkin. Barcha javoblarni yangilangan özbek lotin alifbosida (Ö, Ğ, Ş, Ç va ’) taqdim etaman.',
      modeLabel: 'Tezkor',
      timestamp: 'Hozir'
    }
  ]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recognizerRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  const handleToggleVoiceInput = () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognizer = createUzbekSpeechRecognizer(
      (transcript) => {
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      setIsListening(true);
      recognizer.start();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const cleanText = sanitizeUserInput((textToSend ?? inputMessage).trim(), 4000);
    if (!cleanText || isLoading) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      text: m.text
    }));

    setMessages((prev) => [...prev, userTurn]);
    if (!textToSend) {
      setInputMessage('');
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          history: historyPayload,
          persona,
          modelMode,
          useSearchGrounding
        })
      });

      if (response.ok) {
        const data = await response.json();
        const modelTurn: ChatTurn = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply || 'Javob tayyorlandi.',
          sources: Array.isArray(data.sources) ? data.sources : [],
          modeLabel: MODE_LABELS[modelMode],
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, modelTurn]);
      } else {
        const fallbackText =
          `Savolingiz («${cleanText}») 2026-yilgi yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç va ’) asosida qabul qilindi.\n\n` +
          `• Yangi alifboda O‘→Ö, G‘→Ğ, Sh→Ş, Ch→Ç harflari “bir tovuş — bir harf” tamoyili asosida yoziladi;\n` +
          `• Arabça özlaşmalardagi tutuq belgisi (’ — ma’no, ta’lim, san’at) saqlanib qoladi.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `model-fallback-${Date.now()}`,
            role: 'model',
            text: fallbackText,
            modeLabel: MODE_LABELS[modelMode],
            timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (_err) {
      const fallbackText =
        `Savolingiz («${cleanText}») böyiça lokal tilşunoslik tahlili:\n\n` +
        `• 2026-yilgi yangilangan özbek lotin alifbosida Ö, Ğ, Ş, Ç harflari apostrof va harf birikmalarining örnini bosadi;\n` +
        `• Sözlarning özak va qöşimça tahlilini "02. Morfologik Tahlil" bölimida grafik şaklda körişingiz mumkin.`;
      setMessages((prev) => [
        ...prev,
        {
          id: `model-fallback-${Date.now()}`,
          role: 'model',
          text: fallbackText,
          modeLabel: MODE_LABELS[modelMode],
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const activePersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Suhbat tarixi yangilandi. Hozirgi rejim: ${activePersona.label} (${activePersona.roleTitle}). Marhamat, savolingizni yozing!`,
        modeLabel: MODE_LABELS[modelMode],
        timestamp: 'Hozir'
      }
    ]);
  };

  const insertChar = (char: string) => {
    setInputMessage((prev) => prev + char);
  };

  const currentPersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];
  const totalSourcesCount = messages.reduce(
    (sum, m) => sum + (m.sources ? m.sources.length : 0),
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Chat Thread Column (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden">
        {/* Top Bar: Persona Selector & Speed / Grounding Controls */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                data-testid={`persona-${p.id}`}
                onClick={() => setPersona(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  persona === p.id
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Google Search Grounding Toggle */}
            <button
              type="button"
              data-testid="toggle-search-grounding"
              onClick={() => setUseSearchGrounding((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                useSearchGrounding
                  ? 'bg-teal-50 text-teal-900 border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Qidiruv orqali real vaqtda ma’lumot va manbalarni tekshirish"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>{useSearchGrounding ? 'Manba qidiruvi: Yoqilgan' : 'Manba qidiruvi: Öçirilgan'}</span>
            </button>

            {/* Clean 3-Tier Speed & Depth Selector (Hides raw internal model IDs) */}
            <div
              className="inline-flex items-center bg-slate-200/75 p-0.5 rounded-lg"
              role="group"
              aria-label="Javob tezligi va chuqurligini tanlash"
            >
              <button
                type="button"
                data-testid="model-complex"
                onClick={() => setModelMode('complex')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  modelMode === 'complex'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Murakkab mantiqiy tahlil va badiiy matnlar uchun chuqur rejim"
              >
                <Cpu className="w-3 h-3 text-teal-700" />
                <span>Chuqur</span>
              </button>
              <button
                type="button"
                data-testid="model-balanced"
                onClick={() => setModelMode('balanced')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  modelMode === 'balanced'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Umumiy savol-javob uchun muvozanatli rejim"
              >
                <Sparkles className="w-3 h-3 text-teal-700" />
                <span>Standart</span>
              </button>
              <button
                type="button"
                data-testid="model-fast"
                onClick={() => setModelMode('fast')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  modelMode === 'fast'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tezkor javoblar uchun yengil rejim"
              >
                <Zap className="w-3 h-3 text-amber-600" />
                <span>Tezkor</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              aria-label="Suhbat tarixini tozalash"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Suhbatni tozalaş"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Multi-Turn Conversation Thread */}
        <div
          ref={chatContainerRef}
          data-testid="chat-messages-thread"
          className="p-5 sm:p-6 space-y-4 max-h-[460px] min-h-[360px] overflow-y-auto bg-slate-50/40"
        >
          {messages.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col ${
                turn.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-xl p-4 space-y-3 ${
                  turn.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[11px] opacity-75">
                  <span className="font-semibold">
                    {turn.role === 'user' ? 'Siz (Savol / Suhbat)' : currentPersona.label}
                  </span>
                  <span className="font-mono tabular-nums">
                    {turn.modeLabel ? `${turn.modeLabel} · ` : ''}
                    {turn.timestamp}
                  </span>
                </div>

                <div className="text-sm leading-relaxed whitespace-pre-wrap">{turn.text}</div>

                {/* Verified Search Grounding Sources */}
                {turn.sources && turn.sources.length > 0 && (
                  <div
                    data-testid="chat-grounding-sources"
                    className="pt-2.5 border-t border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Tasdiqlangan manbalar:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {turn.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-950 underline underline-offset-2"
                        >
                          <span className="truncate max-w-[260px]">{src.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons on assistant turns */}
                {turn.role === 'model' && (
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => speakUzbekText(turn.text)}
                      className="inline-flex items-center gap-1 hover:text-teal-700 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ovozli tinglaş</span>
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => onSendToTranslator(turn.text)}
                      className="inline-flex items-center gap-1 hover:text-teal-700 transition-colors"
                    >
                      <span>Tarjimonda ochiş</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 font-medium">
                {currentPersona.label} javob tayyorlamoqda...
              </div>
            </div>
          )}
        </div>

        {/* Starter Prompts Row */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Savol namunalari:</span>
          {STARTER_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              data-testid={`starter-prompt-${idx}`}
              onClick={() => handleSendMessage(promptText)}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs text-slate-600 bg-white hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {promptText.length > 52 ? `${promptText.slice(0, 52)}...` : promptText}
            </button>
          ))}
        </div>

        {/* Input Composer with 2026 Character Bar & Voice Input */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">2026 harflar:</span>
              {QUICK_CHARS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertChar(char)}
                  className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-md hover:border-teal-600 hover:text-teal-800 transition-colors"
                >
                  {char}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                isListening
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-red-600" />
                  <span>Tinglanmoqda...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ovozli savol</span>
                </>
              )}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              data-testid="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Istalgan mavzuda savol bering yoki suhbatni davom ettiring..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              data-testid="chat-submit-btn"
              disabled={isLoading || !inputMessage.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Yuboriş</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Context & Privacy Info Column (4 cols) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {currentPersona.label}
              </h3>
              <p className="text-xs text-teal-800 font-medium mt-0.5">
                {currentPersona.roleTitle}
              </p>
            </div>
            <MessageSquare className="w-5 h-5 text-teal-700 shrink-0" />
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {currentPersona.description}
          </p>

          {/* Maximum 2 data points per card */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
              <div className="text-[11px] text-slate-500">Suhbat xabarlari</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {messages.length} ta
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
              <div className="text-[11px] text-slate-500">Tasdiqlangan manbalar</div>
              <div className="text-lg font-bold text-teal-800 font-mono tabular-nums mt-0.5">
                {totalSourcesCount} ta
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Maxfiy va Himoyalangan Muloqot</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-slate-900">Yashirin proksi:</strong> Barcha sörovlar
                himoyalangan server orqali uzatiladi, API kalitlar oşkor etilmaydi.
              </li>
              <li>
                <strong className="text-slate-900">Shaxsiy maxfiylik:</strong> Suhbat matnlari
                faqat joriy sessiyangizda saqlanadi va reklama tizimlariga uzatilmaydi.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
