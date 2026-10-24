import React, { useState, useMemo } from 'react';
import { Search, Volume2, Plus, ArrowUpRight, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { DictionaryEntry } from '../utils/uzbekDictionaryData';
import {
  normalizeToNewUzbekLatin,
  convertFromNewUzbekLatin,
  syllabifyUzbekWord,
  analyzeSingleUzbekWord
} from '../utils/uzbekLinguistics';
import { UZBEK_ROOT_LEXICON, WordMorphologyAnalysis } from '../utils/uzbekMorphology';
import { speakUzbekText } from '../utils/speechUtils';

interface DictionaryViewProps {
  entries: DictionaryEntry[];
  onAddEntry: (entry: DictionaryEntry) => void;
  onSendToTranslator: (text: string) => void;
}

const LETTER_FILTERS: Array<{ id: 'ALL' | 'Ö' | 'Ğ' | 'Ş' | 'Ç' | '’'; label: string }> = [
  { id: 'ALL', label: 'Barcha sözlar' },
  { id: 'Ö', label: 'Ö ö (O‘)' },
  { id: 'Ğ', label: 'Ğ ğ (G‘)' },
  { id: 'Ş', label: 'Ş ş (Sh)' },
  { id: 'Ç', label: 'Ç ç (Ch)' },
  { id: '’', label: '’ (Tutuq belgisi)' }
];

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  entries,
  onAddEntry,
  onSendToTranslator
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLetter, setActiveLetter] = useState<'ALL' | 'Ö' | 'Ğ' | 'Ş' | 'Ç' | '’'>('ALL');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newWordInput, setNewWordInput] = useState<string>('');
  const [newWordPartOfSpeech, setNewWordPartOfSpeech] =
    useState<DictionaryEntry['partOfSpeech']>('ot');
  const [newWordDefinition, setNewWordDefinition] = useState<string>('');
  const [newWordExample, setNewWordExample] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [aiWordResult, setAiWordResult] = useState<WordMorphologyAnalysis | null>(null);
  const [aiLookupLoading, setAiLookupLoading] = useState<boolean>(false);
  const [savedLiveWordNotice, setSavedLiveWordNotice] = useState<string>('');

  // Merge curated INITIAL_DICTIONARY with all roots from UZBEK_ROOT_LEXICON without duplicates
  const combinedEntries = useMemo(() => {
    const existingSet = new Set(entries.map((e) => e.newLatin.toLowerCase()));
    const extra: DictionaryEntry[] = [];
    Object.values(UZBEK_ROOT_LEXICON).forEach((item, idx) => {
      const lower = item.root.toLowerCase();
      if (!existingSet.has(lower)) {
        existingSet.add(lower);
        let featured: DictionaryEntry['featuredLetter'] = 'Umumiy';
        if (/[Öö]/.test(item.root)) featured = 'Ö';
        else if (/[Ğğ]/.test(item.root)) featured = 'Ğ';
        else if (/[Şş]/.test(item.root)) featured = 'Ş';
        else if (/[Çç]/.test(item.root)) featured = 'Ç';
        else if (/’/.test(item.root)) featured = '’';

        const exNew =
          item.exampleNewLatin ||
          `${item.root} — yangi 2026-yilgi özbek alifbosidagi faol söz.`;

        extra.push({
          id: `lex-root-${idx}-${lower}`,
          newLatin: item.root,
          oldLatin: convertFromNewUzbekLatin(item.root, 'old-latin'),
          cyrillic: convertFromNewUzbekLatin(item.root, 'cyrillic'),
          syllables: syllabifyUzbekWord(item.root),
          partOfSpeech: item.partOfSpeech,
          featuredLetter: featured,
          definition: item.definition,
          exampleNewLatin: exNew,
          exampleOldLatin: convertFromNewUzbekLatin(exNew, 'old-latin')
        });
      }
    });
    return [...entries, ...extra];
  }, [entries]);

  // Live morphological analysis for ANY typed query
  const liveMorphAnalysis = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return analyzeSingleUzbekWord(q);
  }, [searchQuery]);

  const normalizedQuery = liveMorphAnalysis ? liveMorphAnalysis.newLatin.toLowerCase() : '';
  const stemQuery = liveMorphAnalysis ? liveMorphAnalysis.root.toLowerCase() : '';

  const filteredEntries = combinedEntries.filter((item) => {
    if (activeLetter !== 'ALL' && item.featuredLetter !== activeLetter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const itemLower = item.newLatin.toLowerCase();
    const rawQ = searchQuery.trim().toLowerCase();
    return (
      itemLower.includes(normalizedQuery) ||
      (stemQuery.length >= 2 && itemLower.includes(stemQuery)) ||
      item.oldLatin.toLowerCase().includes(rawQ) ||
      item.cyrillic.toLowerCase().includes(rawQ) ||
      item.definition.toLowerCase().includes(normalizedQuery)
    );
  });

  const activeMorph = aiWordResult && aiWordResult.originalInput === searchQuery.trim()
    ? aiWordResult
    : liveMorphAnalysis;

  const handleAiDeepLookup = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setAiLookupLoading(true);
    try {
      const response = await fetch('/api/ai/word-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: q })
      });
      if (response.ok) {
        const data = await response.json();
        setAiWordResult(data);
      }
    } catch {
      // Keep local morphology result
    } finally {
      setAiLookupLoading(false);
    }
  };

  const handleSaveAnalyzedWordToDictionary = (morph: WordMorphologyAnalysis) => {
    let featuredLetter: DictionaryEntry['featuredLetter'] = 'Umumiy';
    if (/[Öö]/.test(morph.newLatin)) featuredLetter = 'Ö';
    else if (/[Ğğ]/.test(morph.newLatin)) featuredLetter = 'Ğ';
    else if (/[Şş]/.test(morph.newLatin)) featuredLetter = 'Ş';
    else if (/[Çç]/.test(morph.newLatin)) featuredLetter = 'Ç';
    else if (/’/.test(morph.newLatin)) featuredLetter = '’';

    const newItem: DictionaryEntry = {
      id: `dict-live-${Date.now()}`,
      newLatin: morph.newLatin,
      oldLatin: morph.oldLatin,
      cyrillic: morph.cyrillic,
      syllables: morph.syllables,
      partOfSpeech: morph.partOfSpeech,
      featuredLetter,
      definition: morph.definition,
      exampleNewLatin: morph.exampleNewLatin,
      exampleOldLatin: convertFromNewUzbekLatin(morph.exampleNewLatin, 'old-latin')
    };

    onAddEntry(newItem);
    setSavedLiveWordNotice(`"${morph.newLatin}" sözi luğat jadvaliga muvaffaqiyatli qöşildi.`);
    setTimeout(() => setSavedLiveWordNotice(''), 3000);
  };

  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim() || !newWordDefinition.trim()) {
      setFormError('Iltimos, söz va uning izohini kiriting.');
      return;
    }

    const reformedWord = normalizeToNewUzbekLatin(newWordInput.trim());
    const oldLatinWord = convertFromNewUzbekLatin(reformedWord, 'old-latin');
    const cyrillicWord = convertFromNewUzbekLatin(reformedWord, 'cyrillic');
    const syllables = syllabifyUzbekWord(reformedWord);

    let featuredLetter: DictionaryEntry['featuredLetter'] = 'Umumiy';
    if (/[Öö]/.test(reformedWord)) featuredLetter = 'Ö';
    else if (/[Ğğ]/.test(reformedWord)) featuredLetter = 'Ğ';
    else if (/[Şş]/.test(reformedWord)) featuredLetter = 'Ş';
    else if (/[Çç]/.test(reformedWord)) featuredLetter = 'Ç';
    else if (/’/.test(reformedWord)) featuredLetter = '’';

    const exampleNew = newWordExample.trim()
      ? normalizeToNewUzbekLatin(newWordExample.trim())
      : `${reformedWord} — yangi 2026 alifbo luğatiga kiritilgan söz.`;

    const newItem: DictionaryEntry = {
      id: `dict-custom-${Date.now()}`,
      newLatin: reformedWord,
      oldLatin: oldLatinWord,
      cyrillic: cyrillicWord,
      syllables,
      partOfSpeech: newWordPartOfSpeech,
      featuredLetter,
      definition: normalizeToNewUzbekLatin(newWordDefinition.trim()),
      exampleNewLatin: exampleNew,
      exampleOldLatin: convertFromNewUzbekLatin(exampleNew, 'old-latin')
    };

    onAddEntry(newItem);
    setNewWordInput('');
    setNewWordDefinition('');
    setNewWordExample('');
    setFormError('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Uç yozuvli universal özbek tili luğati va morfologik tahlilçisi (2026)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Özbek tilidagi <strong>har qanday sözni</strong> (apostrofsiz, qöşimçali, eski lotin
              yoki kirillda: masalan <span className="font-mono">sozlarni, kop, oqituvchilarimizga</span>)
              qidiring — tizim söz özagi va qöşimçalarini avtomatik taniydi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Formani yopiş' : 'Luğatga yangi söz qöşiş'}</span>
          </button>
        </div>

        {/* Add Word Expandable Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateWord}
            className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
          >
            <div className="text-sm font-semibold text-slate-900">
              Luğatga yangi söz qöşiş (Avtomatik 3 yozuvga ögiriladi)
            </div>

            {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="dict-new-word"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Söz (istalgan yozuvda)
                </label>
                <input
                  id="dict-new-word"
                  type="text"
                  value={newWordInput}
                  onChange={(e) => setNewWordInput(e.target.value)}
                  placeholder="Masalan: o'zbekona yoki ўзбекона"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
                {newWordInput.trim() && (
                  <p className="text-xs text-teal-700 font-mono mt-1">
                    2026 shakli: {normalizeToNewUzbekLatin(newWordInput)} (
                    {syllabifyUzbekWord(newWordInput)})
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="dict-pos" className="block text-xs font-medium text-slate-700 mb-1">
                  Söz turkumi
                </label>
                <select
                  id="dict-pos"
                  value={newWordPartOfSpeech}
                  onChange={(e) =>
                    setNewWordPartOfSpeech(e.target.value as DictionaryEntry['partOfSpeech'])
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                >
                  <option value="ot">Ot (Noun)</option>
                  <option value="sifat">Sifat (Adjective)</option>
                  <option value="fe’l">Fe’l (Verb)</option>
                  <option value="ravish">Raviş (Adverb)</option>
                  <option value="olmosh">Olmoş (Pronoun)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="dict-example"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Misol jumla (ixtiyoriy)
                </label>
                <input
                  id="dict-example"
                  type="text"
                  value={newWordExample}
                  onChange={(e) => setNewWordExample(e.target.value)}
                  placeholder="Söz ishtirok etgan jumla..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex-1">
                <label
                  htmlFor="dict-definition"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Sözning izohi (ma’nosi)
                </label>
                <input
                  id="dict-definition"
                  type="text"
                  value={newWordDefinition}
                  onChange={(e) => setNewWordDefinition(e.target.value)}
                  placeholder="Sözning lug'aviy ma'nosini kiriting..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Luğatga saqlaş
              </button>
            </div>
          </form>
        )}

        {/* Search Input + Segmented Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="dictionary-search-input" className="sr-only">
              Lug'atdan istalgan o'zbekcha so'zni qidirish va tahlil qilish
            </label>
            <input
              id="dictionary-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Istalgan özbekça sözni yozing: sozlarni, oqituvchilarimiz, ўқитувчи, kitobxonlar..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {LETTER_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveLetter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeLetter === f.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Universal Word Analyzer Card (Shows whenever the user types ANY word in search) */}
      {activeMorph && (
        <section
          aria-label="Qidirilgan so'zning jonli morfologik va 3 yozuvli tahlili"
          data-testid="live-morphology-card"
          className="bg-white border border-teal-300 rounded-xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-xs font-semibold text-teal-800">
                Jonli morfologik va 3 yozuvli söz tahlili
              </span>
              {activeMorph.wasAutoCorrected && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="text-xs text-amber-800 font-mono">
                    Avto-töğrilandi: {activeMorph.originalInput} → {activeMorph.newLatin}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => speakUzbekText(`${activeMorph.newLatin}. ${activeMorph.exampleNewLatin}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Talaffuzni tinglaş</span>
              </button>

              <button
                type="button"
                onClick={handleAiDeepLookup}
                disabled={aiLookupLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>{aiLookupLoading ? 'AI tahlil qilmoqda...' : 'AI kengaytirilgan izoh'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAnalyzedWordToDictionary(activeMorph)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Luğat jadvaliga qöşiş</span>
              </button>
            </div>
          </div>

          {savedLiveWordNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedLiveWordNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-sm">
            <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-lg">
              <div className="text-xs text-slate-500 font-sans">2026 Yangi Lotin</div>
              <div className="text-lg font-bold text-teal-900 mt-0.5">{activeMorph.newLatin}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 font-sans">Eski Lotin (1995)</div>
              <div className="text-base font-semibold text-slate-800 mt-0.5">
                {activeMorph.oldLatin}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 font-sans">Kirill yozuvi</div>
              <div className="text-base font-semibold text-slate-800 mt-0.5">
                {activeMorph.cyrillic}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 font-sans">Böğinlar va turkum</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {activeMorph.syllables} · <span className="italic">{activeMorph.partOfSpeech}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs pt-1">
            <div className="lg:col-span-5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-semibold text-slate-800">
                Morfologik tarkib (Özak + Qöşimçalar):
              </div>
              <div className="font-mono text-slate-900">
                <span className="font-bold text-teal-800">Özak: {activeMorph.root}</span>
                {activeMorph.suffixes.length > 0 ? (
                  activeMorph.suffixes.map((s, idx) => (
                    <span key={idx} className="text-slate-700">
                      {' '}
                      + -{s.suffix} <span className="font-sans text-slate-500">({s.meaning})</span>
                    </span>
                  ))
                ) : (
                  <span className="font-sans text-slate-500"> (tub söz, qöşimçasiz)</span>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-semibold text-slate-800">Izoh va misol (Google Qidiruv + Morfologiya):</div>
              <p className="text-slate-700 leading-relaxed">{activeMorph.definition}</p>
              <p className="text-slate-500 italic">&ldquo;{activeMorph.exampleNewLatin}&rdquo;</p>
              {Array.isArray((activeMorph as unknown as { sources?: Array<{ uri: string; title: string }> }).sources) &&
                ((activeMorph as unknown as { sources: Array<{ uri: string; title: string }> }).sources.length > 0) && (
                  <div className="pt-1.5 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-teal-800">Google Qidiruv manbasi:</span>
                    {(activeMorph as unknown as { sources: Array<{ uri: string; title: string }> }).sources.map(
                      (src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 hover:text-teal-950 underline"
                        >
                          {src.title}
                        </a>
                      )
                    )}
                  </div>
                )}
            </div>
          </div>
        </section>
      )}

      {/* Dictionary Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Luğat bazasidagi sözlar jadvali:{' '}
            <strong className="font-mono text-slate-900 tabular-nums">
              {filteredEntries.length}
            </strong>{' '}
            ta söz
          </span>
          <span>Har qanday yangi yoki qöşimçali söz yuqoridagi jonli tahlil oynasida ochiladi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-5">Yangi 2026 Lotin</th>
                <th className="py-3.5 px-4">Eski Lotin (1995)</th>
                <th className="py-3.5 px-4">Kirill yozuvi</th>
                <th className="py-3.5 px-4">Böğin va turkum</th>
                <th className="py-3.5 px-5">Ma’nosi va misol jumla</th>
                <th className="py-3.5 px-5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredEntries.slice(0, 40).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5 align-top">
                    <div className="font-bold text-base text-teal-800 font-mono">
                      {item.newLatin}
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top font-mono text-slate-600">{item.oldLatin}</td>
                  <td className="py-4 px-4 align-top font-mono text-slate-600">{item.cyrillic}</td>
                  <td className="py-4 px-4 align-top">
                    <div className="text-xs font-mono text-slate-700">
                      {item.syllables} ·{' '}
                      <span className="italic text-slate-500">{item.partOfSpeech}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 align-top max-w-md space-y-1">
                    <div className="text-slate-900 text-xs leading-relaxed">{item.definition}</div>
                    <div className="text-xs text-slate-500 italic">
                      &ldquo;{item.exampleNewLatin}&rdquo;
                    </div>
                  </td>
                  <td className="py-4 px-5 align-top text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          speakUzbekText(
                            `${item.newLatin}. ${item.exampleNewLatin}`,
                            () => setSpeakingId(item.id),
                            () => setSpeakingId(null)
                          )
                        }
                        aria-label={`${item.newLatin} so'zini tinglash`}
                        className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Talaffuzni tinglaş"
                      >
                        <Volume2
                          className={`w-4 h-4 ${speakingId === item.id ? 'text-teal-600' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSendToTranslator(item.exampleOldLatin)}
                        aria-label={`${item.newLatin} misolini tarjimonda ochish`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Tarjimonda</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
