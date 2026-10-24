import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, Award } from 'lucide-react';
import { EXERCISE_QUESTIONS, ExerciseQuestion } from '../utils/uzbekDictionaryData';
import { normalizeToNewUzbekLatin } from '../utils/uzbekLinguistics';
import { speakUzbekText } from '../utils/speechUtils';

const QUICK_REFORM_CHARS = ['Ö', 'ö', 'Ğ', 'ğ', 'Ş', 'ş', 'Ç', 'ç', '’'];

export const ExercisesView: React.FC = () => {
  const [modeFilter, setModeFilter] = useState<'ALL' | ExerciseQuestion['mode']>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const questions =
    modeFilter === 'ALL'
      ? EXERCISE_QUESTIONS
      : EXERCISE_QUESTIONS.filter((q) => q.mode === modeFilter);

  const safeIndex = currentIndex < questions.length ? currentIndex : 0;
  const currentQ = questions[safeIndex];

  const handleModeChange = (newMode: 'ALL' | ExerciseQuestion['mode']) => {
    setModeFilter(newMode);
    setCurrentIndex(0);
    setSelectedOption('');
    setTypedAnswer('');
    setSubmitted(false);
  };

  const evaluateAnswer = (answerToEvaluate: string) => {
    if (!currentQ || submitted) return;
    const cleanUser = answerToEvaluate.trim();
    if (!cleanUser) return;

    const correct = cleanUser === currentQ.correctAnswer;
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      setScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);
      if (!completedIds.includes(currentQ.id)) {
        setCompletedIds((prev) => [...prev, currentQ.id]);
      }
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption('');
    setTypedAnswer('');
    setSubmitted(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleResetProgress = () => {
    setCurrentIndex(0);
    setSelectedOption('');
    setTypedAnswer('');
    setSubmitted(false);
    setScore(0);
    setStreak(0);
    setCompletedIds([]);
  };

  const modeLabelMap: Record<ExerciseQuestion['mode'], string> = {
    'multiple-choice': 'Harf almashtirish testi',
    typing: 'Yozma amaliyot (Klaviaturada)',
    'spot-error': 'Matndan xatoni topiş'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Interactive Stage (8 columns) */}
      <section
        aria-label="Interaktiv mashq oynasi"
        className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6"
      >
        {/* Top Mode Selector & Progress */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleModeChange('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                modeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barcha maşqlar ({EXERCISE_QUESTIONS.length})
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('multiple-choice')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                modeFilter === 'multiple-choice'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Test savollari
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('typing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                modeFilter === 'typing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yozma maşq
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('spot-error')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                modeFilter === 'spot-error'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xatoni topiş
            </button>
          </div>

          <div className="text-xs font-mono text-slate-500 tabular-nums">
            Savol {safeIndex + 1} / {questions.length} · Harf: {currentQ.targetLetter}
          </div>
        </div>

        {/* Question Prompt Card */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-teal-700">
            {modeLabelMap[currentQ.mode]}
          </div>

          <h2 className="text-xl font-bold text-slate-900 leading-snug">
            {currentQ.prompt}
          </h2>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">Manba matn / ibora:</div>
              <div className="text-lg font-mono font-semibold text-slate-900 mt-0.5">
                {currentQ.sourceText}
              </div>
            </div>
            <button
              type="button"
              onClick={() => speakUzbekText(normalizeToNewUzbekLatin(currentQ.sourceText))}
              aria-label="Mashq matnini ovozli eshitish"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Volume2 className="w-4 h-4 text-teal-700" />
              <span>Eşitiş</span>
            </button>
          </div>
        </div>

        {/* Interactive Input Area based on Mode */}
        {currentQ.options ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt;
              let btnStyle =
                'bg-white border-slate-200 text-slate-800 hover:border-teal-600 hover:bg-slate-50';
              if (submitted) {
                if (opt === currentQ.correctAnswer) {
                  btnStyle = 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold';
                } else if (isSelected && opt !== currentQ.correctAnswer) {
                  btnStyle = 'bg-red-50 border-red-500 text-red-900';
                }
              } else if (isSelected) {
                btnStyle = 'bg-teal-50 border-teal-700 text-teal-950 font-semibold';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    setSelectedOption(opt);
                    evaluateAnswer(opt);
                  }}
                  className={`p-4 text-left border rounded-xl font-mono text-sm transition-colors flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {submitted && opt === currentQ.correctAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {submitted && isSelected && opt !== currentQ.correctAnswer && (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Maxsus harflar:</span>
              {QUICK_REFORM_CHARS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  disabled={submitted}
                  onClick={() => setTypedAnswer((prev) => prev + ch)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded-md transition-colors"
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="exercise-typing-input" className="sr-only">
                Yangi 2026 alifbosida javobni yozing
              </label>
              <input
                id="exercise-typing-input"
                type="text"
                disabled={submitted}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && typedAnswer.trim()) {
                    evaluateAnswer(typedAnswer);
                  }
                }}
                placeholder="Javobni yangi 2026 alifboda (Ö, Ğ, Ş, Ç) yozing..."
                className="flex-1 px-4 py-3 text-base font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
              />
              {!submitted && (
                <button
                  type="button"
                  onClick={() => evaluateAnswer(typedAnswer)}
                  disabled={!typedAnswer.trim()}
                  className="px-6 py-3 text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Tekşiriş
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feedback Box */}
        {submitted && (
          <div
            data-testid="exercise-feedback-banner"
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isCorrect
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-red-50/90 border-red-200 text-red-950'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>✓ Töğri javob! (+10 ball)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-700 shrink-0" />
                    <span>✗ Xato. Töğri shakl: {currentQ.correctAnswer}</span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{currentQ.explanation}</p>
            </div>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              <span>Keyingi maşq</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Right Control & Scoreboard Deck (4 columns) */}
      <aside
        aria-label="O'zlashtirish ko'rsatkichlari"
        className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Örganiş natijalari</h3>
            <p className="text-xs text-slate-500">Maşqlar davomida töplangan ballar</p>
          </div>
          <Award className="w-5 h-5 text-teal-700" />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500">Jami ball</div>
            <div
              className="text-xl font-bold text-teal-700 font-mono tabular-nums mt-0.5"
              data-testid="exercise-score-value"
            >
              {score}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500">Ketma-ket</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {streak}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500">Yechilgan</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {completedIds.length}/{EXERCISE_QUESTIONS.length}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">
            Tezkor eslatma (2026 Alifbo jadvali):
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono">
            <div>O‘ o‘ (Ў ў) → Ö ö (Özbekiston, öqituvçi)</div>
            <div>G‘ g‘ (Ғ ғ) → Ğ ğ (Ğalaba, töğri, boğ)</div>
            <div>Sh sh (Ш ш) → Ş ş (Şahar, qöşiq, peşlavha)</div>
            <div>Ch ch (Ч ч) → Ç ç (Çiroyli, köça, çöqqi)</div>
            <div>Ъ / Tutuq → ’ (ma’no, ta’lim, san’at)</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetProgress}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Natijalarni boshidan boshlaş</span>
        </button>
      </aside>
    </div>
  );
};
