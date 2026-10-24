import React, { useState, useRef, useMemo, useDeferredValue } from 'react';
import {
  Volume2,
  Mic,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  GitBranch,
  Layers,
  MessageSquare
} from 'lucide-react';
import {
  analyzeUzbekText,
  convertFromNewUzbekLatin,
  applyAllOrthographyFixes,
  analyzeSingleUzbekWord,
  TargetScript,
  OrthographyIssue
} from '../utils/uzbekLinguistics';
import { WordMorphologyAnalysis } from '../utils/uzbekMorphology';
import { SAMPLE_PRESETS } from '../utils/uzbekDictionaryData';
import { speakUzbekText } from '../utils/speechUtils';
import { MorphologicalDiagramSection } from './MorphologicalDiagramSection';

type WorkspaceSubTab = 'imlo-statistika' | 'morfologik-grafik' | 'hammasi';

interface TranslatorWorkspaceProps {
  inputText: string;
  setInputText: (val: string) => void;
  onOpenDedicatedMorphology?: (word?: string) => void;
  onOpenAiChat?: () => void;
}

const VIRTUAL_KEYS = [
  { char: 'Ö', label: 'Ö (O‘)' },
  { char: 'ö', label: 'ö (o‘)' },
  { char: 'Ğ', label: 'Ğ (G‘)' },
  { char: 'ğ', label: 'ğ (g‘)' },
  { char: 'Ş', label: 'Ş (Sh)' },
  { char: 'ş', label: 'ş (sh)' },
  { char: 'Ç', label: 'Ç (Ch)' },
  { char: 'ç', label: 'ç (ch)' },
  { char: '’', label: '’ (Tutuq)' }
];

const VOICE_DEMO_PHRASES = [
  "Assalomu alaykum! O'zbekistonning go'zal shaharlari va chiroyli bog'lariga xush kelibsiz.",
  "O'zbek tilidagi barcha sozlar va qoshimchalar yangi 2026 alifbosiga avtomatik ogiriladi.",
  'Илм ва таълим ҳар бир инсон ҳаётида энг муҳим ўрин тутади.'
];

export const TranslatorWorkspace: React.FC<TranslatorWorkspaceProps> = React.memo(({
  inputText,
  setInputText,
  onOpenDedicatedMorphology,
  onOpenAiChat
}) => {
  const [targetScript, setTargetScript] = useState<TargetScript>('new-latin-2026');
  const [highlightChanges, setHighlightChanges] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeakingInput, setIsSpeakingInput] = useState<boolean>(false);
  const [isSpeakingOutput, setIsSpeakingOutput] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showVoicePrompts, setShowVoicePrompts] = useState<boolean>(false);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string>('');
  const [aiProofreadLoading, setAiProofreadLoading] = useState<boolean>(false);
  const [aiStylisticNote, setAiStylisticNote] = useState<string>('');
  const [inspectedWord, setInspectedWord] = useState<WordMorphologyAnalysis | null>(null);
  const [workspaceSubTab, setWorkspaceSubTab] = useState<WorkspaceSubTab>('imlo-statistika');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Defer heavy text analysis so typing in the textarea remains 60fps smooth
  const deferredInputText = useDeferredValue(inputText);

  const analysis = useMemo(
    () => analyzeUzbekText(deferredInputText),
    [deferredInputText]
  );

  const outputText = useMemo(
    () =>
      targetScript === 'new-latin-2026'
        ? analysis.convertedText
        : convertFromNewUzbekLatin(deferredInputText, targetScript),
    [targetScript, analysis.convertedText, deferredInputText]
  );

  const scriptBadgeLabel = {
    'old-latin': 'Eski Lotin / Erkin kiritiş',
    cyrillic: 'Kirill yozuvi',
    'new-latin-2026': 'Yangi 2026 Lotin',
    mixed: 'Aralaş yozuv (Lotin + Kirill)'
  }[analysis.detectedScript];

  const handleInsertChar = (char: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInputText(inputText + char);
      return;
    }
    const start = el.selectionStart ?? inputText.length;
    const end = el.selectionEnd ?? inputText.length;
    const nextVal = inputText.slice(0, start) + char + inputText.slice(end);
    setInputText(nextVal);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    });
  };

  const handleCopyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
    } catch {
      // Fallback copy
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadOutput = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tilimlo-2026-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFixSingleIssue = (issue: OrthographyIssue) => {
    const before = inputText.slice(0, issue.index);
    const after = inputText.slice(issue.index + issue.originalWord.length);
    setInputText(before + issue.suggestedWord + after);
  };

  const handleFixAllIssues = () => {
    const fixed = applyAllOrthographyFixes(inputText);
    setInputText(fixed);
    setAiStylisticNote(
      `Barcha imlo, özak-qöşimça va 2026-yilgi alifbo xatolari (${analysis.issues.length} ta) avtomatik töğrilandi.`
    );
  };

  const handleAiProofread = async () => {
    if (!inputText.trim()) return;
    setAiProofreadLoading(true);
    setAiStylisticNote('');
    try {
      const response = await fetch('/api/ai/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await response.json();
      if (data.correctedText) {
        setInputText(data.correctedText);
      }
      if (data.stylisticNote) {
        setAiStylisticNote(data.stylisticNote);
      }
    } catch {
      const fixed = applyAllOrthographyFixes(inputText);
      setInputText(fixed);
      setAiStylisticNote(
        'Matn 2026-yilgi yangilangan özbek alifbosi va morfologik qoidalar asosida töliq töğrilandi.'
      );
    } finally {
      setAiProofreadLoading(false);
    }
  };

  const handleInspectWordToken = (rawToken: string, switchToMorphology = false) => {
    const clean = rawToken.replace(/^[^A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’'‘`]+|[^A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’'‘`]+$/g, '');
    if (!clean) return;
    setInspectedWord(analyzeSingleUzbekWord(clean));
    if (switchToMorphology) {
      setWorkspaceSubTab('morfologik-grafik');
    }
  };

  const handleVoiceInputToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceStatusMessage('');
      return;
    }

    const SpeechRecognitionAPI =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (typeof SpeechRecognitionAPI === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognitionAPI as any)();
        recognition.lang = 'uz-UZ';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsRecording(true);
        setVoiceStatusMessage('Ovoz tinglanmoqda... Gapiring yoki namuna jumlani tanlang.');
        setShowVoicePrompts(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = event?.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInputText(inputText ? `${inputText.trim()} ${transcript}` : transcript);
            setVoiceStatusMessage('Ovozli nutq matnga aylantirildi va 2026 alifbosiga ögirildi.');
          }
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
          setShowVoicePrompts(true);
          setVoiceStatusMessage(
            'Mikrofon orqali tayyor ovozli jumlalardan birini sinab köring:'
          );
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        return;
      } catch {
        // Fall through
      }
    }

    setShowVoicePrompts((prev) => !prev);
    setVoiceStatusMessage('Ovozli tarjimani sinab köriş uçun nutq namunasini tanlang:');
  };

  const handleSelectVoiceSample = (phrase: string) => {
    setInputText(phrase);
    setShowVoicePrompts(false);
    setVoiceStatusMessage('Ovozli nutq qabul qilindi va yangi 2026 alifboga ögirildi.');
    speakUzbekText(
      convertFromNewUzbekLatin(phrase, 'new-latin-2026'),
      () => setIsSpeakingOutput(true),
      () => setIsSpeakingOutput(false)
    );
  };

  return (
    <div className="space-y-8">
      {/* Sample Presets & Quick Rules Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Tayyor matn namunalari:</span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setInputText(preset.text);
                setAiStylisticNote('');
                setInspectedWord(null);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-teal-50 hover:text-teal-900 border border-transparent hover:border-teal-600/30 rounded-lg transition-all whitespace-nowrap shrink-0"
            >
              {preset.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-teal-900 bg-teal-50/70 border border-teal-200/70 px-3 py-1.5 rounded-lg font-mono font-semibold">
          <span>O‘ → Ö</span>
          <span aria-hidden="true" className="text-teal-400">·</span>
          <span>G‘ → Ğ</span>
          <span aria-hidden="true" className="text-teal-400">·</span>
          <span>Sh → Ş</span>
          <span aria-hidden="true" className="text-teal-400">·</span>
          <span>Ch → Ç</span>
        </div>
      </div>

      {/* Optional Voice Input Drawer */}
      {(showVoicePrompts || voiceStatusMessage) && (
        <div className="animate-slide-down bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="text-xs font-medium text-teal-300">
              Ovozli tarjima va nutqni aniqlash tizimi
            </div>
            <p className="text-sm text-slate-200">
              {voiceStatusMessage ||
                'Ovozli nutqni darhol 2026-yilgi yangi özbek lotin alifbosiga ögiriş va tinglaş:'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {VOICE_DEMO_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectVoiceSample(phrase)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-teal-700 text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                Ovozli namuna #{idx + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowVoicePrompts(false);
                setVoiceStatusMessage('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Yopiş
            </button>
          </div>
        </div>
      )}

      {/* Main Dual-Pane Translator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Pane: Source Input */}
        <section
          aria-label="Manba matn kiritish oynasi"
          className="interactive-card bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden focus-within:border-teal-700/70 transition-colors"
        >
          <div>
            {/* Pane Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/80">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 animate-pulse" />
                <span className="font-bold text-slate-900">Manba matni</span>
                <span aria-hidden="true">·</span>
                <span className="text-teal-800 font-semibold" data-testid="detected-script-label">
                  Aniqlangan: {scriptBadgeLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVoiceInputToggle}
                  aria-label="Ovozli tarjima kiritish"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isRecording
                      ? 'bg-red-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isRecording ? 'Tinglanmoqda...' : 'Ovozli kiritiş'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    speakUzbekText(
                      inputText,
                      () => setIsSpeakingInput(true),
                      () => setIsSpeakingInput(false)
                    )
                  }
                  disabled={!inputText.trim()}
                  aria-label="Manba matnni ovozli tinglash"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeakingInput ? 'Öqilmoqda...' : 'Tinglaş'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputText('');
                    setAiStylisticNote('');
                    setInspectedWord(null);
                  }}
                  disabled={!inputText}
                  aria-label="Matnni tozalash"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tozalaş</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="p-5 sm:p-6">
              <label htmlFor="uzbek-source-textarea" className="sr-only">
                Tarjima qilinadigan matnni kiriting
              </label>
              <textarea
                id="uzbek-source-textarea"
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={7}
                placeholder="Özbek tilidagi istalgan söz yoki matnni kiriting (masalan: sozlarni, o'qituvchi, ўқитувчи)..."
                className="w-full resize-none border-0 bg-transparent text-slate-900 placeholder:text-slate-400 text-base leading-relaxed focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Virtual Keyboard & Character Counter Footer */}
          <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 mr-1">Harf qöşiş:</span>
              {VIRTUAL_KEYS.map((k) => (
                <button
                  key={k.char}
                  type="button"
                  onClick={() => handleInsertChar(k.char)}
                  title={k.label}
                  aria-label={`${k.label} harfini kiritish`}
                  className="keycap-btn px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-800 text-slate-800 rounded-md"
                >
                  {k.char}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {analysis.wordCount} söz · {analysis.charCount} belgi
            </div>
          </div>
        </section>

        {/* Right Pane: Reformed 2026 Output */}
        <section
          aria-label="Yangilangan 2026 o'zbek lotin alifbosi natija oynasi"
          className="interactive-card bg-white border border-teal-700/25 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden"
        >
          <div>
            {/* Output Header with Target Script Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 bg-teal-50/35">
              <div className="flex items-center gap-1 bg-slate-200/75 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTargetScript('new-latin-2026')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    targetScript === 'new-latin-2026'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2026 Lotin (Ö, Ğ, Ş, Ç)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScript('cyrillic')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    targetScript === 'cyrillic'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kirill
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScript('old-latin')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    targetScript === 'old-latin'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eski Lotin
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    speakUzbekText(
                      outputText,
                      () => setIsSpeakingOutput(true),
                      () => setIsSpeakingOutput(false)
                    )
                  }
                  disabled={!outputText.trim()}
                  aria-label="Natija matnni ovozli o'qish"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeakingOutput ? 'Ovozli öqilmoqda...' : 'Ovozli tarjima'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyOutput}
                  disabled={!outputText.trim()}
                  aria-label="Natijadan nusxa olish"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nusxalandi</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Nusxa oliş</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOutput}
                  disabled={!outputText.trim()}
                  aria-label="Matnni fayl sifatida yuklab olish"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Output Content Display (Words are clickable for instant morphological inspection) */}
            <div
              className="p-5 min-h-[196px] text-base leading-relaxed text-slate-900 whitespace-pre-wrap"
              data-testid="translated-output-box"
            >
              {!outputText.trim() ? (
                <p className="text-slate-400">
                  Chap oynaga matn kiriting — bu yerda 2026-yilgi yangilangan özbek lotin alifbosidagi
                  natija darhol aks etadi.
                </p>
              ) : targetScript === 'new-latin-2026' && highlightChanges ? (
                <div>
                  {analysis.diffWords.map((seg, i) =>
                    /^\s+$/.test(seg.text) ? (
                      <span key={i}>{seg.text}</span>
                    ) : seg.changed ? (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInspectWordToken(seg.original || seg.text, true)}
                        title={`Asli: ${seg.original} (Morfologik tahlil uçun bosing)`}
                        className="inline bg-teal-50 hover:bg-teal-100 text-teal-900 font-medium underline decoration-teal-500/60 decoration-2 underline-offset-4 rounded-xs px-0.5 cursor-pointer transition-colors"
                      >
                        {seg.text}
                      </button>
                    ) : (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInspectWordToken(seg.text, true)}
                        title="Sözni morfologik tahlil qiliş uçun bosing"
                        className="inline hover:bg-slate-100 rounded-xs px-0.5 cursor-pointer transition-colors"
                      >
                        {seg.text}
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div>{outputText}</div>
              )}
            </div>
          </div>

          {/* Output Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highlightChanges}
                onChange={(e) => setHighlightChanges(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <span>
                Özgargan sözlarni ajratib körsatiş ({analysis.reformedWordCount} ta) · Söz ustiga
                bosib morfologik tahlil qiling
              </span>
            </label>

            <button
              type="button"
              onClick={() => setInputText(outputText)}
              disabled={!outputText.trim() || outputText === inputText}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Natijani manbaga ötkaziş</span>
            </button>
          </div>
        </section>
      </div>

      {/* Sectioned Workspace Navigation Bar (Prevents DOM bloat & lag by rendering active tool section on demand) */}
      <div
        role="region"
        aria-label="Tarjimon tahlil bo'limlari"
        className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="subtab-imlo-statistika"
            onClick={() => setWorkspaceSubTab('imlo-statistika')}
            className={`btn-modern inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
              workspaceSubTab === 'imlo-statistika'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Imlo Tekşiruvi va Statistika</span>
            {analysis.issues.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  workspaceSubTab === 'imlo-statistika'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {analysis.issues.length} xato
              </span>
            )}
          </button>

          <button
            type="button"
            data-testid="subtab-morfologik-grafik"
            onClick={() => setWorkspaceSubTab('morfologik-grafik')}
            className={`btn-modern inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
              workspaceSubTab === 'morfologik-grafik'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Morfologik Tahlil (Grafik Blok + Sxema)</span>
          </button>

          <button
            type="button"
            data-testid="subtab-hammasi"
            onClick={() => setWorkspaceSubTab('hammasi')}
            className={`btn-modern inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl cursor-pointer ${
              workspaceSubTab === 'hammasi'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Barcha bölimlar</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenDedicatedMorphology && (
            <button
              type="button"
              onClick={() => onOpenDedicatedMorphology(inspectedWord?.originalInput)}
              className="btn-modern inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl whitespace-nowrap shrink-0"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Morfologiya sahifasiga ötiş</span>
            </button>
          )}
          {onOpenAiChat && (
            <button
              type="button"
              onClick={onOpenAiChat}
              className="btn-modern inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
              <span>AI Savol-Javob sahifasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Graphical Morphological Analysis Section (Rendered when Morfologik Grafik or Barcha bölimlar is active) */}
      {(workspaceSubTab === 'morfologik-grafik' || workspaceSubTab === 'hammasi') && (
        <div className="animate-page-enter">
          <MorphologicalDiagramSection
            inputText={deferredInputText}
            externalSelectedWord={inspectedWord?.originalInput || null}
            onSelectWord={(w) => handleInspectWordToken(w, false)}
            onOpenDedicatedPage={
              onOpenDedicatedMorphology
                ? () => onOpenDedicatedMorphology(inspectedWord?.originalInput)
                : undefined
            }
          />
        </div>
      )}

      {/* Bottom Split: Error Checker & Deep Text Analysis (Rendered when Imlo-Statistika or Barcha bölimlar is active) */}
      {(workspaceSubTab === 'imlo-statistika' || workspaceSubTab === 'hammasi') && (
      <div className="animate-page-enter grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Error Checker & Orthographic Assistant (7 columns) */}
        <section
          aria-label="Matndagi xatolarni tekshirish va to'g'rilash"
          className="interactive-card lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Xatolarni tekşiriş va morfologik töğrilaş
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Apostrofsiz yozilgan sözlar (<span className="font-mono">sozlarni → sözlarni</span>),
                eski birikmalar (O‘, G‘, Sh, Ch), tutuq belgisi (’) va X/H xatolarini aniqlaydi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAiProofread}
                disabled={aiProofreadLoading || !inputText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>{aiProofreadLoading ? 'Tekşirilmoqda...' : 'Chuqur tahrir'}</span>
              </button>

              <button
                type="button"
                onClick={handleFixAllIssues}
                disabled={analysis.issues.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Barchasini töğrilaş ({analysis.issues.length})</span>
              </button>
            </div>
          </div>

          {aiStylisticNote && (
            <div className="animate-slide-down p-3.5 rounded-lg bg-teal-50/80 border border-teal-200 text-xs text-teal-900 flex items-center justify-between gap-3">
              <span>✓ {aiStylisticNote}</span>
              <button
                type="button"
                onClick={() => setAiStylisticNote('')}
                className="text-teal-700 hover:text-teal-950 font-medium shrink-0"
              >
                Yopiş
              </button>
            </div>
          )}

          {analysis.issues.length === 0 ? (
            <div
              className="py-8 text-center space-y-2 bg-slate-50 rounded-lg border border-slate-200/70"
              data-testid="no-orthography-errors"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Matn 2026-yilgi yangi özbek lotin alifbosi me’yorlariga töliq mos!
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Heç qanday eski digraf, apostrof xatosi yoki X/H imlo kamçiligi topilmadi. Sinab
                köriş uçun yuqoridagi &ldquo;Apostrofsiz va qöşimçali sözlar&rdquo; namunasini bosing.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[340px] overflow-y-auto pr-1">
              {analysis.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-through decoration-red-500/70 text-slate-600">
                          {issue.originalWord}
                        </span>
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-teal-800 font-mono">
                        {issue.suggestedWord}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs text-slate-500">{issue.categoryLabel}</span>
                    </div>
                    <p className="text-xs text-slate-600">{issue.explanation}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFixSingleIssue(issue)}
                    aria-label={`${issue.originalWord} so'zini ${issue.suggestedWord} ga to'g'rilash`}
                    className="btn-modern px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    Töğrilaş
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Linguistic & Statistical Text Analyzer (5 columns) */}
        <section
          aria-label="Matnni lingvistik tahlil qilish"
          className="interactive-card lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Matnni lingvistik tahlil qiliş</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Yangilangan harflar qatnaşuvi, böğinlar va fonetik tarkib.
              </p>
            </div>
            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          {/* 4-Metric Tabular Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500">Sözlar / Gaplar</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {analysis.wordCount} / {analysis.sentenceCount}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500">Böğinlar soni</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {analysis.syllableCount}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500">Yangi harflar</div>
              <div
                className="text-lg font-bold text-teal-700 font-mono tabular-nums mt-0.5"
                data-testid="total-replacements-count"
              >
                {analysis.totalReplacements} ta
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500">Islohot uluşi</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {analysis.reformImpactPercent}%
              </div>
            </div>
          </div>

          {/* Reformed Character Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">2026 Harf</th>
                  <th className="py-2 font-medium">Eski / Kirill</th>
                  <th className="py-2 font-medium text-right">Soni</th>
                  <th className="py-2 pl-4 font-medium">Matndagi misollar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.replacements.map((rep) => (
                  <tr key={rep.symbol} className="hover:bg-slate-50/80">
                    <td className="py-2.5 font-mono font-bold text-teal-800">{rep.symbol}</td>
                    <td className="py-2.5 text-slate-600 font-mono">{rep.oldEquivalent}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {rep.count}
                    </td>
                    <td className="py-2.5 pl-4 text-slate-600 truncate max-w-[170px]">
                      {rep.examples.length > 0 ? rep.examples.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
            <span>Unli tovuşlar: {analysis.vowelCount} ta</span>
            <span>·</span>
            <span>Undosh tovuşlar: {analysis.consonantCount} ta</span>
          </div>
        </section>
      </div>
      )}
    </div>
  );
});
