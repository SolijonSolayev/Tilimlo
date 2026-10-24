/**
 * Core Linguistic Engine for the 2026 Reformed Uzbek Latin Alphabet
 * Implements strict rules from the October 2026 New Uzbek Latin Alphabet Guide:
 * - Oʻ oʻ -> Ö ö (Cyrillic: Ў ў)
 * - Gʻ gʻ -> Ğ ğ (Cyrillic: Ғ ғ)
 * - Sh sh -> Ş ş (Cyrillic: Ш ш)
 * - Ch ch -> Ç ç (Cyrillic: Ч ч)
 * - Tutuq belgisi (’ U+2019) preserved for glottal stops (ma’no, ta’lim, e’lon, san’at)
 * - Cyrillic nuances: Е/е (Ye/E), Ё/ё (Yo), Ц/ц (Ts/S), Ю/ю (Yu), Я/я (Ya), Э/э (E), Ъ (’)
 * - Stem- + Suffix-aware morphological recognition for ALL Uzbek words (including informal o/g input like "sozlarni" -> "sözlarni")
 */

import {
  INFORMAL_TO_2026_STEMS,
  UZBEK_ROOT_LEXICON,
  WordMorphologyAnalysis,
  decomposeUzbekWord
} from './uzbekMorphology';

export type ScriptMode = 'auto' | 'old-latin' | 'cyrillic' | 'new-latin-2026';
export type TargetScript = 'new-latin-2026' | 'cyrillic' | 'old-latin';

export interface ReplacementStat {
  symbol: 'Ö / ö' | 'Ğ / ğ' | 'Ş / ş' | 'Ç / ç' | '’ (tutuq)';
  oldEquivalent: string;
  count: number;
  examples: string[];
}

export interface DiffSegment {
  text: string;
  changed: boolean;
  original?: string;
  rule?: string;
}

export interface OrthographyIssue {
  id: string;
  originalWord: string;
  suggestedWord: string;
  category: 'harf-islohoti' | 'tutuq-belgisi' | 'x-h-imlo' | 'kirill-qoldiq';
  categoryLabel: string;
  explanation: string;
  index: number;
}

export interface TextAnalysisResult {
  originalText: string;
  convertedText: string;
  detectedScript: 'old-latin' | 'cyrillic' | 'new-latin-2026' | 'mixed';
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  syllableCount: number;
  reformedWordCount: number;
  reformImpactPercent: number;
  replacements: ReplacementStat[];
  totalReplacements: number;
  vowelCount: number;
  consonantCount: number;
  diffWords: DiffSegment[];
  issues: OrthographyIssue[];
}

const CYRILLIC_VOWELS = new Set([
  'а', 'е', 'ё', 'и', 'о', 'у', 'ў', 'э', 'ю', 'я',
  'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ў', 'Э', 'Ю', 'Я'
]);

const UZBEK_VOWELS = new Set([
  'a', 'e', 'i', 'o', 'u', 'ö',
  'A', 'E', 'I', 'O', 'U', 'Ö'
]);

// Words with x/h or common spelling confusions in Uzbek (mapped in New 2026 Latin)
const COMMON_SPELLING_CORRECTIONS: Record<string, { correct: string; reason: string }> = {
  haridor: { correct: 'xaridor', reason: '"Xaridor" sözi chuqur til orqa "x" undoshi bilan yoziladi.' },
  xokim: { correct: 'hokim', reason: '"Hokim" sözi böğiz "h" undoshi bilan yoziladi.' },
  xokimiyat: { correct: 'hokimiyat', reason: '"Hokimiyat" sözi böğiz "h" undoshi bilan yoziladi.' },
  hamrox: { correct: 'hamroh', reason: '"Hamroh" sözining oxirida yumshoq "h" harfi yoziladi.' },
  xozir: { correct: 'hozir', reason: '"Hozir" sözi "h" harfi bilan yoziladi.' },
  xozirgi: { correct: 'hozirgi', reason: '"Hozirgi" sözi "h" harfi bilan yoziladi.' },
  xech: { correct: 'heç', reason: '"Heç" sözi "h" va yangi "ç" harfi bilan yoziladi.' },
  xeç: { correct: 'heç', reason: '"Heç" sözi "h" harfi bilan yoziladi.' },
  xamma: { correct: 'hamma', reason: '"Hamma" sözi yumshoq "h" undoshi bilan yoziladi.' },
  xar: { correct: 'har', reason: '"Har" (har bir) sözi "h" harfi bilan yoziladi.' },
  xayot: { correct: 'hayot', reason: '"Hayot" sözi "h" undoshi bilan yoziladi.' },
  xarakat: { correct: 'harakat', reason: '"Harakat" sözi "h" undoshi bilan yoziladi.' },
  xурмат: { correct: 'hurmat', reason: '"Hurmat" sözi "h" undoshi bilan yoziladi.' },
  xurmat: { correct: 'hurmat', reason: '"Hurmat" sözi "h" undoshi bilan yoziladi.' },
  xurmatli: { correct: 'hurmatli', reason: '"Hurmatli" sözi "h" undoshi bilan yoziladi.' },
  muxabbat: { correct: 'muhabbat', reason: '"Muhabbat" sözi "h" undoshi bilan yoziladi.' },
  mexr: { correct: 'mehr', reason: '"Mehr" sözi "h" undoshi bilan yoziladi.' },
  mexnat: { correct: 'mehnat', reason: '"Mehnat" sözi "h" undoshi bilan yoziladi.' },
  baxor: { correct: 'bahor', reason: '"Bahor" sözi "h" undoshi bilan yoziladi.' },
  shaxar: { correct: 'şahar', reason: '"Şahar" sözi yangi "ş" va yumshoq "h" bilan yoziladi.' },
  şaxar: { correct: 'şahar', reason: '"Şahar" sözi yumshoq "h" undoshi bilan yoziladi.' },
  axamiyat: { correct: 'ahamiyat', reason: '"Ahamiyat" sözi "h" undoshi bilan yoziladi.' },
  halq: { correct: 'xalq', reason: '"Xalq" sözi "x" undoshi bilan yoziladi.' },
  halqaro: { correct: 'xalqaro', reason: '"Xalqaro" sözi "x" undoshi bilan yoziladi.' },
  habar: { correct: 'xabar', reason: '"Xabar" sözi "x" undoshi bilan yoziladi.' },
  hato: { correct: 'xato', reason: '"Xato" sözi "x" undoshi bilan yoziladi.' },
  hursand: { correct: 'xursand', reason: '"Xursand" sözi "x" undoshi bilan yoziladi.' },
  hizmat: { correct: 'xizmat', reason: '"Xizmat" sözi "x" undoshi bilan yoziladi.' },
  baht: { correct: 'baxt', reason: '"Baxt" sözi "x" undoshi bilan yoziladi.' },
  daraht: { correct: 'daraxt', reason: '"Daraxt" sözi "x" undoshi bilan yoziladi.' },
  hususiy: { correct: 'xususiy', reason: '"Xususiy" sözi "x" undoshi bilan yoziladi.' },
  hamkorlik: { correct: 'hamkorlik', reason: 'Töğri.' },
  xamkor: { correct: 'hamkor', reason: '"Hamkor" sözi yumshoq "h" undoshi bilan yoziladi.' },
  xamda: { correct: 'hamda', reason: '"Hamda" sözi yumshoq "h" undoshi bilan yoziladi.' },
  xali: { correct: 'hali', reason: '"Hali" sözi yumshoq "h" undoshi bilan yoziladi.' }
};

// Words that require tutuq belgisi (’) when written without it
const TUTUQ_BELGISI_WORDS: Record<string, string> = {
  mano: 'ma’no',
  manoli: 'ma’noli',
  manosiz: 'ma’nosiz',
  manaviy: 'ma’naviy',
  manaviyat: 'ma’naviyat',
  malum: 'ma’lum',
  malumot: 'ma’lumot',
  masul: 'mas’ul',
  masuliyat: 'mas’uliyat',
  talim: 'ta’lim',
  talimot: 'ta’limot',
  tarif: 'ta’rif',
  tasir: 'ta’sir',
  taminot: 'ta’minot',
  tamir: 'ta’mir',
  taqib: 'ta’qib',
  tazim: 'ta’zim',
  tasis: 'ta’sis',
  taqdir: 'taqdir',
  elon: 'e’lon',
  etibor: 'e’tibor',
  etiqod: 'e’tiqod',
  etirof: 'e’tirof',
  etiroz: 'e’tiroz',
  memor: 'me’mor',
  memoriy: 'me’moriy',
  meyor: 'me’yor',
  meyoriy: 'me’yoriy',
  sanat: 'san’at',
  sanatkor: 'san’atkor',
  jurat: 'jur’at',
  surat: 'sur’at',
  qala: 'qal’a',
  nemat: 'ne’mat',
  mojiza: 'mö’jiza',
  motabar: 'mö’tabar',
  motadil: 'mö’tadil',
  shula: 'şu’la',
  şula: 'şu’la',
  davo: 'da’vo',
  alo: 'a’lo',
  azo: 'a’zo',
  inikos: 'in’ikos',
  syezd: 's’yezd'
};

/**
 * Detects whether a given text is predominantly Cyrillic, Old Uzbek Latin, New 2026 Latin, or Mixed.
 */
export function detectScript(text: string): 'old-latin' | 'cyrillic' | 'new-latin-2026' | 'mixed' {
  if (!text || !text.trim()) return 'old-latin';

  const cyrillicMatches = text.match(/[А-Яа-яЁёЎўҚқҒғҲҳ]/g) || [];
  const newLatinMatches = text.match(/[ÖöĞğŞşÇç]/g) || [];
  const oldLatinDigraphMatches = text.match(/(?:[OoGg][’'‘`ʻʼ]|[Ss][Hh]|[Cc][Hh])/g) || [];

  if (cyrillicMatches.length > 0 && (newLatinMatches.length > 0 || oldLatinDigraphMatches.length > 0)) {
    return 'mixed';
  }
  if (cyrillicMatches.length > 0) {
    return 'cyrillic';
  }
  if (newLatinMatches.length > 0 && oldLatinDigraphMatches.length === 0) {
    return 'new-latin-2026';
  }
  return 'old-latin';
}

function isUpperCaseContext(word: string, index: number): boolean {
  const letters = word.replace(/[^A-Za-zА-Яа-яЁёЎўҚқҒғҲҳÖöĞğŞşÇç]/g, '');
  if (letters.length > 1 && letters === letters.toUpperCase()) {
    return true;
  }
  const nextChar = word[index + 1];
  if (nextChar && nextChar !== nextChar.toLowerCase() && nextChar === nextChar.toUpperCase()) {
    return true;
  }
  return false;
}

/**
 * Converts Cyrillic Uzbek text directly into the New 2026 Uzbek Latin standard.
 */
export function cyrillicToNewUzbekLatin(text: string): string {
  const basicMap: Record<string, string> = {
    'А': 'A', 'а': 'a',
    'Б': 'B', 'б': 'b',
    'В': 'V', 'в': 'v',
    'Г': 'G', 'г': 'g',
    'Д': 'D', 'д': 'd',
    'Ж': 'J', 'ж': 'j',
    'З': 'Z', 'з': 'z',
    'И': 'I', 'и': 'i',
    'Й': 'Y', 'й': 'y',
    'К': 'K', 'к': 'k',
    'Л': 'L', 'л': 'l',
    'М': 'M', 'м': 'm',
    'Н': 'N', 'н': 'n',
    'О': 'O', 'о': 'o',
    'П': 'P', 'п': 'p',
    'Р': 'R', 'р': 'r',
    'С': 'S', 'с': 's',
    'Т': 'T', 'т': 't',
    'У': 'U', 'у': 'u',
    'Ф': 'F', 'ф': 'f',
    'Х': 'X', 'х': 'x',
    'Ч': 'Ç', 'ч': 'ç',
    'Ш': 'Ş', 'ш': 'ş',
    'Щ': 'Ş', 'щ': 'ş',
    'Ы': 'I', 'ы': 'i',
    'Э': 'E', 'э': 'e',
    'Ў': 'Ö', 'ў': 'ö',
    'Қ': 'Q', 'қ': 'q',
    'Ғ': 'Ğ', 'ғ': 'ğ',
    'Ҳ': 'H', 'ҳ': 'h'
  };

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    const next = i < len - 1 ? text[i + 1] : '';
    const isStartOfWord = i === 0 || !/[А-Яа-яЁёЎўҚқҒғҲҳA-Za-z]/.test(prev);
    const prevIsVowelOrSign =
      CYRILLIC_VOWELS.has(prev) || prev === 'ъ' || prev === 'Ъ' || prev === 'ь' || prev === 'Ь';
    const nextIsVowel = CYRILLIC_VOWELS.has(next);

    if (ch === 'Е' || ch === 'е') {
      if (isStartOfWord || prevIsVowelOrSign) {
        if (ch === 'Е') {
          result += isUpperCaseContext(text, i) ? 'YE' : 'Ye';
        } else {
          result += 'ye';
        }
      } else {
        result += ch === 'Е' ? 'E' : 'e';
      }
      continue;
    }

    if (ch === 'Ё' || ch === 'ё') {
      if (ch === 'Ё') {
        result += isUpperCaseContext(text, i) ? 'YO' : 'Yo';
      } else {
        result += 'yo';
      }
      continue;
    }

    if (ch === 'Ю' || ch === 'ю') {
      if (ch === 'Ю') {
        result += isUpperCaseContext(text, i) ? 'YU' : 'Yu';
      } else {
        result += 'yu';
      }
      continue;
    }

    if (ch === 'Я' || ch === 'я') {
      if (ch === 'Я') {
        result += isUpperCaseContext(text, i) ? 'YA' : 'Ya';
      } else {
        result += 'ya';
      }
      continue;
    }

    if (ch === 'Ц' || ch === 'ц') {
      if (!isStartOfWord && CYRILLIC_VOWELS.has(prev) && nextIsVowel) {
        if (ch === 'Ц') {
          result += isUpperCaseContext(text, i) ? 'TS' : 'Ts';
        } else {
          result += 'ts';
        }
      } else {
        result += ch === 'Ц' ? 'S' : 's';
      }
      continue;
    }

    if (ch === 'Ъ' || ch === 'ъ') {
      result += '’';
      continue;
    }

    if (ch === 'Ь' || ch === 'ь') {
      if (next === 'о' || next === 'О') {
        result += 'y';
      }
      continue;
    }

    if (basicMap[ch] !== undefined) {
      result += basicMap[ch];
    } else {
      result += ch;
    }
  }

  return result;
}

export function preserveCase(source: string, targetLower: string): string {
  if (!source) return targetLower;
  if (source === source.toUpperCase() && source.length > 1) {
    return targetLower.toUpperCase();
  }
  if (source[0] === source[0].toUpperCase()) {
    return targetLower.charAt(0).toUpperCase() + targetLower.slice(1);
  }
  return targetLower;
}

/**
 * Restores informal / apostrophe-less Uzbek stems (e.g. "sozlarni" -> "sözlarni", "ozbek" -> "özbek", "kop" -> "köp")
 * while preserving suffixes and capitalization.
 */
export function restoreInformalUzbekToken(token: string): string {
  if (!token || !/[A-Za-zÖöĞğŞşÇç]/.test(token)) return token;
  const decomp = decomposeUzbekWord(token);
  if (decomp.wasInformalStemRestored) {
    const suffixChain = decomp.suffixes.map((s) => s.suffix).join('');
    const rebuiltLower = decomp.reformedStem + suffixChain;
    return preserveCase(token, rebuiltLower);
  }
  return token;
}

/**
 * Normalizes Old Uzbek Latin, Cyrillic, and informal apostrophe-less Uzbek into the New 2026 Uzbek Latin Alphabet.
 * Strictly follows Section 2 & 3 of the 2026 Alphabet Guide while preserving tutuq belgisi (’) and restoring stems.
 */
export function normalizeToNewUzbekLatin(input: string): string {
  if (!input) return '';

  // Step 1: Convert any Cyrillic characters first
  let text = cyrillicToNewUzbekLatin(input);

  // Step 2: Standardize older apostrophe/diacritic variations for O' and G'
  text = text.replace(/O[’'‘`ʻʼʾ]/g, 'Ö');
  text = text.replace(/o[’'‘`ʻʼʾ]/g, 'ö');
  text = text.replace(/G[’'‘`ʻʼʾ]/g, 'Ğ');
  text = text.replace(/g[’'‘`ʻʼʾ]/g, 'ğ');

  // Step 3: Convert digraphs Sh / SH / sh -> Ş / ş and Ch / CH / ch -> Ç / ç
  text = text.replace(/SH/g, 'Ş');
  text = text.replace(/Sh/g, 'Ş');
  text = text.replace(/sh/g, 'ş');

  text = text.replace(/CH/g, 'Ç');
  text = text.replace(/Ch/g, 'Ç');
  text = text.replace(/ch/g, 'ç');

  // Step 4: Preserve & normalize remaining apostrophes (tutuq belgisi) inside words to U+2019 (’)
  text = text.replace(/([A-Za-zÖöĞğŞşÇç])['‘`ʻʼ]([A-Za-zÖöĞğŞşÇç])/g, '$1’$2');

  // Step 5: Stem- + Suffix-aware restoration for informal apostrophe-less Uzbek words (e.g., "sozlarni" -> "sözlarni")
  text = text.replace(/[A-Za-zÖöĞğŞşÇç’]+/g, (wordToken) => restoreInformalUzbekToken(wordToken));

  return text;
}

/**
 * Converts text from New 2026 Uzbek Latin to Old Latin (1995 standard) or Cyrillic.
 */
export function convertFromNewUzbekLatin(input: string, target: TargetScript): string {
  if (!input) return '';
  if (target === 'new-latin-2026') {
    return normalizeToNewUzbekLatin(input);
  }

  const canonical = normalizeToNewUzbekLatin(input);

  if (target === 'old-latin') {
    return canonical
      .replace(/Ö/g, 'O‘')
      .replace(/ö/g, 'o‘')
      .replace(/Ğ/g, 'G‘')
      .replace(/ğ/g, 'g‘')
      .replace(/Ş/g, 'Sh')
      .replace(/ş/g, 'sh')
      .replace(/Ç/g, 'Ch')
      .replace(/ç/g, 'ch');
  }

  let cyr = canonical;
  cyr = cyr.replace(/YE/g, 'Е').replace(/Ye/g, 'Е').replace(/ye/g, 'е');
  cyr = cyr.replace(/YO/g, 'Ё').replace(/Yo/g, 'Ё').replace(/yo/g, 'ё');
  cyr = cyr.replace(/YU/g, 'Ю').replace(/Yu/g, 'Ю').replace(/yu/g, 'ю');
  cyr = cyr.replace(/YA/g, 'Я').replace(/Ya/g, 'Я').replace(/ya/g, 'я');
  cyr = cyr.replace(/TS/g, 'Ц').replace(/Ts/g, 'Ц').replace(/ts/g, 'ц');

  cyr = cyr.replace(/(^|[^A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’])E/g, '$1Э');
  cyr = cyr.replace(/(^|[^A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’])e/g, '$1э');

  const toCyrMap: Record<string, string> = {
    'A': 'А', 'a': 'а',
    'B': 'Б', 'b': 'б',
    'D': 'Д', 'd': 'д',
    'E': 'Е', 'e': 'е',
    'F': 'Ф', 'f': 'ф',
    'G': 'Г', 'g': 'г',
    'Ğ': 'Ғ', 'ğ': 'ғ',
    'H': 'Ҳ', 'h': 'ҳ',
    'I': 'И', 'i': 'и',
    'J': 'Ж', 'j': 'ж',
    'K': 'К', 'k': 'к',
    'L': 'Л', 'l': 'л',
    'M': 'М', 'm': 'м',
    'N': 'Н', 'n': 'н',
    'O': 'О', 'o': 'о',
    'Ö': 'Ў', 'ö': 'ў',
    'P': 'П', 'p': 'п',
    'Q': 'Қ', 'q': 'қ',
    'R': 'Р', 'r': 'р',
    'S': 'С', 's': 'с',
    'Ş': 'Ш', 'ş': 'ш',
    'T': 'Т', 't': 'т',
    'U': 'У', 'u': 'у',
    'V': 'В', 'v': 'в',
    'X': 'Х', 'x': 'х',
    'Y': 'Й', 'y': 'й',
    'Z': 'З', 'z': 'з',
    'Ç': 'Ч', 'ç': 'ч',
    '’': 'ъ'
  };

  return cyr
    .split('')
    .map((ch) => (toCyrMap[ch] !== undefined ? toCyrMap[ch] : ch))
    .join('');
}

/**
 * Counts Uzbek syllables by counting vowel nuclei (a, e, i, o, u, ö).
 */
export function countUzbekSyllables(text: string): number {
  const normalized = normalizeToNewUzbekLatin(text);
  let count = 0;
  for (const ch of normalized) {
    if (UZBEK_VOWELS.has(ch)) {
      count++;
    }
  }
  return count;
}

/**
 * Splits an Uzbek word (in New 2026 Latin) into syllables for dictionary display.
 */
export function syllabifyUzbekWord(word: string): string {
  const clean = normalizeToNewUzbekLatin(word.trim());
  if (clean.length <= 3) return clean;

  const chars = Array.from(clean);
  const vowelIndices: number[] = [];
  chars.forEach((ch, idx) => {
    if (UZBEK_VOWELS.has(ch)) {
      vowelIndices.push(idx);
    }
  });

  if (vowelIndices.length <= 1) return clean;

  const breakAfter = new Set<number>();
  for (let k = 0; k < vowelIndices.length - 1; k++) {
    const v1 = vowelIndices[k];
    const v2 = vowelIndices[k + 1];
    const distance = v2 - v1 - 1;
    if (distance <= 1) {
      breakAfter.add(v1);
    } else {
      breakAfter.add(v1 + 1);
    }
  }

  let out = '';
  for (let i = 0; i < chars.length; i++) {
    out += chars[i];
    if (breakAfter.has(i) && i < chars.length - 1) {
      out += '-';
    }
  }
  return out;
}

/**
 * Stem- and suffix-aware orthography & 2026 alphabet checker.
 * Recognizes root + suffix combinations across the Uzbek language.
 */
export function checkUzbekTextErrors(text: string): OrthographyIssue[] {
  if (!text || !text.trim()) return [];

  const issues: OrthographyIssue[] = [];
  const tokenRegex = /[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳÖöĞğŞşÇç’'‘`ʻʼʾ]+/g;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    const token = match[0];
    const idx = match.index;
    const hasCyrillic = /[А-Яа-яЁёЎўҚқҒғҲҳ]/.test(token);
    const hasOldLatin = /(?:[OoGg][’'‘`ʻʼʾ]|[Ss][Hh]|[Cc][Hh])/.test(token);

    // Basic character-level conversion without stem restoration first
    const basicConverted = cyrillicToNewUzbekLatin(token)
      .replace(/O[’'‘`ʻʼʾ]/g, 'Ö')
      .replace(/o[’'‘`ʻʼʾ]/g, 'ö')
      .replace(/G[’'‘`ʻʼʾ]/g, 'Ğ')
      .replace(/g[’'‘`ʻʼʾ]/g, 'ğ')
      .replace(/SH/g, 'Ş')
      .replace(/Sh/g, 'Ş')
      .replace(/sh/g, 'ş')
      .replace(/CH/g, 'Ç')
      .replace(/Ch/g, 'Ç')
      .replace(/ch/g, 'ç')
      .replace(/([A-Za-zÖöĞğŞşÇç])['‘`ʻʼ]([A-Za-zÖöĞğŞşÇç])/g, '$1’$2');

    const lowerBasic = basicConverted.toLowerCase();
    const lowerNoSign = lowerBasic.replace(/’/g, '');
    const decomp = decomposeUzbekWord(basicConverted);
    const suffixChain = decomp.suffixes.map((s) => s.suffix).join('');
    const stemNoSign = decomp.stem.replace(/’/g, '');

    // Check 1: Direct or Stem-based X/H or spelling mistake (e.g. "haridorlarning" -> "xaridorlarning")
    const xhDirect = COMMON_SPELLING_CORRECTIONS[lowerBasic];
    const xhStem = COMMON_SPELLING_CORRECTIONS[decomp.stem];
    if (xhDirect && xhDirect.correct !== lowerBasic) {
      const suggested = preserveCase(token, xhDirect.correct);
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: suggested,
        category: 'x-h-imlo',
        categoryLabel: 'Imlo xatosi (X/H)',
        explanation: xhDirect.reason,
        index: idx
      });
      continue;
    } else if (xhStem && xhStem.correct !== decomp.stem) {
      const suggested = preserveCase(token, xhStem.correct + suffixChain);
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: suggested,
        category: 'x-h-imlo',
        categoryLabel: 'Imlo xatosi (X/H)',
        explanation: xhStem.reason,
        index: idx
      });
      continue;
    }

    // Check 2: Direct or Stem-based missing tutuq belgisi (’) (e.g. "malumotlarni" -> "ma’lumotlarni")
    const tutuqDirect = TUTUQ_BELGISI_WORDS[lowerNoSign];
    const tutuqStem = TUTUQ_BELGISI_WORDS[stemNoSign];
    if (tutuqDirect && lowerBasic !== tutuqDirect) {
      const suggested = preserveCase(token, tutuqDirect);
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: suggested,
        category: 'tutuq-belgisi',
        categoryLabel: 'Tutuq belgisi (’)',
        explanation: `"${suggested}" sözida unlidan keyin tutuq belgisi (’ U+2019) qöyilishi shart.`,
        index: idx
      });
      continue;
    } else if (tutuqStem && decomp.stem !== tutuqStem) {
      const suggested = preserveCase(token, tutuqStem + suffixChain);
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: suggested,
        category: 'tutuq-belgisi',
        categoryLabel: 'Tutuq belgisi (’)',
        explanation: `"${suggested}" sözining "${tutuqStem}" özagida tutuq belgisi (’ U+2019) qöyilishi shart.`,
        index: idx
      });
      continue;
    }

    // Check 3: Wrong apostrophe symbol used for tutuq belgisi
    if (/[A-Za-zÖöĞğŞşÇç]['‘`ʻʼ][A-Za-zÖöĞğŞşÇç]/.test(token) && !hasOldLatin) {
      const fullyReformed = normalizeToNewUzbekLatin(token);
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: fullyReformed,
        category: 'tutuq-belgisi',
        categoryLabel: 'Tipografik tutuq belgisi',
        explanation: `Oddiy apostrof (') yoki backtick (\`) örniga standart tutuq belgisi (’ U+2019) ishlatilishi lozim.`,
        index: idx
      });
      continue;
    }

    // Check 4: Informal apostrophe-less stem (e.g. "sozlarni" -> "sözlarni", "kop" -> "köp") or legacy 1995 Latin
    const fullyReformed = normalizeToNewUzbekLatin(token);
    if ((hasOldLatin || decomp.wasInformalStemRestored) && fullyReformed !== token && !hasCyrillic) {
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: fullyReformed,
        category: 'harf-islohoti',
        categoryLabel: '2026 Alifbo me’yori',
        explanation: decomp.wasInformalStemRestored
          ? `"${token}" sözining özagi "${decomp.reformedStem}" bölib, 2026-yilgi yangilangan alifboda "${fullyReformed}" shaklida yoziladi.`
          : `Eski yozuvdagi "${token}" sözi 2026-yilgi yangilangan alifboda "${fullyReformed}" shaklida yoziladi (Ö, Ğ, Ş, Ç).`,
        index: idx
      });
      continue;
    }

    // Check 5: Cyrillic word in text
    if (hasCyrillic && fullyReformed !== token) {
      issues.push({
        id: `issue-${++counter}-${idx}`,
        originalWord: token,
        suggestedWord: fullyReformed,
        category: 'kirill-qoldiq',
        categoryLabel: 'Kirill yozuvi',
        explanation: `Kirill yozuvidagi "${token}" sözi yangi özbek lotin alifbosida "${fullyReformed}" deb yoziladi.`,
        index: idx
      });
    }
  }

  return issues;
}

/**
 * Applies all orthographic fixes to the given text and normalizes it to 2026 New Uzbek Latin.
 */
export function applyAllOrthographyFixes(text: string): string {
  if (!text) return '';
  const issues = checkUzbekTextErrors(text);
  if (issues.length === 0) return normalizeToNewUzbekLatin(text);

  const sorted = [...issues].sort((a, b) => b.index - a.index);
  let updated = text;
  for (const issue of sorted) {
    const before = updated.slice(0, issue.index);
    const after = updated.slice(issue.index + issue.originalWord.length);
    updated = before + issue.suggestedWord + after;
  }
  return normalizeToNewUzbekLatin(updated);
}

/**
 * Analyzes ANY single Uzbek word (in Old Latin, Cyrillic, New 2026 Latin, or informal spelling)
 * and produces a complete 3-script + morphological breakdown.
 */
export function analyzeSingleUzbekWord(rawWord: string): WordMorphologyAnalysis {
  const trimmed = rawWord.trim();
  const issues = checkUzbekTextErrors(trimmed);
  const correctedNewLatin =
    issues.length > 0 ? issues[0].suggestedWord : normalizeToNewUzbekLatin(trimmed);
  const decomp = decomposeUzbekWord(correctedNewLatin);
  const oldLatin = convertFromNewUzbekLatin(correctedNewLatin, 'old-latin');
  const cyrillic = convertFromNewUzbekLatin(correctedNewLatin, 'cyrillic');
  const syllables = syllabifyUzbekWord(correctedNewLatin);

  const rootKey = decomp.reformedStem.toLowerCase();
  const lexItem = UZBEK_ROOT_LEXICON[rootKey] || UZBEK_ROOT_LEXICON[correctedNewLatin.toLowerCase()];

  let partOfSpeech: WordMorphologyAnalysis['partOfSpeech'] = lexItem?.partOfSpeech || 'ot';
  const lastSuffix = decomp.suffixes[decomp.suffixes.length - 1]?.suffix;
  if (lastSuffix === 'moq' || lastSuffix === 'lamoq' || lastSuffix === 'yapti' || lastSuffix === 'di') {
    partOfSpeech = 'fe’l';
  } else if (lastSuffix === 'li' || lastSuffix === 'siz' || lastSuffix === 'dagi' || lastSuffix === 'iy') {
    partOfSpeech = 'sifat';
  } else if (lastSuffix === 'böyiça') {
    partOfSpeech = 'ravish';
  }

  const suffixDescription =
    decomp.suffixes.length > 0
      ? ` Özak: "${decomp.reformedStem}", qöşimçalar: ${decomp.suffixes
          .map((s) => `-${s.suffix} (${s.meaning})`)
          .join(', ')}.`
      : '';

  const definition = lexItem
    ? `${lexItem.definition}${suffixDescription}`
    : `"${correctedNewLatin}" — 2026-yilgi yangilangan özbek lotin alifbosi qoidalari asosida me’yorlaştirilgan söz (${syllables}).${suffixDescription}`;

  const exampleNewLatin =
    lexItem?.exampleNewLatin ||
    `Ushbu matnda "${correctedNewLatin}" sözi 2026-yilgi yangi özbek alifbosi me’yorida qöllandi.`;

  return {
    originalInput: trimmed,
    newLatin: correctedNewLatin,
    oldLatin,
    cyrillic,
    root: decomp.reformedStem,
    suffixes: decomp.suffixes,
    syllables,
    partOfSpeech,
    definition,
    exampleNewLatin,
    isFromLexicon: Boolean(lexItem || INFORMAL_TO_2026_STEMS[decomp.stem]),
    wasAutoCorrected: correctedNewLatin !== trimmed
  };
}

/**
 * Performs comprehensive linguistic analysis on input text and returns stats, diffs, and orthographic issues.
 */
export function analyzeUzbekText(text: string): TextAnalysisResult {
  const convertedText = applyAllOrthographyFixes(text);
  const detectedScript = detectScript(text);

  const words = convertedText
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;
  const charCount = convertedText.length;
  const sentenceCount = convertedText.trim()
    ? convertedText
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter(Boolean).length || 1
    : 0;
  const syllableCount = countUzbekSyllables(convertedText);

  let vowelCount = 0;
  let consonantCount = 0;
  for (const ch of convertedText) {
    if (UZBEK_VOWELS.has(ch)) {
      vowelCount++;
    } else if (/[A-Za-zÖöĞğŞşÇç]/.test(ch)) {
      consonantCount++;
    }
  }

  const countMatches = (regex: RegExp) => (convertedText.match(regex) || []).length;
  const collectExamples = (charRegex: RegExp): string[] => {
    const found = new Set<string>();
    for (const w of words) {
      const cleaned = w.replace(/^[^A-Za-zÖöĞğŞşÇç’]+|[^A-Za-zÖöĞğŞşÇç’]+$/g, '');
      if (cleaned && charRegex.test(cleaned)) {
        found.add(cleaned);
        if (found.size >= 4) break;
      }
    }
    return Array.from(found);
  };

  const oCount = countMatches(/[Öö]/g);
  const gCount = countMatches(/[Ğğ]/g);
  const sCount = countMatches(/[Şş]/g);
  const cCount = countMatches(/[Çç]/g);
  const tutuqCount = countMatches(/’/g);

  const replacements: ReplacementStat[] = [
    {
      symbol: 'Ö / ö',
      oldEquivalent: "O‘ / o‘ (Ў ў)",
      count: oCount,
      examples: collectExamples(/[Öö]/)
    },
    {
      symbol: 'Ğ / ğ',
      oldEquivalent: "G‘ / g‘ (Ғ ғ)",
      count: gCount,
      examples: collectExamples(/[Ğğ]/)
    },
    {
      symbol: 'Ş / ş',
      oldEquivalent: 'Sh / sh (Ш ш)',
      count: sCount,
      examples: collectExamples(/[Şş]/)
    },
    {
      symbol: 'Ç / ç',
      oldEquivalent: 'Ch / ch (Ч ч)',
      count: cCount,
      examples: collectExamples(/[Çç]/)
    },
    {
      symbol: '’ (tutuq)',
      oldEquivalent: 'Ъ / ’ (ayriş belgisi)',
      count: tutuqCount,
      examples: collectExamples(/’/)
    }
  ];

  const totalReplacements = oCount + gCount + sCount + cCount;

  const rawTokens = text.split(/(\s+)/);
  const diffWords: DiffSegment[] = [];
  let reformedWordCount = 0;

  for (const token of rawTokens) {
    if (!token) continue;
    if (/^\s+$/.test(token)) {
      diffWords.push({ text: token, changed: false });
      continue;
    }
    const convertedToken = applyAllOrthographyFixes(token);
    const changed = convertedToken !== token;
    if (/[ÖöĞğŞşÇç]/.test(convertedToken)) {
      reformedWordCount++;
    }
    diffWords.push({
      text: convertedToken,
      changed,
      original: changed ? token : undefined
    });
  }

  const reformImpactPercent = wordCount > 0 ? Math.round((reformedWordCount / wordCount) * 100) : 0;
  const issues = checkUzbekTextErrors(text);

  return {
    originalText: text,
    convertedText,
    detectedScript,
    wordCount,
    charCount,
    sentenceCount,
    syllableCount,
    reformedWordCount,
    reformImpactPercent,
    replacements,
    totalReplacements,
    vowelCount,
    consonantCount,
    diffWords,
    issues
  };
}
