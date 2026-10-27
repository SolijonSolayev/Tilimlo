import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Moon,
  Volume2,
  GitBranch,
  MessageSquare,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { TranslatorWorkspace } from './components/TranslatorWorkspace';
import { MorphologicalDiagramSection } from './components/MorphologicalDiagramSection';
import { DictionaryView } from './components/DictionaryView';
import { ExercisesView } from './components/ExercisesView';
import { AlphabetGuideView } from './components/AlphabetGuideView';
import { AiLinguistChatView } from './components/AiLinguistChatView';
import { TriScriptSeoSection, ActiveSection } from './components/TriScriptSeoSection';
import { SecurityPrivacyManager } from './components/SecurityPrivacyManager';
import {
  INITIAL_DICTIONARY,
  SAMPLE_PRESETS,
  DictionaryEntry
} from './utils/uzbekDictionaryData';
import { speakUzbekText } from './utils/speechUtils';

type ActiveTab = ActiveSection;

const HERO_REFORM_CARDS = [
  {
    newChar: 'Ö ö',
    oldChar: 'O‘ o‘',
    cyrChar: 'Ў ў',
    exampleNew: 'Özbekiston',
    exampleOld: 'O‘zbekiston'
  },
  {
    newChar: 'Ğ ğ',
    oldChar: 'G‘ g‘',
    cyrChar: 'Ғ ғ',
    exampleNew: 'Böğoz va ğoya',
    exampleOld: 'Bo‘g‘oz va g‘oya'
  },
  {
    newChar: 'Ş ş',
    oldChar: 'Sh sh',
    cyrChar: 'Ш ш',
    exampleNew: 'Şaharlararo',
    exampleOld: 'Shaharlararo'
  },
  {
    newChar: 'Ç ç',
    oldChar: 'Ch ch',
    cyrChar: 'Ч ч',
    exampleNew: 'Çiroyli',
    exampleOld: 'Chiroyli'
  }
];

const NAV_ITEMS: Array<{
  id: ActiveTab;
  navTestId: string;
  dockTestId: string;
  headerLabel: string;
  mobileLabel: string;
  dockLabel: string;
}> = [
  {
    id: 'translator',
    navTestId: 'nav-translator',
    dockTestId: 'tab-translator',
    headerLabel: 'Tarjimon va Imlo',
    mobileLabel: 'Tarjimon',
    dockLabel: '01. Tarjimon'
  },
  {
    id: 'morphology',
    navTestId: 'nav-morphology',
    dockTestId: 'tab-morphology',
    headerLabel: 'Morfologik Tahlil',
    mobileLabel: 'Morfologik Tahlil',
    dockLabel: '02. Morfologiya'
  },
  {
    id: 'dictionary',
    navTestId: 'nav-dictionary',
    dockTestId: 'tab-dictionary',
    headerLabel: 'Uç Yozuvli Luğat',
    mobileLabel: 'Luğat',
    dockLabel: '03. Luğat'
  },
  {
    id: 'chat',
    navTestId: 'nav-ai-chat',
    dockTestId: 'tab-ai-chat',
    headerLabel: 'AI Savol-Javob',
    mobileLabel: 'AI Savol-Javob',
    dockLabel: '04. AI Savol-Javob'
  },
  {
    id: 'exercises',
    navTestId: 'nav-exercises',
    dockTestId: 'tab-exercises',
    headerLabel: 'Maşqlar',
    mobileLabel: 'Maşqlar',
    dockLabel: '05. Maşqlar'
  },
  {
    id: 'guide',
    navTestId: 'nav-guide',
    dockTestId: 'tab-guide',
    headerLabel: '2026 Qoidalar',
    mobileLabel: '2026 Qoidalar',
    dockLabel: '06. Alifbo'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('translator');
  const [inputText, setInputText] = useState<string>(SAMPLE_PRESETS[0].text);
  const [selectedMorphologyWord, setSelectedMorphologyWord] = useState<string | null>(null);
  const [dictionaryEntries, setDictionaryEntries] =
    useState<DictionaryEntry[]>(INITIAL_DICTIONARY);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ozbek-alifbo-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isNightMode);
      try {
        localStorage.setItem('ozbek-alifbo-theme', isNightMode ? 'dark' : 'light');
      } catch {
        // Ignore storage errors
      }
    }
  }, [isNightMode]);

  const handleAddDictionaryEntry = useCallback((entry: DictionaryEntry) => {
    setDictionaryEntries((prev) => [entry, ...prev]);
  }, []);

  const handleSendToTranslator = useCallback((sampleText: string) => {
    setInputText(sampleText);
    setActiveTab('translator');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleOpenDedicatedMorphology = useCallback((word?: string) => {
    if (word && word.trim()) {
      setSelectedMorphologyWord(word.trim());
    }
    setActiveTab('morphology');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleOpenAiChat = useCallback(() => {
    setActiveTab('chat');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleClearAllUserData = useCallback(() => {
    setInputText(SAMPLE_PRESETS[0].text);
    setSelectedMorphologyWord(null);
    setDictionaryEntries(INITIAL_DICTIONARY);
    setIsNightMode(false);
  }, []);

  return (
    <div
      id="top"
      className={`min-h-screen flex flex-col bg-[#F6F8FA] text-slate-900 transition-colors duration-300 ${
        isNightMode ? 'dark' : ''
      }`}
    >
      <div className="h-1 w-full bg-gradient-to-r from-teal-700 via-emerald-500 to-teal-600 top-gradient-bar" />

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3.5 app-shell-header">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('translator');
            }}
            className="text-base sm:text-xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
          >
            TilImlo
          </a>

          <nav
            aria-label="Asosiy bo'limlar"
            className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={item.navTestId}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 after:content-[''] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-700 after:transition-transform after:duration-200 ${
                    isActive
                      ? 'text-slate-900 font-semibold after:scale-x-100'
                      : 'hover:text-slate-900 after:scale-x-0 hover:after:scale-x-50'
                  }`}
                >
                  <span>{item.headerLabel}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 mobile-header-actions">
            <button
              type="button"
              data-testid="header-security-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
              title="Maxfiylik, Xavfsizlik va Cookie boshqaruvi"
              aria-label="Maxfiylik va Xavfsizlik sozlamalari"
              className="btn-modern inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold bg-teal-50/90 hover:bg-teal-100 text-teal-900 border border-teal-200/80 rounded-xl whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Maxfiylik</span>
            </button>

            <button
              type="button"
              data-testid="theme-toggle-btn"
              onClick={() => setIsNightMode((prev) => !prev)}
              aria-label={isNightMode ? 'Kun rejimiga ötish' : 'Tun rejimiga ötish'}
              title={isNightMode ? 'Kun rejimi (Yoruğ)' : 'Tun rejimi (Qoronği)'}
              className="btn-modern inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-xl whitespace-nowrap"
            >
              <span
                key={isNightMode ? 'sun' : 'moon'}
                className="inline-flex items-center animate-icon-spin"
              >
                {isNightMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-teal-700" />
                )}
              </span>
              <span className="hidden xs:inline">{isNightMode ? 'Kun rejimi' : 'Tun rejimi'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'chat' ? 'translator' : 'chat')}
              className="btn-modern px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-xl shadow-2xs whitespace-nowrap shrink-0"
            >
              {activeTab === 'chat' ? 'Tarjimonga ötiş' : 'AI savol-javob'}
            </button>
          </div>
        </div>

        <div className="lg:hidden border-t border-slate-200 px-2 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto bg-slate-50 mobile-nav-scroll">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                activeTab === item.id
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.mobileLabel}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-7 app-shell-main">
        <section className="studio-hero-surface animate-page-enter border border-slate-200/90 rounded-2xl p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-5">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-semibold text-teal-800">
                <span>2026 Yangi Lotin (Ö, Ğ, Ş, Ç)</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>1995 Eski Lotin (O‘, G‘, Sh, Ch)</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Kirill (Ў, Ғ, Ш, Ч)</span>
              </div>

              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                Yangilangan Özbek Lotin Alifbosi Tarjimoni, Morfologik Tahlil va AI Platformasi
              </h1>

              <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                Tezkor ishlash va qulaylik uçun tizim maxsus sahifalarga ajratilgan:{' '}
                <strong>Tarjimon va Imlo</strong>, <strong>Grafik Morfologik Tahlil (Özak + Qöşimça)</strong>,{' '}
                <strong>3 Yozuvli Luğat</strong> hamda <strong>AI Savol-Javob Chatboti</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-200/75 border border-slate-300/50 rounded-xl self-start xl:self-end shrink-0 w-full xl:w-auto overflow-x-auto mobile-nav-scroll">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={item.dockTestId}
                    onClick={() => setActiveTab(item.id)}
                    className={`btn-modern px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.dockLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(activeTab === 'translator' || activeTab === 'guide') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200/80">
              {HERO_REFORM_CARDS.map((card, idx) => (
                <div
                  key={card.newChar}
                  style={{ animationDelay: `${idx * 45}ms` }}
                  className="interactive-card animate-card-reveal bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-3 hover:border-teal-600/50"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-50 border border-teal-200/70 flex items-center justify-center text-[11px] sm:text-sm font-bold font-mono text-teal-800 shrink-0">
                      {card.newChar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] sm:text-xs font-mono text-slate-500 truncate">
                        {card.oldChar} · {card.cyrChar}
                      </div>
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate mt-0.5">
                        {card.exampleNew}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakUzbekText(card.exampleNew)}
                    title={`${card.exampleNew} talaffuzini tinglaş`}
                    aria-label={`${card.exampleNew} talaffuzini tinglaş`}
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:scale-110 active:scale-95 rounded-lg transition-all shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div key={activeTab} className="animate-page-enter">
          {activeTab === 'translator' && (
            <div className="space-y-6">
              <TranslatorWorkspace
                inputText={inputText}
                setInputText={setInputText}
                onOpenDedicatedMorphology={handleOpenDedicatedMorphology}
                onOpenAiChat={handleOpenAiChat}
              />

              <section
                aria-label="Tezkor bo'limlarga o'tish"
                className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
              >
                <div className="interactive-card bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-teal-600/50">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-teal-800">
                      <GitBranch className="w-4 h-4 text-teal-700" />
                      <span>Maxsus Grafik Sahifa</span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Morfologik Tahlil (Özak va Qöşimçalar)
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Har bir sözning özagi, söz yasovçi va sintaktik qöşimçalarini alohida keng
                      sahifada bloklar va daraxt sxemasida tahlil qiling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDedicatedMorphology()}
                    className="btn-modern group inline-flex items-center justify-between px-3.5 py-2 text-[10px] sm:text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl"
                  >
                    <span>Morfologik Tahlil sahifasini oçiş</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                <div className="interactive-card bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-teal-600/50">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-teal-800">
                      <MessageSquare className="w-4 h-4 text-teal-700" />
                      <span>Intellektual Suhbatdoş</span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Alohida AI Savol-Javob Chatboti
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      2026-yilgi alifbo qoidalari, imlo masalalari, insho yozish va erkin mavzularda
                      tezkor AI tilşunos bilan suhbatlaşing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAiChat}
                    className="btn-modern group inline-flex items-center justify-between px-3.5 py-2 text-[10px] sm:text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                  >
                    <span>AI Savol-Javob sahifasiga ötiş</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                <div className="interactive-card bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-teal-600/50">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-teal-800">
                      <BookOpen className="w-4 h-4 text-teal-700" />
                      <span>3 Alifboli Baza</span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Uç Yozuvli Izohli va Imlo Luğati
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Sözlarning 2026 Yangi Lotin, 1995 Eski Lotin va Kirill yozuvidagi shakllari,
                      böğinlari hamda izohlarini qidiring.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dictionary')}
                    className="btn-modern group inline-flex items-center justify-between px-3.5 py-2 text-[10px] sm:text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl"
                  >
                    <span>Uç Yozuvli Luğatni oçiş</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'morphology' && (
            <div className="space-y-6">
              <MorphologicalDiagramSection
                inputText={inputText}
                externalSelectedWord={selectedMorphologyWord}
                onSelectWord={(w) => setSelectedMorphologyWord(w)}
              />
            </div>
          )}

          {activeTab === 'dictionary' && (
            <DictionaryView
              entries={dictionaryEntries}
              onAddEntry={handleAddDictionaryEntry}
              onSendToTranslator={handleSendToTranslator}
            />
          )}

          {activeTab === 'chat' && (
            <AiLinguistChatView onSendToTranslator={handleSendToTranslator} />
          )}

          {activeTab === 'exercises' && <ExercisesView />}

          {activeTab === 'guide' && <AlphabetGuideView />}
        </div>

        <TriScriptSeoSection activeTab={activeTab} onSelectQuery={handleSendToTranslator} />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-10 transition-colors duration-200">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-500 app-shell-footer">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-800">TilImlo</span>
            <span aria-hidden="true">·</span>
            <span>tilimlo.uz · ТилИмло — 2026 yangi alifbo, 3 yozuvli tarjimon, imlo va AI platformasi</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <button type="button" onClick={() => setActiveTab('translator')} className="hover:text-slate-900 transition-colors">
              Tarjimon
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setActiveTab('morphology')} className="hover:text-slate-900 transition-colors">
              Morfologik Tahlil
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              data-testid="footer-privacy-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-slate-900 transition-colors font-medium text-teal-800"
            >
              Maxfiylik va Xavfsizlik
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              data-testid="footer-cookie-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Cookie Sozlamalari
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsNightMode((prev) => !prev)}
              className="hover:text-slate-900 transition-colors"
            >
              {isNightMode ? 'Kun rejimi' : 'Tun rejimi'}
            </button>
            <span aria-hidden="true">·</span>
            <span className="text-slate-700 font-medium">
              Muallif: <strong className="font-semibold text-slate-900">Solijon Solayev</strong>
            </span>
          </div>
        </div>
      </footer>

      <SecurityPrivacyManager
        isModalOpen={isPrivacyModalOpen}
        onCloseModal={() => setIsPrivacyModalOpen(false)}
        onOpenModal={() => setIsPrivacyModalOpen(true)}
        onClearAllUserData={handleClearAllUserData}
      />
    </div>
  );
}
