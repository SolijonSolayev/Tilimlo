import React, { useState } from 'react';
import { Volume2, FileText, ExternalLink } from 'lucide-react';
import { ALPHABET_2026_CHART, AlphabetLetterInfo } from '../utils/uzbekDictionaryData';
import { speakUzbekText } from '../utils/speechUtils';

export const AlphabetGuideView: React.FC = () => {
  const [selectedLetter, setSelectedLetter] = useState<AlphabetLetterInfo>(
    ALPHABET_2026_CHART.find((l) => l.upper === 'Ö') || ALPHABET_2026_CHART[24]
  );
  const [onlyReformed, setOnlyReformed] = useState<boolean>(false);

  const displayedLetters = onlyReformed
    ? ALPHABET_2026_CHART.filter((l) => l.isReformed)
    : ALPHABET_2026_CHART;

  return (
    <div className="space-y-8">
      {/* Summary Header & Core 4+1 Reform Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              2026-yilgi Yangilangan Özbek Lotin Alifbosi Qöllanmasi (28 harf + 1 tutuq belgisi)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              2026-yil oktabr oyida tasdiqlangan yangi özbek lotin alifbosida 4 ta harf yagona
              diakritik shaklga keltirildi va &ldquo;ng&rdquo; harflar birikmasi alifbo jadvalidan
              chiqarildi.
            </p>
          </div>

          <a
            href="/assets/aistudio/AI_New_Uzbek_Alphabet_Guide_5b08b494.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start"
          >
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            <span>Asl me’yoriy qöllanmani köriş (.md)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Core Reform Mapping Table from Guide Section 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Lotin (Eski)</th>
                  <th className="py-3 px-4">Lotin (Yangi 2026)</th>
                  <th className="py-3 px-4">Kirill muqobili</th>
                  <th className="py-3 px-4">Harf nomi</th>
                  <th className="py-3 px-4">Misol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">O‘ o‘</td>
                  <td className="py-3 px-4 font-bold text-teal-800 text-base">Ö ö</td>
                  <td className="py-3 px-4 text-slate-700">Ў ў</td>
                  <td className="py-3 px-4 text-slate-700">ö</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">
                    O‘zbekiston → <strong className="text-slate-900">Özbekiston</strong>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">G‘ g‘</td>
                  <td className="py-3 px-4 font-bold text-teal-800 text-base">Ğ ğ</td>
                  <td className="py-3 px-4 text-slate-700">Ғ ғ</td>
                  <td className="py-3 px-4 text-slate-700">ğé</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">
                    to‘g‘ri → <strong className="text-slate-900">töğri</strong>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">Sh sh</td>
                  <td className="py-3 px-4 font-bold text-teal-800 text-base">Ş ş</td>
                  <td className="py-3 px-4 text-slate-700">Ш ш</td>
                  <td className="py-3 px-4 text-slate-700">şa</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">
                    qo‘shiq → <strong className="text-slate-900">qöşiq</strong>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">Ch ch</td>
                  <td className="py-3 px-4 font-bold text-teal-800 text-base">Ç ç</td>
                  <td className="py-3 px-4 text-slate-700">Ч ч</td>
                  <td className="py-3 px-4 text-slate-700">ça</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700">
                    ko‘cha → <strong className="text-slate-900">köça</strong>
                  </td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500">ng</td>
                  <td className="py-3 px-4 text-slate-700">ng (jadvaldan olingan)</td>
                  <td className="py-3 px-4 text-slate-700">нг</td>
                  <td className="py-3 px-4 text-slate-600">n-ge (digraf)</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-600">
                    Yozuvda saqlanadi: <strong className="text-slate-900">yangi, tong</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cyrillic to New Latin Nuances Box */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Kirill yozuvidan Yangi 2026 Lotinga ögirish qoidalari:
            </h3>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                <strong className="font-mono text-slate-900">Е е:</strong> Söz boshida, unlidan va
                ъ/ь dan keyin → <strong className="font-mono text-teal-800">Ye / ye</strong>{' '}
                (Yelkan, tayyor). Undoshdan keyin → <strong className="font-mono">E / e</strong>{' '}
                (beş).
              </li>
              <li>
                <strong className="font-mono text-slate-900">Ц ц:</strong> Ikki unli orasida →{' '}
                <strong className="font-mono text-teal-800">Ts / ts</strong> (Federatsiya). Söz
                boshida yoki undoshdan keyin → <strong className="font-mono">S / s</strong> (Sirk,
                konsert).
              </li>
              <li>
                <strong className="font-mono text-slate-900">Ё ё, Ю ю, Я я, Э э:</strong> Mos
                ravishda <strong className="font-mono text-teal-800">Yo, Yu, Ya, E</strong> (Yod,
                Yulduz, Yaxşi, Eşik).
              </li>
              <li>
                <strong className="font-mono text-slate-900">Ъ (ayriş belgisi):</strong> Tutuq
                belgisi <strong className="font-mono text-teal-800">’ (U+2019)</strong> sifatida
                saqlanadi (Ma’no, ta’lim, s’yezd).
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive 28-Letter Grid + Selected Letter Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">
              28 ta harfdan iborat interaktiv alifbo jadvali (Harf ustiga bosing)
            </h3>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyReformed}
                onChange={(e) => setOnlyReformed(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <span>Faqat yangilangan 4 ta harfni (Ö, Ğ, Ş, Ç) körsatiş</span>
            </label>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {displayedLetters.map((item) => {
              const isSelected = selectedLetter.number === item.number;
              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => {
                    setSelectedLetter(item);
                    speakUzbekText(`${item.name}. ${item.exampleNew}`);
                  }}
                  className={`p-3 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : item.isReformed
                        ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] font-mono opacity-60 tabular-nums">
                    #{item.number}
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {item.upper} {item.lower}
                  </span>
                  <span className="text-[11px] opacity-75">{item.cyrillic}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Letter Detail Card */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                2026 Alifbo · {selectedLetter.number}-harf
              </div>
              <div className="text-3xl font-bold font-mono text-teal-800 mt-1">
                {selectedLetter.upper} {selectedLetter.lower}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                speakUzbekText(`${selectedLetter.name}. ${selectedLetter.exampleNew}`)
              }
              aria-label={`${selectedLetter.upper} harfini ovozli eshitish`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Talaffuz</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Eski Lotin</div>
              <div className="font-bold text-slate-900 mt-0.5">{selectedLetter.oldLatin}</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Kirill</div>
              <div className="font-bold text-slate-900 mt-0.5">{selectedLetter.cyrillic}</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Fonetika</div>
              <div className="font-bold text-slate-900 mt-0.5">{selectedLetter.ipa}</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-800">Misol qiyosi:</div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono flex items-center justify-between">
              <span className="text-slate-500">Eski: {selectedLetter.exampleOld}</span>
              <span>→</span>
              <span className="font-bold text-teal-800">Yangi: {selectedLetter.exampleNew}</span>
            </div>
            {selectedLetter.note && (
              <p className="text-slate-600 leading-relaxed pt-1">{selectedLetter.note}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
