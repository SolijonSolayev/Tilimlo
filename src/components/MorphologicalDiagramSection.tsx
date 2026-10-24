import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import {
  GitBranch,
  Layers,
  Volume2,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  BookOpen,
  Maximize2
} from 'lucide-react';
import {
  buildGraphicalMorphemeChain,
  extractAnalyzableWordsFromText,
  MorphemeCategory,
  MorphemeNode
} from '../utils/uzbekGraphicalMorphology';
import { speakUzbekText } from '../utils/speechUtils';

interface MorphologicalDiagramSectionProps {
  inputText: string;
  externalSelectedWord?: string | null;
  onSelectWord?: (word: string) => void;
  onOpenDedicatedPage?: () => void;
}

const SHOWCASE_WORDS = [
  { word: 'sözlarimizga', label: 'söz + lar + imiz + ga' },
  { word: 'öqituvçilarimizdan', label: 'öqi + t + uvçi + lar + imiz + dan' },
  { word: 'boğbonlarning', label: 'boğ + bon + lar + ning' },
  { word: 'Özbekistondagi', label: 'Özbek + iston + da + gi' },
  { word: 'qöşimçalarni', label: 'qöş + im + ça + lar + ni' },
  { word: 'özlaştirilmoqda', label: 'öz + laş + tir + il + moqda' }
];

const CATEGORY_STYLES: Record<
  MorphemeCategory,
  {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    textMain: string;
    svgFill: string;
    svgStroke: string;
    svgText: string;
    legendLabel: string;
  }
> = {
  root: {
    bg: 'bg-teal-50/90',
    border: 'border-teal-500/70',
    badgeBg: 'bg-teal-700',
    badgeText: 'text-white',
    textMain: 'text-teal-950',
    svgFill: '#0f766e',
    svgStroke: '#14b8a6',
    svgText: '#ffffff',
    legendLabel: 'Özak — lug‘aviy asos'
  },
  derivational: {
    bg: 'bg-amber-50/90',
    border: 'border-amber-500/70',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    textMain: 'text-amber-950',
    svgFill: '#b45309',
    svgStroke: '#f59e0b',
    svgText: '#ffffff',
    legendLabel: 'Söz yasovçi qöşimça (^)'
  },
  'lexical-form': {
    bg: 'bg-indigo-50/90',
    border: 'border-indigo-500/60',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    textMain: 'text-indigo-950',
    svgFill: '#4338ca',
    svgStroke: '#6366f1',
    svgText: '#ffffff',
    legendLabel: 'Lug‘aviy shakl / Köplik (□)'
  },
  possessive: {
    bg: 'bg-sky-50/90',
    border: 'border-sky-500/60',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    textMain: 'text-sky-950',
    svgFill: '#0369a1',
    svgStroke: '#0ea5e9',
    svgText: '#ffffff',
    legendLabel: 'Egalik qöşimçasi (◊)'
  },
  case: {
    bg: 'bg-rose-50/90',
    border: 'border-rose-500/60',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    textMain: 'text-rose-950',
    svgFill: '#be123c',
    svgStroke: '#f43f5e',
    svgText: '#ffffff',
    legendLabel: 'Kelişik qöşimçasi (◊)'
  },
  'verb-form': {
    bg: 'bg-purple-50/90',
    border: 'border-purple-500/60',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    textMain: 'text-purple-950',
    svgFill: '#6d28d9',
    svgStroke: '#8b5cf6',
    svgText: '#ffffff',
    legendLabel: 'Fe’l zamon va şaxs-son (◊)'
  }
};

/**
 * Crisp inline SVG grammatical marker above each morpheme (replaces font-dependent Unicode box chars).
 */
const MorphemeMarkerSvg: React.FC<{ category: MorphemeCategory; strokeColor: string }> = ({
  category,
  strokeColor
}) => {
  if (category === 'root') {
    // Traditional Uzbek Özak Arch
    return (
      <svg className="w-24 h-4 mx-auto" viewBox="0 0 96 16" fill="none" aria-hidden="true">
        <path
          d="M 8 14 Q 48 -2 88 14"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (category === 'derivational') {
    // Traditional Söz yasovçi Caret (/\)
    return (
      <svg className="w-16 h-4 mx-auto" viewBox="0 0 64 16" fill="none" aria-hidden="true">
        <path
          d="M 14 14 L 32 3 L 50 14"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (category === 'lexical-form') {
    // Traditional Lug'aviy shakl yasovçi Bracket ([ ])
    return (
      <svg className="w-16 h-4 mx-auto" viewBox="0 0 64 16" fill="none" aria-hidden="true">
        <path
          d="M 12 14 L 12 4 L 52 4 L 52 14"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // Sintaktik / munosabat shakli (Egalik, Kelishik, Fe'l zamon)
  return (
    <svg className="w-16 h-4 mx-auto" viewBox="0 0 64 16" fill="none" aria-hidden="true">
      <path
        d="M 12 9 L 20 3 L 44 3 L 52 9"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MorphologicalDiagramSection: React.FC<MorphologicalDiagramSectionProps> = React.memo(({
  inputText,
  externalSelectedWord,
  onSelectWord,
  onOpenDedicatedPage
}) => {
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [activeWord, setActiveWord] = useState<string>('sözlarimizga');
  const [activeMorphemeIndex, setActiveMorphemeIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'both' | 'blocks' | 'tree'>('both');
  const lastInputTextRef = useRef<string>('');
  const deferredInputText = useDeferredValue(inputText);

  // Extract words from the translator's deferred inputText so typing never lags
  const textWords = useMemo(
    () => extractAnalyzableWordsFromText(deferredInputText),
    [deferredInputText]
  );

  // Pre-analyze words in the sentence
  const analyzedSentenceWords = useMemo(() => {
    return textWords.map((w) => ({
      raw: w,
      data: buildGraphicalMorphemeChain(w)
    }));
  }, [textWords]);

  // Sync when user clicks a word in the translator output
  useEffect(() => {
    if (externalSelectedWord && externalSelectedWord.trim()) {
      setCustomWordInput('');
      setActiveWord(externalSelectedWord.trim());
      setActiveMorphemeIndex(null);
    }
  }, [externalSelectedWord]);

  // Only auto-pick the richest inflected word when the deferred inputText actually changes
  useEffect(() => {
    if (deferredInputText === lastInputTextRef.current) return;
    lastInputTextRef.current = deferredInputText;
    if (customWordInput.trim()) return;

    if (analyzedSentenceWords.length > 0) {
      const best = [...analyzedSentenceWords].sort(
        (a, b) => b.data.morphemes.length - a.data.morphemes.length
      )[0];
      if (best) {
        setActiveWord(best.raw);
        setActiveMorphemeIndex(null);
      }
    }
  }, [deferredInputText, analyzedSentenceWords, customWordInput]);

  const targetWord = customWordInput.trim() || activeWord || 'sözlarimizga';
  const analysis = useMemo(() => buildGraphicalMorphemeChain(targetWord), [targetWord]);

  // Compute cumulative word-building steps: e.g. ["söz", "sözlar", "sözlarimiz", "sözlarimizga"]
  const cumulativeSteps = useMemo(() => {
    const steps: string[] = [];
    let acc = '';
    for (const m of analysis.morphemes) {
      acc += m.cleanText;
      steps.push(acc);
    }
    return steps;
  }, [analysis.morphemes]);

  // SVG Tree layout geometry (D3-style hierarchical layout)
  const svgLayout = useMemo(() => {
    const count = analysis.morphemes.length;
    const nodeWidth = 152;
    const nodeGap = 24;
    const totalContentWidth = count * nodeWidth + Math.max(0, count - 1) * nodeGap;
    const svgWidth = Math.max(760, totalContentWidth + 80);
    const svgHeight = 256;
    const startX = (svgWidth - totalContentWidth) / 2;

    const rootCenterX = svgWidth / 2;
    const rootCenterY = 44;

    const childNodes = analysis.morphemes.map((m, idx) => {
      const x = startX + idx * (nodeWidth + nodeGap);
      const y = 142;
      const centerX = x + nodeWidth / 2;
      const centerY = y;

      // D3-style vertical cubic Bezier path from top word node to each morpheme block
      const pathD = `M ${rootCenterX} ${rootCenterY + 22} C ${rootCenterX} ${
        rootCenterY + 72
      }, ${centerX} ${centerY - 50}, ${centerX} ${centerY - 4}`;

      return {
        morpheme: m,
        idx,
        x,
        y,
        width: nodeWidth,
        height: 86,
        centerX,
        centerY,
        pathD,
        cumulativeWord: cumulativeSteps[idx] || m.cleanText
      };
    });

    return {
      svgWidth,
      svgHeight,
      rootCenterX,
      rootCenterY,
      childNodes
    };
  }, [analysis.morphemes, cumulativeSteps]);

  const selectedMorpheme: MorphemeNode | null =
    activeMorphemeIndex !== null && analysis.morphemes[activeMorphemeIndex]
      ? analysis.morphemes[activeMorphemeIndex]
      : null;

  const handleWordPick = (word: string) => {
    setCustomWordInput('');
    setActiveWord(word);
    setActiveMorphemeIndex(null);
    if (onSelectWord) {
      onSelectWord(word);
    }
  };

  return (
    <section
      aria-label="Morfologik Tahlil — Özak va Qöşimçalar Grafik Diagrammasi"
      data-testid="morphological-diagram-section"
      className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* Top Studio Header Bar */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-700 text-white shadow-2xs">
              <GitBranch className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Morfologik Tahlil — Özak va Qöşimçalar Grafik Diagrammasi
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Tarjimon oynasiga kiritilgan har bir sözning{' '}
            <span className="font-semibold text-slate-800">özak (asos)</span>,{' '}
            <span className="font-semibold text-slate-800">söz yasovçi (^)</span>,{' '}
            <span className="font-semibold text-slate-800">lug‘aviy shakl (□)</span> va{' '}
            <span className="font-semibold text-slate-800">sintaktik qöşimçalarini (◊)</span> grafik
            bloklar hamda ierarxik sxemada körsatadi.
          </p>
        </div>

        {/* Custom Word Input + View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customWordInput}
              onChange={(e) => {
                setCustomWordInput(e.target.value);
                setActiveMorphemeIndex(null);
              }}
              placeholder="Söz kiriting (masalan: sözlarimizga)..."
              aria-label="Morfologik tahlil uchun so'z kiritish"
              data-testid="morphology-custom-word-input"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 w-64 sm:w-72"
            />
          </div>

          <div
            role="group"
            aria-label="Grafik ko'rinish rejimi"
            className="inline-flex p-0.5 rounded-xl bg-slate-200/80 border border-slate-300/60"
          >
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'both'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Blok + Sxema
            </button>
            <button
              type="button"
              onClick={() => setViewMode('blocks')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'blocks'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Bloklar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'tree'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Daraxt (SVG)
            </button>
          </div>

          {onOpenDedicatedPage && (
            <button
              type="button"
              onClick={onOpenDedicatedPage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
              title="Alohida Morfologik Tahlil sahifasida ochish"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Alohida sahifada</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Word Selector Strip from Current Translator Text + Showcase Examples */}
        <div className="space-y-3">
          {analyzedSentenceWords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Matndagi sözlar ({analyzedSentenceWords.length}):
              </span>
              {analyzedSentenceWords.map(({ raw, data }) => {
                const isSelected =
                  !customWordInput.trim() && raw.toLowerCase() === activeWord.toLowerCase();
                const suffixCount = data.morphemes.length - 1;
                return (
                  <button
                    key={raw}
                    type="button"
                    onClick={() => handleWordPick(raw)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                        : 'bg-slate-100/90 hover:bg-teal-50 text-slate-800 border-slate-200/90'
                    }`}
                  >
                    <span className="font-mono font-semibold">{data.newLatin}</span>
                    {suffixCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                          isSelected
                            ? 'bg-teal-900/50 text-teal-100'
                            : 'bg-teal-100/90 text-teal-800'
                        }`}
                      >
                        +{suffixCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Multi-Morpheme Showcase Words */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500 mr-1">
              Murakkab qöşimçali namunalar:
            </span>
            {SHOWCASE_WORDS.map((item) => {
              const isSelected = targetWord.toLowerCase() === item.word.toLowerCase();
              return (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => handleWordPick(item.word)}
                  data-testid={`showcase-morph-${item.word}`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-900 border-amber-500/50 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Word Summary Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Tahlil qilinayotgan söz:
              </span>
              <span
                className="text-xl font-bold font-mono text-slate-900"
                data-testid="active-morph-word"
              >
                {analysis.newLatin}
              </span>
              {analysis.wasAutoCorrected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Asli: {analysis.originalWord} → 2026 imloga töğrilandi
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-200/80 text-slate-800">
                {analysis.partOfSpeechLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span>
                1995 Lotin: <strong className="font-mono text-slate-800">{analysis.oldLatin}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Kirill: <strong className="font-mono text-slate-800">{analysis.cyrillic}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Böğinlar ({analysis.syllables.length} ta):{' '}
                <strong className="font-mono text-teal-800">
                  {analysis.syllables.join(' - ')}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Morfemalar soni:{' '}
                <strong className="font-mono text-slate-900">
                  {analysis.morphemes.length} ta (1 özak + {analysis.morphemes.length - 1} qöşimça)
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => speakUzbekText(analysis.newLatin)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Talaffuzni tinglaş</span>
            </button>
          </div>
        </div>

        {/* 1. VISUAL MORPHEME BLOCK PIPELINE (Özak + Sequential Qöşimça Blocks) */}
        {(viewMode === 'both' || viewMode === 'blocks') && (
          <div className="space-y-3" data-testid="morpheme-blocks-pipeline">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>
                  1. Morfologik Blok-Sxema (Özak va Qöşimçalar Zanjiri — batafsil ma’lumot uçun blok
                  ustiga bosing):
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {analysis.structureFormula}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/90 overflow-x-auto">
              <div className="flex items-stretch gap-2 min-w-max">
                {analysis.morphemes.map((morph, idx) => {
                  const style = CATEGORY_STYLES[morph.category];
                  const isSelected = activeMorphemeIndex === idx;

                  return (
                    <React.Fragment key={morph.id}>
                      {idx > 0 && (
                        <div className="flex flex-col items-center justify-center px-1 text-slate-400 select-none">
                          <span className="text-xs font-bold font-mono text-teal-700">+</span>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      )}

                      <button
                        key={`btn-${morph.id}`}
                        style={{ animationDelay: `${idx * 45}ms` }}
                        type="button"
                        onClick={() =>
                          setActiveMorphemeIndex(activeMorphemeIndex === idx ? null : idx)
                        }
                        data-testid={`morpheme-block-${idx}`}
                        className={`animate-card-reveal interactive-card group relative text-left rounded-xl p-4 border-2 min-w-[175px] max-w-[235px] flex flex-col justify-between cursor-pointer ${
                          style.bg
                        } ${style.border} ${
                          isSelected
                            ? 'ring-2 ring-teal-600 -translate-y-0.5 shadow-md'
                            : 'hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Top Notation & Step Header */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}
                            >
                              {morph.categoryLabel}
                            </span>
                            <span
                              title={morph.notationName}
                              className="inline-flex items-center justify-center px-1.5 h-6 rounded-md bg-white/90 border border-slate-200 font-mono text-[11px] font-bold text-slate-800 shadow-2xs"
                            >
                              {morph.notationSymbol}
                            </span>
                          </div>

                          {/* Crisp Vector Grammatical Marker above Morpheme */}
                          <div className="pt-1">
                            <MorphemeMarkerSvg
                              category={morph.category}
                              strokeColor={style.svgFill}
                            />
                            <div
                              className={`text-center text-2xl font-bold font-mono tracking-tight ${style.textMain}`}
                            >
                              {morph.text}
                            </div>
                          </div>
                        </div>

                        {/* Grammatical Role & Tri-Script Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1">
                          <p className="text-[11px] font-medium text-slate-700 leading-snug">
                            {morph.grammaticalRole}
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                            <span>Eski: {morph.oldLatin}</span>
                            <span>Кир: {morph.cyrillic}</span>
                          </div>
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Selected Morpheme Deep-Dive Banner */}
            {selectedMorpheme && (
              <div className="animate-slide-down p-4 rounded-xl bg-teal-50/80 border border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span>
                      Tanlangan morfema:{' '}
                      <span className="font-mono text-sm">{selectedMorpheme.text}</span> (
                      {selectedMorpheme.notationName})
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>Grammatik vazifasi:</strong> {selectedMorpheme.grammaticalRole}.
                    1995-yilgi yozuvda{' '}
                    <span className="font-mono font-semibold">{selectedMorpheme.oldLatin}</span>,
                    kirill alifbosida esa{' '}
                    <span className="font-mono font-semibold">{selectedMorpheme.cyrillic}</span>{' '}
                    shaklida yoziladi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMorphemeIndex(null)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 shrink-0"
                >
                  Yopiş
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. D3-STYLE INTERACTIVE SVG HIERARCHICAL TREE DIAGRAM */}
        {(viewMode === 'both' || viewMode === 'tree') && (
          <div className="space-y-3" data-testid="morpheme-svg-tree">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <GitBranch className="w-4 h-4 text-teal-700" />
                <span>
                  2. Grafik Daraxt Sxemasi (Sözning Bosqiçma-Bosqiç Yasaliş va Turlaniş Grafigi):
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Bosqiçlar: {cumulativeSteps.join(' → ')}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgLayout.svgWidth} ${svgLayout.svgHeight}`}
                className="w-full h-auto min-w-[680px] select-none"
                role="img"
                aria-label={`${analysis.newLatin} so'zining grafik morfologik daraxt sxemasi`}
              >
                <defs>
                  <linearGradient id="tilimloRootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f766e" />
                    <stop offset="100%" stopColor="#115e59" />
                  </linearGradient>
                  <filter id="nodeShadow" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                  </filter>
                </defs>

                {/* Curved Bezier Links from Complete Word Node to Each Morpheme Node */}
                {svgLayout.childNodes.map((node) => {
                  const style = CATEGORY_STYLES[node.morpheme.category];
                  return (
                    <g key={`link-${node.morpheme.id}`}>
                      <path
                        d={node.pathD}
                        fill="none"
                        stroke={style.svgStroke}
                        strokeWidth={2.5}
                        strokeDasharray={node.idx === 0 ? undefined : '5 3'}
                        className={node.idx === 0 ? undefined : 'svg-flow-link'}
                        opacity={0.85}
                      />
                      <circle cx={node.centerX} cy={node.y - 4} r={4} fill={style.svgFill} />
                    </g>
                  );
                })}

                {/* Horizontal Sequential Chain Connector between Child Nodes */}
                {svgLayout.childNodes.map((node, i) => {
                  if (i === 0) return null;
                  const prev = svgLayout.childNodes[i - 1];
                  const yMid = node.y + node.height / 2;
                  return (
                    <g key={`seq-${node.morpheme.id}`}>
                      <line
                        x1={prev.x + prev.width}
                        y1={yMid}
                        x2={node.x}
                        y2={yMid}
                        stroke="#94a3b8"
                        strokeWidth={1.75}
                      />
                      <circle
                        cx={(prev.x + prev.width + node.x) / 2}
                        cy={yMid}
                        r={8}
                        fill="#f1f5f9"
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />
                      <text
                        x={(prev.x + prev.width + node.x) / 2}
                        y={yMid + 3.5}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#0f766e"
                        fontFamily="Noto Sans Mono, monospace"
                      >
                        +
                      </text>
                    </g>
                  );
                })}

                {/* Top Complete Word Root Node */}
                <g
                  transform={`translate(${svgLayout.rootCenterX - 130}, ${
                    svgLayout.rootCenterY - 26
                  })`}
                  filter="url(#nodeShadow)"
                >
                  <rect
                    width={260}
                    height={50}
                    rx={12}
                    fill="url(#tilimloRootGrad)"
                    stroke="#14b8a6"
                    strokeWidth={1.5}
                  />
                  <text
                    x={130}
                    y={22}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="15"
                    fontWeight="700"
                    fontFamily="Noto Sans Mono, monospace"
                  >
                    {analysis.newLatin}
                  </text>
                  <text
                    x={130}
                    y={39}
                    textAnchor="middle"
                    fill="#ccfbf1"
                    fontSize="10"
                    fontWeight="500"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    Böğinlar: {analysis.syllables.join(' · ')} (
                    {analysis.partOfSpeech.toUpperCase()})
                  </text>
                </g>

                {/* Child Morpheme SVG Nodes */}
                {svgLayout.childNodes.map((node) => {
                  const style = CATEGORY_STYLES[node.morpheme.category];
                  return (
                    <g
                      key={`node-${node.morpheme.id}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setActiveMorphemeIndex(node.idx)}
                      className="cursor-pointer"
                      filter="url(#nodeShadow)"
                    >
                      <rect
                        width={node.width}
                        height={node.height}
                        rx={12}
                        fill="#ffffff"
                        stroke={style.svgStroke}
                        strokeWidth={2}
                      />
                      {/* Top Color Pill Bar */}
                      <rect
                        x={0}
                        y={0}
                        width={node.width}
                        height={24}
                        rx={10}
                        fill={style.svgFill}
                      />
                      <text
                        x={10}
                        y={15.5}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {node.idx + 1}. {node.morpheme.categoryLabel}
                      </text>
                      <text
                        x={node.width - 10}
                        y={15.5}
                        textAnchor="end"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="Noto Sans Mono, monospace"
                      >
                        {node.morpheme.notationSymbol}
                      </text>

                      {/* Morpheme Main Text */}
                      <text
                        x={node.width / 2}
                        y={50}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="17"
                        fontWeight="700"
                        fontFamily="Noto Sans Mono, monospace"
                      >
                        {node.morpheme.text}
                      </text>

                      {/* Cumulative Step Label at Bottom */}
                      <text
                        x={node.width / 2}
                        y={72}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize="10"
                        fontWeight="500"
                        fontFamily="Noto Sans Mono, monospace"
                      >
                        → {node.cumulativeWord}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Legend & Lexical Definition Footer */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Traditional Uzbek Grammatical Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">Shartli belgilar:</span>
            {Object.entries(CATEGORY_STYLES).map(([key, item]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{ backgroundColor: item.svgFill }}
                />
                <span>{item.legendLabel}</span>
              </span>
            ))}
          </div>

          {/* Lexical Meaning */}
          <div className="flex items-start sm:items-center gap-2 text-xs text-slate-700 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/70">
            <BookOpen className="w-4 h-4 text-teal-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Lug‘aviy izoh:</strong> {analysis.definition}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});
