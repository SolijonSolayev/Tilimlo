import {
  analyzeSingleUzbekWord,
  convertFromNewUzbekLatin,
  syllabifyUzbekWord
} from './uzbekLinguistics';

export type MorphemeCategory =
  | 'root'
  | 'derivational'
  | 'lexical-form'
  | 'possessive'
  | 'case'
  | 'verb-form';

export interface MorphemeNode {
  id: string;
  text: string; // e.g., "söz" or "-lar"
  cleanText: string; // e.g., "söz" or "lar"
  oldLatin: string;
  cyrillic: string;
  category: MorphemeCategory;
  categoryLabel: string; // e.g., "Özak (Asos)", "Köplik (Lug‘aviy shakl)"
  grammaticalRole: string; // e.g., "Lug‘aviy ma’no asosi", "Köplik qöşimçasi"
  notationSymbol: 'Özak' | '^' | '□' | '◊';
  notationName: string;
}

export interface GraphicalMorphologyAnalysis {
  originalWord: string;
  newLatin: string;
  oldLatin: string;
  cyrillic: string;
  syllables: string[];
  partOfSpeech: 'ot' | 'sifat' | 'fe’l' | 'ravish' | 'olmosh';
  partOfSpeechLabel: string;
  definition: string;
  exampleNewLatin: string;
  wasAutoCorrected: boolean;
  morphemes: MorphemeNode[];
  structureFormula: string;
}

interface AtomicSuffixMeta {
  category: Exclude<MorphemeCategory, 'root'>;
  categoryLabel: string;
  grammaticalRole: string;
  notationSymbol: '^' | '□' | '◊';
  notationName: string;
}

/**
 * Metadata for atomic Uzbek suffixes in 2026 New Latin.
 */
const ATOMIC_SUFFIX_DICTIONARY: Record<string, AtomicSuffixMeta> = {
  // Söz yasovçi qöşimçalar (Derivational — ^)
  çi: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Şaxs va kasb-faoliyat oti yasovçi (-çi)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  uvçi: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Harakat bajaruvçi şaxs oti yasovçi (-uvçi)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  ovçi: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Faoliyat bajaruvçi şaxs oti yasovçi (-ovçi)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  lik: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Mavhum ot va xoslik sifati yasovçi (-lik)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  liq: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Ot va sifat yasovçi qöşimça (-liq)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  li: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Belgi-xususiyatli sifat yasovçi (-li)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  siz: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Belgi yöqligini bildiruvçi sifat yasovçi (-siz)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  gi: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Örin va paytga xos sifat yasovçi (-gi)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  ki: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Payt va öringa xos sifat yasovçi (-ki)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  qi: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Payt va öringa xos sifat yasovçi (-qi)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  iy: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Nisbiy sifat yasovçi (-iy)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  viy: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Nisbiy sifat yasovçi (-viy)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  bon: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Qarovçi va kasb egasi oti yasovçi (-bon)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  doş: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Hamrohlik va umumiylik oti yasovçi (-doş)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  kor: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Faoliyat egasi va sifat yasovçi (-kor)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  dor: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Egalik belgisi sifat yasovçi (-dor)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  xona: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Joy va bino oti yasovçi (-xona)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  iston: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Mamlakat va makon oti yasovçi (-iston)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  la: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Ismlardan fe’l yasovçi qöşimça (-la)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  lan: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Özlik fe’l yasovçi qöşimça (-lan)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  laş: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Birgalik va jarayon fe’li yasovçi (-laş)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  im: {
    category: 'possessive',
    categoryLabel: 'Egalik (I şaxs)',
    grammaticalRole: 'I şaxs birlik egalik yoki ot yasovçi (-im)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ma: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Fe’ldan ot/sifat yasovçi yoki bölüşsizlik (-ma)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  kiç: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Qurol-vosita oti yasovçi (-kiç)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  giç: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Vosita oti yasovçi (-giç)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },
  lom: {
    category: 'derivational',
    categoryLabel: 'Söz yasovçi',
    grammaticalRole: 'Holat sifati yasovçi (-lom)',
    notationSymbol: '^',
    notationName: 'Söz yasovçi qöşimça (^)'
  },

  // Lug‘aviy shakl yasovçi (Lexical form-building — □)
  lar: {
    category: 'lexical-form',
    categoryLabel: 'Köplik shakli',
    grammaticalRole: 'Otning köplik lug‘aviy shakl yasovçisi (-lar)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  ça: {
    category: 'lexical-form',
    categoryLabel: 'Lug‘aviy shakl',
    grammaticalRole: 'Kiçraytiriş-erkalaş yoki ravish yasovçi (-ça)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  roq: {
    category: 'lexical-form',
    categoryLabel: 'Qiyosiy daraja',
    grammaticalRole: 'Sifatning qiyosiy daraja shakli (-roq)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  gina: {
    category: 'lexical-form',
    categoryLabel: 'Erkalaş / Çeklov',
    grammaticalRole: 'Erkalaş va çeklov yuklamasi/qöşimçasi (-gina)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  tir: {
    category: 'lexical-form',
    categoryLabel: 'Orttirma nisbat',
    grammaticalRole: 'Fe’lning orttirma nisbat shakli (-tir)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  dir: {
    category: 'lexical-form',
    categoryLabel: 'Orttirma / Kesimlik',
    grammaticalRole: 'Orttirma nisbat yoki tasdiq kesimlik qöşimçasi (-dir)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  t: {
    category: 'lexical-form',
    categoryLabel: 'Orttirma nisbat',
    grammaticalRole: 'Fe’lning orttirma nisbat shakli (-t)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  sat: {
    category: 'lexical-form',
    categoryLabel: 'Orttirma nisbat',
    grammaticalRole: 'Fe’lning orttirma nisbat shakli (-sat)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  il: {
    category: 'lexical-form',
    categoryLabel: 'Majhul nisbat',
    grammaticalRole: 'Fe’lning majhul nisbat shakli (-il)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  in: {
    category: 'lexical-form',
    categoryLabel: 'Özlik nisbat',
    grammaticalRole: 'Fe’lning özlik nisbat shakli (-in)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  ş: {
    category: 'lexical-form',
    categoryLabel: 'Birgalik / Harakat',
    grammaticalRole: 'Birgalik nisbati yoki harakat nomi (-ş)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  iş: {
    category: 'lexical-form',
    categoryLabel: 'Harakat nomi',
    grammaticalRole: 'Fe’lning harakat nomi shakli (-iş)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  moq: {
    category: 'lexical-form',
    categoryLabel: 'Harakat nomi',
    grammaticalRole: 'Fe’lning noaniq (harakat nomi) shakli (-moq)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  gan: {
    category: 'lexical-form',
    categoryLabel: 'Sifatdoş',
    grammaticalRole: 'Ötgan zamon sifatdoş shakli (-gan)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },
  ib: {
    category: 'lexical-form',
    categoryLabel: 'Ravişdoş',
    grammaticalRole: 'Holat va payt ravişdoşi shakli (-ib)',
    notationSymbol: '□',
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  },

  // Egalik qöşimçalari (Possessive — ◊)
  m: {
    category: 'possessive',
    categoryLabel: 'Egalik (I şaxs)',
    grammaticalRole: 'I şaxs birlik egalik qöşimçasi (-m)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  imiz: {
    category: 'possessive',
    categoryLabel: 'Egalik (I şaxs köplik)',
    grammaticalRole: 'I şaxs köplik egalik qöşimçasi (-imiz)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  miz: {
    category: 'possessive',
    categoryLabel: 'Egalik / Şaxs-son',
    grammaticalRole: 'I şaxs köplik egalik yoki şaxs-son qöşimçasi (-miz)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ng: {
    category: 'possessive',
    categoryLabel: 'Egalik (II şaxs)',
    grammaticalRole: 'II şaxs birlik egalik qöşimçasi (-ng)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ing: {
    category: 'possessive',
    categoryLabel: 'Egalik (II şaxs)',
    grammaticalRole: 'II şaxs birlik egalik qöşimçasi (-ing)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ingiz: {
    category: 'possessive',
    categoryLabel: 'Egalik (II şaxs köplik)',
    grammaticalRole: 'II şaxs köplik egalik qöşimçasi (-ingiz)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ngiz: {
    category: 'possessive',
    categoryLabel: 'Egalik (II şaxs köplik)',
    grammaticalRole: 'II şaxs köplik egalik qöşimçasi (-ngiz)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  i: {
    category: 'possessive',
    categoryLabel: 'Egalik (III şaxs)',
    grammaticalRole: 'III şaxs egalik qöşimçasi (-i)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  si: {
    category: 'possessive',
    categoryLabel: 'Egalik (III şaxs)',
    grammaticalRole: 'Unlidan keyingi III şaxs egalik qöşimçasi (-si)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },

  // Kelişik qöşimçalari (Case — ◊)
  ning: {
    category: 'case',
    categoryLabel: 'Qaratqiç kelişigi',
    grammaticalRole: 'Qaratqiç kelişigi qöşimçasi (-ning)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ni: {
    category: 'case',
    categoryLabel: 'Tuşum kelişigi',
    grammaticalRole: 'Tuşum kelişigi qöşimçasi (-ni)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ga: {
    category: 'case',
    categoryLabel: 'Jönaliş kelişigi',
    grammaticalRole: 'Jönaliş kelişigi qöşimçasi (-ga)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ka: {
    category: 'case',
    categoryLabel: 'Jönaliş kelişigi',
    grammaticalRole: 'Jönaliş kelişigi fonetik varianti (-ka)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  qa: {
    category: 'case',
    categoryLabel: 'Jönaliş kelişigi',
    grammaticalRole: 'Jönaliş kelişigi fonetik varianti (-qa)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  da: {
    category: 'case',
    categoryLabel: 'Örin-payt kelişigi',
    grammaticalRole: 'Örin-payt kelişigi qöşimçasi (-da)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  dan: {
    category: 'case',
    categoryLabel: 'Çiqiç kelişigi',
    grammaticalRole: 'Çiqiç kelişigi qöşimçasi (-dan)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },

  // Fe’l zamon, mayl va şaxs-son qöşimçalari (Verb Tense/Person — ◊)
  di: {
    category: 'verb-form',
    categoryLabel: 'Ötgan zamon',
    grammaticalRole: 'Yaqin ötgan zamon va III şaxs qöşimçasi (-di)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  yap: {
    category: 'verb-form',
    categoryLabel: 'Hozirgi zamon',
    grammaticalRole: 'Hozirgi zamon davom fe’li qöşimçasi (-yap)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  ti: {
    category: 'verb-form',
    categoryLabel: 'Şaxs-son (III şaxs)',
    grammaticalRole: 'Hozirgi zamon III şaxs kesimlik shakli (-ti)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  yapti: {
    category: 'verb-form',
    categoryLabel: 'Hozirgi zamon',
    grammaticalRole: 'Hozirgi zamon davom fe’li III şaxs (-yapti)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  moqda: {
    category: 'verb-form',
    categoryLabel: 'Hozirgi-kelasi zamon',
    grammaticalRole: 'Adabiy hozirgi zamon davom shakli (-moqda)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  man: {
    category: 'verb-form',
    categoryLabel: 'Şaxs-son (I şaxs)',
    grammaticalRole: 'I şaxs birlik kesimlik/şaxs-son qöşimçasi (-man)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  san: {
    category: 'verb-form',
    categoryLabel: 'Şaxs-son (II şaxs)',
    grammaticalRole: 'II şaxs birlik şaxs-son qöşimçasi (-san)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  },
  sa: {
    category: 'verb-form',
    categoryLabel: 'Şart mayli',
    grammaticalRole: 'Fe’lning şart mayli qöşimçasi (-sa)',
    notationSymbol: '◊',
    notationName: 'Sintaktik / munosabat shakli (◊)'
  }
};

/**
 * Unpacks compound suffixes into sequential atomic suffixes.
 */
const COMPOUND_SUFFIX_SPLITS: Record<string, string[]> = {
  larimizdan: ['lar', 'imiz', 'dan'],
  laringizga: ['lar', 'ingiz', 'ga'],
  larining: ['lar', 'i', 'ning'],
  larimizga: ['lar', 'imiz', 'ga'],
  larimizni: ['lar', 'imiz', 'ni'],
  laridan: ['lar', 'i', 'dan'],
  lariga: ['lar', 'i', 'ga'],
  larini: ['lar', 'i', 'ni'],
  larning: ['lar', 'ning'],
  lardagi: ['lar', 'da', 'gi'],
  sidagi: ['si', 'da', 'gi'],
  lashtir: ['la', 'ş', 'tir'],
  laştir: ['la', 'ş', 'tir'],
  lanmoq: ['lan', 'moq'],
  lamoq: ['la', 'moq'],
  yapman: ['yap', 'man'],
  yapsiz: ['yap', 'siz'],
  yapti: ['yap', 'ti'],
  larni: ['lar', 'ni'],
  larda: ['lar', 'da'],
  lardan: ['lar', 'dan'],
  larga: ['lar', 'ga'],
  chilik: ['çi', 'lik'],
  çilik: ['çi', 'lik'],
  uvchilar: ['uvçi', 'lar'],
  uvçilar: ['uvçi', 'lar'],
  uvchi: ['uvçi'],
  chi: ['çi'],
  ish: ['iş'],
  dagi: ['da', 'gi'],
  lari: ['lar', 'i']
};

/**
 * Secondary decomposition for known derived stems in the lexicon so the graphical diagram
 * shows the true root + derivational morphemes (e.g., "öqituvçi" -> "öqi" + "-t" + "-uvçi").
 */
const DERIVED_STEM_DECOMPOSITIONS: Record<
  string,
  { trueRoot: string; innerSuffixes: string[] }
> = {
  öqituvçi: { trueRoot: 'öqi', innerSuffixes: ['t', 'uvçi'] },
  öquvçi: { trueRoot: 'öqi', innerSuffixes: ['uvçi'] },
  öqiş: { trueRoot: 'öqi', innerSuffixes: ['iş'] },
  öqimoq: { trueRoot: 'öqi', innerSuffixes: ['moq'] },
  sözlovçi: { trueRoot: 'söz', innerSuffixes: ['la', 'ovçi'] },
  sözlamoq: { trueRoot: 'söz', innerSuffixes: ['la', 'moq'] },
  sözla: { trueRoot: 'söz', innerSuffixes: ['la'] },
  sözlik: { trueRoot: 'söz', innerSuffixes: ['lik'] },
  köpçilik: { trueRoot: 'köp', innerSuffixes: ['çi', 'lik'] },
  köpaytir: { trueRoot: 'köp', innerSuffixes: ['tir'] },
  körsatkiç: { trueRoot: 'kör', innerSuffixes: ['sat', 'kiç'] },
  köriniş: { trueRoot: 'kör', innerSuffixes: ['in', 'iş'] },
  körmoq: { trueRoot: 'kör', innerSuffixes: ['moq'] },
  kömaklaş: { trueRoot: 'kömak', innerSuffixes: ['laş'] },
  köngilli: { trueRoot: 'köngil', innerSuffixes: ['li'] },
  bölmoq: { trueRoot: 'böl', innerSuffixes: ['moq'] },
  bölim: { trueRoot: 'böl', innerSuffixes: ['im'] },
  bölinma: { trueRoot: 'böl', innerSuffixes: ['in', 'ma'] },
  böyiça: { trueRoot: 'böy', innerSuffixes: ['i', 'ça'] },
  töldir: { trueRoot: 'töl', innerSuffixes: ['dir'] },
  yölovçi: { trueRoot: 'yöl', innerSuffixes: ['ovçi'] },
  yönaliş: { trueRoot: 'yönal', innerSuffixes: ['iş'] },
  yönaltir: { trueRoot: 'yönal', innerSuffixes: ['tir'] },
  qöllanma: { trueRoot: 'qöl', innerSuffixes: ['lan', 'ma'] },
  qölla: { trueRoot: 'qöl', innerSuffixes: ['la'] },
  qöşimça: { trueRoot: 'qöş', innerSuffixes: ['im', 'ça'] },
  qöymoq: { trueRoot: 'qöy', innerSuffixes: ['moq'] },
  örganiş: { trueRoot: 'örgan', innerSuffixes: ['iş'] },
  ösimlik: { trueRoot: 'ös', innerSuffixes: ['im', 'lik'] },
  ösiş: { trueRoot: 'ös', innerSuffixes: ['iş'] },
  ötmiş: { trueRoot: 'öt', innerSuffixes: ['iş'] },
  ötiş: { trueRoot: 'öt', innerSuffixes: ['iş'] },
  öylamoq: { trueRoot: 'öyla', innerSuffixes: ['moq'] },
  öyinçi: { trueRoot: 'öyin', innerSuffixes: ['çi'] },
  özgariş: { trueRoot: 'özgar', innerSuffixes: ['iş'] },
  özgartir: { trueRoot: 'özgar', innerSuffixes: ['tir'] },
  özlaştir: { trueRoot: 'öz', innerSuffixes: ['laş', 'tir'] },
  ögirmoq: { trueRoot: 'ögir', innerSuffixes: ['moq'] },
  ögiriş: { trueRoot: 'ögir', innerSuffixes: ['iş'] },
  öçirgiç: { trueRoot: 'öçir', innerSuffixes: ['giç'] },
  döstlik: { trueRoot: 'döst', innerSuffixes: ['lik'] },
  gözallik: { trueRoot: 'gözal', innerSuffixes: ['lik'] },
  töğrila: { trueRoot: 'töğri', innerSuffixes: ['la'] },
  töğrilaş: { trueRoot: 'töğri', innerSuffixes: ['la', 'ş'] },
  töğrisida: { trueRoot: 'töğri', innerSuffixes: ['si', 'da'] },
  töğrisidagi: { trueRoot: 'töğri', innerSuffixes: ['si', 'da', 'gi'] },
  öğirlik: { trueRoot: 'öğir', innerSuffixes: ['lik'] },
  oğrimoq: { trueRoot: 'oğri', innerSuffixes: ['moq'] },
  boğbon: { trueRoot: 'boğ', innerSuffixes: ['bon'] },
  boğça: { trueRoot: 'boğ', innerSuffixes: ['ça'] },
  boğla: { trueRoot: 'boğ', innerSuffixes: ['la'] },
  boğlaniş: { trueRoot: 'boğ', innerSuffixes: ['lan', 'iş'] },
  boğliq: { trueRoot: 'boğ', innerSuffixes: ['liq'] },
  yiğiliş: { trueRoot: 'yiğ', innerSuffixes: ['il', 'iş'] },
  soğlom: { trueRoot: 'soğ', innerSuffixes: ['lom'] },
  soğliq: { trueRoot: 'soğ', innerSuffixes: ['liq'] },
  tuğilgan: { trueRoot: 'tuğ', innerSuffixes: ['il', 'gan'] },
  tuğil: { trueRoot: 'tuğ', innerSuffixes: ['il'] },
  uluğvor: { trueRoot: 'uluğ', innerSuffixes: ['li'] },
  uyğunlik: { trueRoot: 'uyğun', innerSuffixes: ['lik'] },
  yolğonçi: { trueRoot: 'yolğon', innerSuffixes: ['çi'] },
  yoruğlik: { trueRoot: 'yoruğ', innerSuffixes: ['lik'] },
  işla: { trueRoot: 'iş', innerSuffixes: ['la'] },
  çiroyli: { trueRoot: 'çiroy', innerSuffixes: ['li'] },
  kuçaytir: { trueRoot: 'kuç', innerSuffixes: ['tir'] },
  özbekiston: { trueRoot: 'özbek', innerSuffixes: ['iston'] }
};

const POS_LABELS: Record<'ot' | 'sifat' | 'fe’l' | 'ravish' | 'olmosh', string> = {
  ot: 'Ot (Narsa-buyum va tushuncha)',
  sifat: 'Sifat (Belgi-xususiyat)',
  'fe’l': 'Fe’l (Harakat va holat)',
  ravish: 'Ravish (Harakat belgisi)',
  olmosh: 'Olmosh (Körsatish va umumlashtirish)'
};

function createMorphemeNode(
  cleanSuffix: string,
  index: number,
  fallbackMeaning?: string
): MorphemeNode {
  const normalized = cleanSuffix
    .replace(/sh/g, 'ş')
    .replace(/ch/g, 'ç')
    .toLowerCase();

  const meta = ATOMIC_SUFFIX_DICTIONARY[normalized] || {
    category: 'lexical-form' as const,
    categoryLabel: 'Qöşimça',
    grammaticalRole: fallbackMeaning || `Grammatik qöşimça (-${normalized})`,
    notationSymbol: '□' as const,
    notationName: 'Lug‘aviy shakl yasovçi (□)'
  };

  return {
    id: `morph-${index}-${normalized}`,
    text: `-${normalized}`,
    cleanText: normalized,
    oldLatin: `-${convertFromNewUzbekLatin(normalized, 'old-latin')}`,
    cyrillic: `-${convertFromNewUzbekLatin(normalized, 'cyrillic')}`,
    category: meta.category,
    categoryLabel: meta.categoryLabel,
    grammaticalRole: meta.grammaticalRole,
    notationSymbol: meta.notationSymbol,
    notationName: meta.notationName
  };
}

/**
 * Produces a complete, granular morphological breakdown for graphical rendering
 * (root + derivational suffixes + lexical form suffixes + possessive + case/verb suffixes).
 */
export function buildGraphicalMorphemeChain(rawWord: string): GraphicalMorphologyAnalysis {
  const baseAnalysis = analyzeSingleUzbekWord(rawWord);
  const lowerRoot = baseAnalysis.root.toLowerCase();

  let trueRoot = baseAnalysis.root;
  const atomicSuffixQueue: Array<{ suffix: string; fallbackMeaning?: string }> = [];

  // Check if the lexicon root itself is a derived stem that can be decomposed further
  const derivedEntry = DERIVED_STEM_DECOMPOSITIONS[lowerRoot];
  if (derivedEntry) {
    const isCapitalized =
      baseAnalysis.root.length > 0 &&
      baseAnalysis.root[0] === baseAnalysis.root[0].toUpperCase() &&
      baseAnalysis.root[0] !== baseAnalysis.root[0].toLowerCase();
    trueRoot = isCapitalized
      ? derivedEntry.trueRoot[0].toUpperCase() + derivedEntry.trueRoot.slice(1)
      : derivedEntry.trueRoot;

    for (const inner of derivedEntry.innerSuffixes) {
      atomicSuffixQueue.push({ suffix: inner });
    }
  }

  // Unpack each outer suffix into atomic sequential suffixes
  for (const outer of baseAnalysis.suffixes) {
    const splitList = COMPOUND_SUFFIX_SPLITS[outer.suffix.toLowerCase()];
    if (splitList && splitList.length > 0) {
      for (const atomic of splitList) {
        atomicSuffixQueue.push({ suffix: atomic, fallbackMeaning: outer.meaning });
      }
    } else {
      atomicSuffixQueue.push({
        suffix: outer.suffix
          .replace(/sh/g, 'ş')
          .replace(/ch/g, 'ç')
          .toLowerCase(),
        fallbackMeaning: outer.meaning
      });
    }
  }

  // Additional greedy pass if no suffixes were found yet and root ends with common atomic suffixes
  if (atomicSuffixQueue.length === 0 && trueRoot.length >= 5) {
    const extraAtomic = [
      'iston',
      'xona',
      'dagi',
      'ning',
      'lari',
      'lar',
      'lik',
      'siz',
      'dan',
      'ga',
      'da',
      'ni',
      'çi',
      'li'
    ];
    let workingRoot = trueRoot.toLowerCase();
    const extraFound: string[] = [];

    for (let pass = 0; pass < 2; pass++) {
      let matched = false;
      for (const cand of extraAtomic) {
        if (workingRoot.length >= cand.length + 3 && workingRoot.endsWith(cand)) {
          const split = COMPOUND_SUFFIX_SPLITS[cand] || [cand];
          extraFound.unshift(...split);
          workingRoot = workingRoot.slice(0, workingRoot.length - cand.length);
          matched = true;
          break;
        }
      }
      if (!matched) break;
    }

    if (extraFound.length > 0) {
      const isCap =
        trueRoot[0] === trueRoot[0].toUpperCase() &&
        trueRoot[0] !== trueRoot[0].toLowerCase();
      trueRoot = isCap ? workingRoot[0].toUpperCase() + workingRoot.slice(1) : workingRoot;
      for (const s of extraFound) {
        atomicSuffixQueue.push({ suffix: s });
      }
    }
  }

  const rootNode: MorphemeNode = {
    id: `morph-0-root`,
    text: trueRoot,
    cleanText: trueRoot,
    oldLatin: convertFromNewUzbekLatin(trueRoot, 'old-latin'),
    cyrillic: convertFromNewUzbekLatin(trueRoot, 'cyrillic'),
    category: 'root',
    categoryLabel: 'Özak (Asos)',
    grammaticalRole: `Sözning tub lug‘aviy ma’no asosi (${POS_LABELS[baseAnalysis.partOfSpeech]})`,
    notationSymbol: 'Özak',
    notationName: 'Özak — lug‘aviy asos'
  };

  const suffixNodes = atomicSuffixQueue.map((item, idx) =>
    createMorphemeNode(item.suffix, idx + 1, item.fallbackMeaning)
  );

  const morphemes = [rootNode, ...suffixNodes];
  const rawSyllables = syllabifyUzbekWord(baseAnalysis.newLatin);
  const syllables = rawSyllables ? rawSyllables.split('-').filter(Boolean) : [baseAnalysis.newLatin];

  const structureFormula = morphemes
    .map((m) =>
      m.category === 'root'
        ? `[${m.text} : Özak]`
        : `[${m.text} : ${m.categoryLabel} (${m.notationSymbol})]`
    )
    .join(' + ');

  return {
    originalWord: baseAnalysis.originalInput,
    newLatin: baseAnalysis.newLatin,
    oldLatin: baseAnalysis.oldLatin,
    cyrillic: baseAnalysis.cyrillic,
    syllables,
    partOfSpeech: baseAnalysis.partOfSpeech,
    partOfSpeechLabel: POS_LABELS[baseAnalysis.partOfSpeech],
    definition: baseAnalysis.definition,
    exampleNewLatin: baseAnalysis.exampleNewLatin,
    wasAutoCorrected: baseAnalysis.wasAutoCorrected,
    morphemes,
    structureFormula
  };
}

/**
 * Extracts unique/ordered Uzbek words from a text passage for interactive graphical inspection.
 */
export function extractAnalyzableWordsFromText(text: string): string[] {
  if (!text || !text.trim()) return [];
  const matches = text.match(/[A-Za-zÖöĞğŞşÇçА-Яа-яЁёЎўҚқҒғҲҳ’'‘`ʻʼ-]+/g);
  if (!matches) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of matches) {
    const cleaned = raw.replace(/^-+|-+$/g, '');
    if (cleaned.length < 2) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
    if (result.length >= 24) break;
  }
  return result;
}
