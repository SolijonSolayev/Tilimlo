/**
 * Comprehensive Uzbek Morphological Analyzer, Stemmer, and Root Lexicon (2026 Standard)
 * Enables recognition, stem- + suffix-aware correction, and instant dictionary lookup
 * for ANY Uzbek word (including inflected words and informal apostrophe-less input like "sozlarni" -> "sözlarni").
 */

export interface WordMorphologyAnalysis {
  originalInput: string;
  newLatin: string;
  oldLatin: string;
  cyrillic: string;
  root: string;
  suffixes: Array<{ suffix: string; meaning: string }>;
  syllables: string;
  partOfSpeech: 'ot' | 'sifat' | 'fe’l' | 'ravish' | 'olmosh';
  definition: string;
  exampleNewLatin: string;
  isFromLexicon: boolean;
  wasAutoCorrected: boolean;
}

/**
 * Informal / apostrophe-less Uzbek roots where users frequently omit the apostrophe in o' (ö) or g' (ğ).
 * Maps lowercase informal stem -> canonical 2026 New Uzbek Latin stem.
 */
export const INFORMAL_TO_2026_STEMS: Record<string, string> = {
  // Ö (o') stems
  ozbek: 'özbek',
  ozbekiston: 'özbekiston',
  ozbekona: 'özbekona',
  soz: 'söz',
  sozla: 'sözla',
  sozlamoq: 'sözlamoq',
  sozlovchi: 'sözlovçi',
  sozlovçi: 'sözlovçi',
  sozlik: 'sözlik',
  kop: 'köp',
  kopchilik: 'köpçilik',
  kopçilik: 'köpçilik',
  kopay: 'köpay',
  kopaytir: 'köpaytir',
  kor: 'kör',
  kormoq: 'körmoq',
  korsat: 'körsat',
  korsatkich: 'körsatkiç',
  korsatkiç: 'körsatkiç',
  korinish: 'köriniş',
  koriniş: 'köriniş',
  kocha: 'köça',
  koç: 'köç',
  koch: 'köç',
  kochir: 'köçir',
  köchir: 'köçir',
  koz: 'köz',
  kozgu: 'közgu',
  kongil: 'köngil',
  kongilli: 'köngilli',
  kol: 'köl',
  komak: 'kömak',
  komaklash: 'kömaklaş',
  kondalang: 'köndalang',
  konikma: 'könikma',
  koprik: 'köprik',
  korgazma: 'körgazma',
  korpa: 'körpa',
  koks: 'köks',
  koklam: 'köklam',
  kokrak: 'kökrak',
  bol: 'böl',
  bolib: 'bölib',
  bolmoq: 'bölmoq',
  bolim: 'bölim',
  bolinma: 'bölinma',
  boyi: 'böyi',
  boyicha: 'böyiça',
  boyiça: 'böyiça',
  boylab: 'böylab',
  boyin: 'böyın',
  bori: 'böri',
  boron: 'böron',
  bosh: 'böş',
  bosha: 'böşa',
  boyoq: 'böyoq',
  tol: 'töl',
  tola: 'töla',
  tolov: 'tölov',
  toliq: 'töliq',
  toldir: 'töldir',
  tolqin: 'tölqin',
  toxtat: 'töxtat',
  toxta: 'töxta',
  toplam: 'töplam',
  topla: 'töpla',
  toqima: 'töqima',
  toqson: 'töqson',
  tort: 'tört',
  tortinchi: 'törtinçi',
  tortinçi: 'törtinçi',
  tosin: 'tösin',
  tosiq: 'tösiq',
  toy: 'töy',
  yol: 'yöl',
  yola: 'yöla',
  yolak: 'yölak',
  yolovchi: 'yölovçi',
  yolovçi: 'yölovçi',
  yoriqnoma: 'yöriqnoma',
  yonalish: 'yönaliş',
  yonaliş: 'yönaliş',
  yonaltir: 'yönaltir',
  yoq: 'yöq',
  yoqot: 'yöqot',
  yoqol: 'yöqol',
  yoqlama: 'yöqlama',
  qol: 'qöl',
  qolla: 'qölla',
  qollab: 'qöllab',
  qollanma: 'qöllanma',
  qosh: 'qöş',
  qoshimcha: 'qöşimça',
  qoşimça: 'qöşimça',
  qoshiq: 'qöşiq',
  qoshni: 'qöşni',
  qoshin: 'qöşin',
  qorq: 'qörq',
  qorinch: 'qörinç',
  qoriqchi: 'qöriqçi',
  qoy: 'qöy',
  qoymoq: 'qöymoq',
  qozon: 'qozon',
  qozga: 'qözğa',
  qozgolon: 'qözğolon',
  oq: 'öq',
  oqi: 'öqi',
  oqimoq: 'öqimoq',
  oqish: 'öqiş',
  oqiş: 'öqiş',
  oqituvchi: 'öqituvçi',
  oqituvçi: 'öqituvçi',
  oquv: 'öquv',
  oquvchi: 'öquvçi',
  oquvçi: 'öquvçi',
  organ: 'örgan',
  organish: 'örganiş',
  organiş: 'örganiş',
  orgat: 'örgat',
  orin: 'örin',
  orinbosar: 'örinbosar',
  ornat: 'örnat',
  orni: 'örni',
  orniga: 'örniga',
  orta: 'örta',
  ortoq: 'örtoq',
  osimlik: 'ösimlik',
  osmir: 'ösmir',
  osish: 'ösiş',
  otkir: 'ötkir',
  otmish: 'ötmiş',
  otkaz: 'ötkaz',
  otish: 'ötiş',
  otir: 'ötir',
  otin: 'ötin',
  oy: 'öy',
  oyla: 'öyla',
  oylamoq: 'öylamoq',
  oyin: 'öyin',
  oyinchi: 'öyinçi',
  oyinchoq: 'öyinçoq',
  oz: 'öz',
  ozi: 'özi',
  ozim: 'özim',
  ozimiz: 'özimiz',
  ozing: 'özing',
  ozingiz: 'özingiz',
  ozgar: 'özgar',
  ozgarish: 'özgarış',
  ozgarış: 'özgarış',
  ozgartir: 'özgartir',
  ozlashtir: 'özlaştir',
  ozlaştir: 'özlaştir',
  ozaro: 'özaro',
  ogir: 'ögir',
  ogirmoq: 'ögirmoq',
  ogirish: 'ögiriş',
  ogiriş: 'ögiriş',
  echki: 'eçki',
  ochir: 'öçir',
  ochirgich: 'öçirgiç',
  olcha: 'ölça',
  olchov: 'ölçov',
  olka: 'ölka',
  olmas: 'ölmas',
  on: 'ön',
  oninchi: 'öninçi',
  opka: 'öpka',
  orak: 'örak',
  ordak: 'ördak',
  orma: 'örma',
  ormon: 'örmon',
  ornak: 'örnak',
  ikkov: 'ikkov',
  dost: 'döst',
  dostlik: 'döstlik',
  post: 'pöst',
  gost: 'göşt',
  gosht: 'göşt',
  gozal: 'gözal',
  gozallik: 'gözallik',
  choqqi: 'çöqqi',
  çoqqi: 'çöqqi',
  chol: 'çöl',
  chontak: 'çöntak',
  chochqa: 'çöçqa',
  choz: 'çöz',
  chozil: 'çözil',
  jora: 'jöra',
  joja: 'jöja',
  oshxona: 'oşxona',
  shorva: 'şörva',
  şorva: 'şörva',
  shox: 'şöx',
  monjiza: 'mö’jiza',
  moljal: 'möljal',
  mojaz: 'möjaz',
  motabar: 'mö’tabar',
  motadil: 'mö’tadil',

  // Ğ (g') stems and combined Ö + Ğ stems
  togri: 'töğri',
  togrila: 'töğrila',
  togrilash: 'töğrilaş',
  togrilaş: 'töğrilaş',
  togrisida: 'töğrisida',
  togrisidagi: 'töğrisidagi',
  'tög‘risidagi': 'töğrisidagi',
  tögrisidagi: 'töğrisidagi',
  ogil: 'öğil',
  ogri: 'öğri',
  ogirlik: 'öğirlik',
  ogiz: 'oğiz',
  ogriq: 'oğriq',
  ogrimoq: 'oğrimoq',
  bog: 'boğ',
  bogbon: 'boğbon',
  bogcha: 'boğça',
  bogça: 'boğça',
  bogla: 'boğla',
  boglanish: 'boğlaniş',
  boglaniş: 'boğlaniş',
  bogliq: 'boğliq',
  tog: 'toğ',
  togli: 'toğli',
  yog: 'yoğ',
  yogdu: 'yoğdu',
  yogin: 'yoğin',
  yogingarchilik: 'yoğingarçilik',
  yomgir: 'yomğir',
  yig: 'yiğ',
  yigin: 'yiğin',
  yigilish: 'yiğiliş',
  yigiliş: 'yiğiliş',
  yigla: 'yiğla',
  galaba: 'ğalaba',
  galati: 'ğalati',
  gam: 'ğam',
  gamxor: 'ğamxör',
  gamxorlik: 'ğamxörlik',
  ganimat: 'ğanimat',
  garb: 'ğarb',
  garbiy: 'ğarbiy',
  garoyib: 'ğaroyib',
  gayrat: 'ğayrat',
  gayratli: 'ğayratli',
  gazal: 'ğazal',
  gazab: 'ğazab',
  gijjak: 'ğijjak',
  gildirak: 'ğildirak',
  gisht: 'ğişt',
  golib: 'ğolib',
  goya: 'ğoya',
  goyaviy: 'ğoyaviy',
  goz: 'ğoz',
  gujum: 'ğujum',
  guncha: 'ğunça',
  gurur: 'ğurur',
  gururli: 'ğururli',
  galla: 'ğalla',
  garaz: 'ğaraz',
  gor: 'ğor',
  govak: 'ğovak',
  lugat: 'luğat',
  luğat: 'luğat',
  bugdoy: 'buğdoy',
  bugz: 'buğz',
  dugona: 'duğona',
  jugrofiya: 'juğrofiya',
  kagoz: 'qog‘oz',
  qogoz: 'qoğoz',
  magrur: 'mağrur',
  maglub: 'mağlub',
  maglubiyat: 'mağlubiyat',
  magiz: 'mağiz',
  nagz: 'nağz',
  nagma: 'nağma',
  ogoch: 'oğoç',
  ovoz: 'ovoz',
  ragbat: 'rağbat',
  ragbatlantir: 'rağbatlantir',
  sog: 'soğ',
  soglom: 'soğlom',
  sogliq: 'soğliq',
  sugor: 'suğor',
  sugurta: 'suğurta',
  tag: 'tağ',
  tagin: 'tağin',
  tug: 'tuğ',
  tugil: 'tuğil',
  tugilgan: 'tuğilgan',
  tugma: 'tuğma',
  tugri: 'töğri',
  ulug: 'uluğ',
  ulugvor: 'uluğvor',
  urug: 'uruğ',
  uygon: 'uyğon',
  uygun: 'uyğun',
  uygunlik: 'uyğunlik',
  yolgon: 'yolğon',
  yolgonchi: 'yolğonçi',
  yolgiz: 'yolğiz',
  yorug: 'yoruğ',
  yoruglik: 'yoruğlik',
  zagcha: 'zağça',
  zigir: 'ziğir',
  zogora: 'zoğora',
  boz: 'böz',
  chozmoq: 'çözmoq',
  mashgul: 'maşğul',
  mashgulot: 'maşğulot',
  maşgulot: 'maşğulot',
  farog: 'faroğ',
  farogat: 'faroğat',
  charog: 'çaroğ',
  charogon: 'çaroğon',
  çaroğon: 'çaroğon',
  armugon: 'armuğon',
  barg: 'barg',
  boog: 'boğ'
};

/**
 * Productive Uzbek suffixes (ordered longest-first for greedy morphological stripping).
 */
export const UZBEK_SUFFIXES: Array<{ suffix: string; meaning: string }> = [
  { suffix: 'larimizdan', meaning: 'köplik + I şaxs egalik + çiqiç kelişigi' },
  { suffix: 'laringizga', meaning: 'köplik + II şaxs egalik + jönaliş kelişigi' },
  { suffix: 'larining', meaning: 'köplik + III şaxs egalik + qarätqiç kelişigi' },
  { suffix: 'larimizga', meaning: 'köplik + I şaxs egalik + jönaliş kelişigi' },
  { suffix: 'larimizni', meaning: 'köplik + I şaxs egalik + tuşum kelişigi' },
  { suffix: 'laridan', meaning: 'köplik + egalik + çiqiç kelişigi' },
  { suffix: 'lariga', meaning: 'köplik + egalik + jönaliş kelişigi' },
  { suffix: 'larini', meaning: 'köplik + III şaxs egalik + tuşum kelişigi' },
  { suffix: 'larning', meaning: 'köplik + qaratqiç kelişigi' },
  { suffix: 'lardagi', meaning: 'köplik + örin-payt sifatlovçisi' },
  { suffix: 'sidagi', meaning: 'III şaxs egalik + örin-payt + xoslik sifat yasovçi' },
  { suffix: 'lashtir', meaning: 'fe’l yasovçi va orttirma nisbat' },
  { suffix: 'laştir', meaning: 'fe’l yasovçi va orttirma nisbat' },
  { suffix: 'lanmoq', meaning: 'özlik fe’l yasovçi va harakat nomi' },
  { suffix: 'lamoq', meaning: 'fe’l yasovçi va harakat nomi' },
  { suffix: 'yapti', meaning: 'hozirgi zamon davom fe’li (III şaxs)' },
  { suffix: 'yapman', meaning: 'hozirgi zamon davom fe’li (I şaxs)' },
  { suffix: 'yapsiz', meaning: 'hozirgi zamon davom fe’li (II şaxs)' },
  { suffix: 'moqda', meaning: 'adabiy hozirgi zamon fe’l shakli' },
  { suffix: 'larni', meaning: 'köplik + tuşum kelişigi' },
  { suffix: 'larda', meaning: 'köplik + örin-payt kelişigi' },
  { suffix: 'lardan', meaning: 'köplik + çiqiç kelişigi' },
  { suffix: 'larga', meaning: 'köplik + jönaliş kelişigi' },
  { suffix: 'chilik', meaning: 'mavhum ot yasovçi qöşimça' },
  { suffix: 'çilik', meaning: 'mavhum ot yasovçi qöşimça' },
  { suffix: 'uvchilar', meaning: 'şaxs oti + köplik qöşimçasi' },
  { suffix: 'uvçilar', meaning: 'şaxs oti + köplik qöşimçasi' },
  { suffix: 'uvchi', meaning: 'bajaruvçi şaxs oti yasovçi' },
  { suffix: 'uvçi', meaning: 'bajaruvçi şaxs oti yasovçi' },
  { suffix: 'ingiz', meaning: 'II şaxs köplik egalik qöşimçasi' },
  { suffix: 'imiz', meaning: 'I şaxs köplik egalik qöşimçasi' },
  { suffix: 'ning', meaning: 'qaratqiç kelişigi qöşimçasi' },
  { suffix: 'dagi', meaning: 'örin-paytga xos sifat yasovçi' },
  { suffix: 'lari', meaning: 'köplik + III şaxs egalik qöşimçasi' },
  { suffix: 'lik', meaning: 'mavhum ot yoki sifat yasovçi' },
  { suffix: 'liq', meaning: 'ot yoki sifat yasovçi qöşimça' },
  { suffix: 'siz', meaning: 'inkor sifat yasovçi / II şaxs' },
  { suffix: 'lar', meaning: 'köplik qöşimçasi' },
  { suffix: 'dan', meaning: 'çiqiç kelişigi qöşimçasi' },
  { suffix: 'gan', meaning: 'ötgan zamon sifatdoşi' },
  { suffix: 'moq', meaning: 'fe’lning harakat nomi shakli' },
  { suffix: 'chi', meaning: 'kasb-faoliyat oti yasovçi' },
  { suffix: 'çi', meaning: 'kasb-faoliyat oti yasovçi' },
  { suffix: 'ish', meaning: 'harakat nomi yasovçi' },
  { suffix: 'iş', meaning: 'harakat nomi yasovçi' },
  { suffix: 'ni', meaning: 'tuşum kelişigi qöşimçasi' },
  { suffix: 'ga', meaning: 'jönaliş kelişigi qöşimçasi' },
  { suffix: 'da', meaning: 'örin-payt kelişigi qöşimçasi' },
  { suffix: 'gi', meaning: 'xoslik sifat yasovçi' },
  { suffix: 'li', meaning: 'belgi-xususiyat sifat yasovçi' },
  { suffix: 'iy', meaning: 'nisbiy sifat yasovçi' },
  { suffix: 'si', meaning: 'III şaxs egalik qöşimçasi' },
  { suffix: 'im', meaning: 'I şaxs egalik qöşimçasi' },
  { suffix: 'di', meaning: 'yaqin ötgan zamon fe’l qöşimçasi' },
  { suffix: 'ib', meaning: 'ravişdoş yasovçi qöşimça' },
  { suffix: 'i', meaning: 'III şaxs egalik qöşimçasi' }
];

export interface RootLexiconItem {
  root: string;
  partOfSpeech: 'ot' | 'sifat' | 'fe’l' | 'ravish' | 'olmosh';
  definition: string;
  exampleNewLatin?: string;
}

/**
 * Core Uzbek Root Lexicon (in 2026 New Uzbek Latin) used for instant semantic & morphological lookup.
 */
export const UZBEK_ROOT_LEXICON: Record<string, RootLexiconItem> = {
  özbek: {
    root: 'özbek',
    partOfSpeech: 'ot',
    definition: 'Turkiy xalqlar oilasiga mansub millat va shu millatning ona tili.',
    exampleNewLatin: 'Özbek tilidagi barça sözlar yangi alifboda ravon ifodalanadi.'
  },
  özbekiston: {
    root: 'Özbekiston',
    partOfSpeech: 'ot',
    definition: 'Markaziy Osiyoning markazida joylaşgan mustaqil davlat, Vatanimiz.',
    exampleNewLatin: 'Özbekiston Respublikasida yangi lotin alifbosi joriy etildi.'
  },
  söz: {
    root: 'söz',
    partOfSpeech: 'ot',
    definition: 'Tilning narsa, hodisa, belgi yoki harakatni ifodalovçi asosiy lug‘aviy birligi.',
    exampleNewLatin: 'Lug‘atimiz özbek tilidagi barça sözlar va qöşimçalarni taniydi.'
  },
  sözla: {
    root: 'sözla',
    partOfSpeech: 'fe’l',
    definition: 'Fikrni og‘zaki nutq orqali bayon qilmoq, gapirmoq.',
    exampleNewLatin: 'Ona tilida ravon va çiroyli sözlaş madaniyat belgisidir.'
  },
  köp: {
    root: 'köp',
    partOfSpeech: 'ravish',
    definition: 'Miqdori, soni yoki darajasi ziyoda, mo‘l, ança.',
    exampleNewLatin: 'Yangi tizimda juda köp sözlar avtomatik tahlil qilinadi.'
  },
  kör: {
    root: 'kör',
    partOfSpeech: 'fe’l',
    definition: 'Köz vositasida idrok etmoq, kuzatmoq yoki tajribadan ötkazmoq.',
    exampleNewLatin: 'Tarjimon oynasida matn tahlilini darhol köriş mumkin.'
  },
  köça: {
    root: 'köça',
    partOfSpeech: 'ot',
    definition: 'Şahar yoki qişloqda ikki qator binolar oralığidagi qatnov yöli.',
    exampleNewLatin: 'Şahar köçalari va peşlavhalari yangi yozuvda bezatildi.'
  },
  köz: {
    root: 'köz',
    partOfSpeech: 'ot',
    definition: 'Köriş a’zosi; ramziy ma’noda diqqat-e’tibor va nigoh.',
    exampleNewLatin: 'Töğri yozuv közga yoqimli körinadi.'
  },
  köngil: {
    root: 'köngil',
    partOfSpeech: 'ot',
    definition: 'Insonning ichki ruhiy olami, yurak, qalb, tuyğu.',
    exampleNewLatin: 'Yaxşi söz inson könglini kötäradi.'
  },
  böl: {
    root: 'böl',
    partOfSpeech: 'fe’l',
    definition: 'Yuzaga kelmoq, amalga oşmoq, muayyan holatga kirmoq.',
    exampleNewLatin: 'Ilmli yoshlar yurt tayanchi böladi.'
  },
  bölim: {
    root: 'bölim',
    partOfSpeech: 'ot',
    definition: 'Butunning ajratilgan qismi, bob yoki muassasa tarmog‘i.',
    exampleNewLatin: 'Ilovaning har bir bölimi interaktiv vositalar bilan boyitilgan.'
  },
  böyiça: {
    root: 'böyiça',
    partOfSpeech: 'ravish',
    definition: 'Asosida, muvofiq, yuzasidan, yo‘nalishida.',
    exampleNewLatin: '2026-yilgi qöllanma böyiça barça harflar tekşirildi.'
  },
  töliq: {
    root: 'töliq',
    partOfSpeech: 'sifat',
    definition: 'Kemtiksiz, butun, barcha qismlarni qamrab olgan, mukammal.',
    exampleNewLatin: 'Matn yangi alifbo qoidalariga töliq moslashtirildi.'
  },
  tölov: {
    root: 'tölov',
    partOfSpeech: 'ot',
    definition: 'Xarid yoki xizmat evaziga tölanadigan mablağ.',
    exampleNewLatin: 'Raqamli tölov tizimlari yangi alifboda ishlamoqda.'
  },
  töplam: {
    root: 'töplam',
    partOfSpeech: 'ot',
    definition: 'Bir joyga jamlangan narsalar, maqolalar yoki ma’lumotlar majmui.',
    exampleNewLatin: 'Yangi imlo qoidalari töplami nashr etildi.'
  },
  yöl: {
    root: 'yöl',
    partOfSpeech: 'ot',
    definition: 'Qatnov chizig‘i; maqsadga eltuvchi usul, yo‘nalish.',
    exampleNewLatin: 'Ilm-fan yöli taraqqiyot sari eltadi.'
  },
  yönaliş: {
    root: 'yönaliş',
    partOfSpeech: 'ot',
    definition: 'Harakat yoki faoliyatning borgan tomoni, sohasi.',
    exampleNewLatin: 'Tilshunoslikning zamonaviy yönalişlari rivojlanmoqda.'
  },
  yöq: {
    root: 'yöq',
    partOfSpeech: 'ravish',
    definition: 'Mavjud emas, inkor ma’nosini bildiruvchi söz.',
    exampleNewLatin: 'Matnda imlo xatolari yöq.'
  },
  qöl: {
    root: 'qöl',
    partOfSpeech: 'ot',
    definition: 'Insonning yelkadan barmoqlargacha bölgan tana a’zosi.',
    exampleNewLatin: 'Ustozning mehnati har bir satrda qöl izini qoldiradi.'
  },
  qöllanma: {
    root: 'qöllanma',
    partOfSpeech: 'ot',
    definition: 'Biror sohani örganiş yoki amalda qöllaş uçun yozilgan dasturulamal kitob.',
    exampleNewLatin: 'Ushbu ilova 2026-yilgi yangi alifbo qöllanmasi asosida yaratildi.'
  },
  qöşiq: {
    root: 'qöşiq',
    partOfSpeech: 'ot',
    definition: 'Kuyga solingan she’riy asar, ashula.',
    exampleNewLatin: 'Xalqimizning milliy qöşiqlari yangradi.'
  },
  qöşimça: {
    root: 'qöşimça',
    partOfSpeech: 'ot',
    definition: 'Söz özagiga qöşilib, yangi ma’no yoki grammatik shakl yasovçi bo‘lak.',
    exampleNewLatin: 'Morfologik tahlilçi söz özagini va qöşimçalarini aniqlaydi.'
  },
  öqi: {
    root: 'öqi',
    partOfSpeech: 'fe’l',
    definition: 'Yozilgan matnni közdan keçirib tushunmoq yoki ovoz çiqarib talaffuz etmoq; bilim olmoq.',
    exampleNewLatin: 'Ovozli tarjimon matnni aniq talaffuz bilan öqiydi.'
  },
  öqituvçi: {
    root: 'öqituvçi',
    partOfSpeech: 'ot',
    definition: 'Ta’lim muassasasida öquvçilarga bilim beruvçi ustoz, murabbiy.',
    exampleNewLatin: 'Öqituvçi darsda yangi alifbo harflarini tushuntirdi.'
  },
  öquvçi: {
    root: 'öquvçi',
    partOfSpeech: 'ot',
    definition: 'Maktab yoki kursda ta’lim olayotgan yosh, tinglovçi.',
    exampleNewLatin: 'Öquvçilar interaktiv maşqlarni qiziqiş bilan bajardilar.'
  },
  örgan: {
    root: 'örgan',
    partOfSpeech: 'fe’l',
    definition: 'Bilim, malaka yoki könikmani özlaştirmoq, tadqiq etmoq.',
    exampleNewLatin: 'Yangi alifboni interaktiv maşqlar orqali tez örganiş mumkin.'
  },
  örin: {
    root: 'örin',
    partOfSpeech: 'ot',
    definition: 'Narsa yoki şaxs joylaşgan makon, mavqe, daraja.',
    exampleNewLatin: 'Har bir harfning alifboda öz örni bor.'
  },
  örtoq: {
    root: 'örtoq',
    partOfSpeech: 'ot',
    definition: 'Yaqin döst, hamkor, tengdoş.',
    exampleNewLatin: 'Kitob — insonning eng sodiq örtoğidir.'
  },
  ötkaz: {
    root: 'ötkaz',
    partOfSpeech: 'fe’l',
    definition: 'Bir holatdan yoki joydan ikkinçisiga köçirmoq, amalga oşirmoq.',
    exampleNewLatin: 'Matnni eski yozuvdan yangi 2026 alifboga ötkaziş juda oson.'
  },
  öy: {
    root: 'öy',
    partOfSpeech: 'ot',
    definition: 'Xayol, fikr, mulohaza.',
    exampleNewLatin: 'Chuqur öy va tafakkur aniq nutqni shakllantiradi.'
  },
  öyin: {
    root: 'öyin',
    partOfSpeech: 'ot',
    definition: 'Dam oliş, musobaqa yoki örganiş maqsadidagi qoidali mashğulot.',
    exampleNewLatin: 'Ta’limiy öyinlar yoshlarning xotirasini mustahkamlaydi.'
  },
  öz: {
    root: 'öz',
    partOfSpeech: 'olmosh',
    definition: 'Şaxs yoki predmetning aynan öziga tegishlilikni bildiruvçi özlik olmoşi.',
    exampleNewLatin: 'Har bir xalq öz ona tilini asrab-avaylaydi.'
  },
  özgar: {
    root: 'özgar',
    partOfSpeech: 'fe’l',
    definition: 'Yangilanmoq, boshqa shakl yoki holatga ötmöq.',
    exampleNewLatin: '2026-yilda alifbodagi 4 ta harf shakli ijobiy tomonga özgardi.'
  },
  özlaştir: {
    root: 'özlaştir',
    partOfSpeech: 'fe’l',
    definition: 'Bilim yoki tajribani puxta egallab, öz mulkiga aylantirmoq.',
    exampleNewLatin: 'Foydalanuvçilar yangi qoidalarni tez özlaştirmoqdalar.'
  },
  ögir: {
    root: 'ögir',
    partOfSpeech: 'fe’l',
    definition: 'Bir tildan yoki yozuvdan boshqa til/yozuvga tarjima qilmoq, aylantirmoq.',
    exampleNewLatin: 'Ilova kirill va eski lotin matnlarini yangi alifboga darhol ögiradi.'
  },
  döst: {
    root: 'döst',
    partOfSpeech: 'ot',
    definition: 'Yaqin maslakdoş, sodiq hamroh.',
    exampleNewLatin: 'Çin döst qiyin kunda bilinadi.'
  },
  gözal: {
    root: 'gözal',
    partOfSpeech: 'sifat',
    definition: 'Husni va shakli mukammal, körkam, maftunkor.',
    exampleNewLatin: 'Özbekistonning gözal tabiatini hamma sevadi.'
  },
  töğri: {
    root: 'töğri',
    partOfSpeech: 'sifat',
    definition: 'Qoidaga va haqiqatga mos, xatosiz, adolatli.',
    exampleNewLatin: 'Töğri yozuv — savodxonlik asosi.'
  },
  öğil: {
    root: 'öğil',
    partOfSpeech: 'ot',
    definition: 'Ota-onaning erkak jinsli farzandi.',
    exampleNewLatin: 'Aqlli öğil-qizlar Vatan iftixoridir.'
  },
  boğ: {
    root: 'boğ',
    partOfSpeech: 'ot',
    definition: 'Mevali daraxtlar va gullar ekilgan obod maydon.',
    exampleNewLatin: 'Bahorda boğlar oppoq gullargaady burkandi.'
  },
  boğbon: {
    root: 'boğbon',
    partOfSpeech: 'ot',
    definition: 'Boğ yaratuvçi va daraxtlarni parvarişlovçi mutaxassis.',
    exampleNewLatin: 'Mehnatkaş boğbon möl hosil yetishtirdi.'
  },
  boğça: {
    root: 'boğça',
    partOfSpeech: 'ot',
    definition: 'Kichik boğ yoki maktabgaça ta’lim muassasasi.',
    exampleNewLatin: 'Bolalar boğçasida yangi harflar rasm orqali örgatiladi.'
  },
  toğ: {
    root: 'toğ',
    partOfSpeech: 'ot',
    definition: 'Yer yuzasidan baland kötarilgan yirik relyef shakli.',
    exampleNewLatin: 'Çimyon toğlari qişda oppoq qor bilan qoplanadi.'
  },
  yomğir: {
    root: 'yomğir',
    partOfSpeech: 'ot',
    definition: 'Bulutlardan tomçi shaklida yog‘adigan atmosfera yog‘ini.',
    exampleNewLatin: 'Bahorgi yomğirdan söng havo musaffo böldi.'
  },
  yiğiliş: {
    root: 'yiğiliş',
    partOfSpeech: 'ot',
    definition: 'Masalalarni muhokama qiliş uçun ötkaziladigan majlis, anjuman.',
    exampleNewLatin: 'Tilşunoslar yiğilişida yangi alifbo qöllanmasi tasdiqlandi.'
  },
  ğalaba: {
    root: 'ğalaba',
    partOfSpeech: 'ot',
    definition: 'Musobaqa, mehnat yoki kurashda qözonilgan yutuq, zafar.',
    exampleNewLatin: 'Bilim va mehnat insonni ğalabaga yetaklaydi.'
  },
  ğayrat: {
    root: 'ğayrat',
    partOfSpeech: 'ot',
    definition: 'Faoliyatdagi jo‘shqinlik, shijoat, intiliş kuchi.',
    exampleNewLatin: 'Yoshlar katta ğayrat bilan yangi bilimlarni egallamoqda.'
  },
  ğoya: {
    root: 'ğoya',
    partOfSpeech: 'ot',
    definition: 'Inson ongidagi yetakçi fikr, maqsad va konsepsiya.',
    exampleNewLatin: 'Yagona harflar ğoyasi yozuvni ixchamlashtirdi.'
  },
  ğurur: {
    root: 'ğurur',
    partOfSpeech: 'ot',
    definition: 'Iftixor tuyğusi, qadr-qimmat hissi.',
    exampleNewLatin: 'Ona tilimiz bizning milliy ğururimizdir.'
  },
  luğat: {
    root: 'luğat',
    partOfSpeech: 'ot',
    definition: 'Tildagi sözlarni ma’nosi, imlosi yoki boshqa tildagi tarjimasi bilan jamlagan kitob/baza.',
    exampleNewLatin: 'Raqamli luğat har qanday özbekça sözni tahlil qila oladi.'
  },
  soğlom: {
    root: 'soğlom',
    partOfSpeech: 'sifat',
    definition: 'Salomatligi mustahkam, darddan xoli, barkamol.',
    exampleNewLatin: 'Soğlom tanda — soğlom aql.'
  },
  tuğil: {
    root: 'tuğil',
    partOfSpeech: 'fe’l',
    definition: 'Dunyoga kelmoq, paydo bölmoq.',
    exampleNewLatin: 'Buyuk allomalar shu muqaddas zaminda tuğilgan.'
  },
  uluğ: {
    root: 'uluğ',
    partOfSpeech: 'sifat',
    definition: 'Martabasi, qadri va ahamiyati yuksak, buyuk.',
    exampleNewLatin: 'Ustozlik — dunyodagi eng uluğ kasb.'
  },
  yoruğ: {
    root: 'yoruğ',
    partOfSpeech: 'sifat',
    definition: 'Nurga tölgan, charoğon, ravşan.',
    exampleNewLatin: 'Ilmli insonning kelajagi yoruğ böladi.'
  },
  şahar: {
    root: 'şahar',
    partOfSpeech: 'ot',
    definition: 'Aholisi ziç yashaydigan yirik sanoat, savdo va madaniyat markazi.',
    exampleNewLatin: 'Samarqand va Toshkent — qadimiy va zamonaviy şaharlardir.'
  },
  peşlavha: {
    root: 'peşlavha',
    partOfSpeech: 'ot',
    definition: 'Muassasa yoki bino peshtoqiga osilgan nom yozuvi.',
    exampleNewLatin: 'Köçadagi peşlavhalar yangi 2026 alifboda yozildi.'
  },
  iş: {
    root: 'iş',
    partOfSpeech: 'ot',
    definition: 'Mehnat faoliyati, vazifa, yumuş.',
    exampleNewLatin: 'Yangi dastur barça sözlar bilan tez va sifatli işlaydi.'
  },
  işla: {
    root: 'işla',
    partOfSpeech: 'fe’l',
    definition: 'Mehnat qilmoq, faoliyat yuritmoq, amal qilmoq.',
    exampleNewLatin: 'Lug‘at tizimi özbek tilidagi barça sözlar bilan mukammal işlaydi.'
  },
  çiroyli: {
    root: 'çiroyli',
    partOfSpeech: 'sifat',
    definition: 'Körkam, gözal, estetik jihatdan yoqimli.',
    exampleNewLatin: 'Çiroyli yozuv — inson husni.'
  },
  çöqqi: {
    root: 'çöqqi',
    partOfSpeech: 'ot',
    definition: 'Toğning eng baland nuqtasi; ilm va ijoddagi yuksak marra.',
    exampleNewLatin: 'Yoshlar ilm-fan çöqqilarini egallamoqda.'
  },
  barça: {
    root: 'barça',
    partOfSpeech: 'olmosh',
    definition: 'Hamma, butun, istisnosiz jami.',
    exampleNewLatin: 'Ilova özbek tilidagi barça sözlar bilan işlaş imkoniyatiga ega.'
  },
  'ma’no': {
    root: 'ma’no',
    partOfSpeech: 'ot',
    definition: 'Söz yoki iboraning ichki mazmuni, mohiyati.',
    exampleNewLatin: 'Har bir sözning lug‘aviy va ko‘chma ma’nosi bor.'
  },
  'ma’lumot': {
    root: 'ma’lumot',
    partOfSpeech: 'ot',
    definition: 'Biror narsa-hodisa haqidagi xabar, axborot yoki bilim darajasi.',
    exampleNewLatin: 'Söz haqidagi töliq ma’lumot ekranda aks etdi.'
  },
  'ta’lim': {
    root: 'ta’lim',
    partOfSpeech: 'ot',
    definition: 'Bilim va malaka beriş tizimi, öqitiş jarayoni.',
    exampleNewLatin: 'Sifatli ta’lim jamiyat taraqqiyotining poydevoridir.'
  },
  'e’lon': {
    root: 'e’lon',
    partOfSpeech: 'ot',
    definition: 'Köpchilik e’tiboriga yetkaziladigan rasmiy xabar yoki bildiriş.',
    exampleNewLatin: 'Yangi imlo tanlovi haqida e’lon berildi.'
  },
  'san’at': {
    root: 'san’at',
    partOfSpeech: 'ot',
    definition: 'Badiiy ijod va yuksak mahorat sohasi.',
    exampleNewLatin: 'Notiqlik va xattotlik — uluğ san’atdir.'
  },
  kitob: {
    root: 'kitob',
    partOfSpeech: 'ot',
    definition: 'Bilim, badiiy asar yoki ma’lumotlarni jamlagan bosma yoxud raqamli nashr.',
    exampleNewLatin: 'Kitob — bilim manbai.'
  },
  maktab: {
    root: 'maktab',
    partOfSpeech: 'ot',
    definition: 'Yosh avlodga umumiy ta’lim va tarbiya beruvçi öquv dargohi.',
    exampleNewLatin: 'Maktab darsliklari yangi alifboda chop etilmoqda.'
  },
  til: {
    root: 'til',
    partOfSpeech: 'ot',
    definition: 'Kişilar örtasidagi eng muhim aloqa va fikr almaşuv vositasi.',
    exampleNewLatin: 'Özbek tili boy lug‘at boyligiga va go‘zal ohangga ega.'
  },
  alifbo: {
    root: 'alifbo',
    partOfSpeech: 'ot',
    definition: 'Muayyan tildagi harflarning qat’iy tartibda joylashtirilgan tizimi.',
    exampleNewLatin: '2026-yilgi yangi özbek alifbosida 28 ta harf va 1 ta tutuq belgisi bor.'
  },
  matn: {
    root: 'matn',
    partOfSpeech: 'ot',
    definition: 'Yozma yoki bosma shakldagi bog‘lanishli nutq parchasi.',
    exampleNewLatin: 'Kiritilgan matn soniyalar ichida yangi alifboga ögirildi.'
  },
  tarjima: {
    root: 'tarjima',
    partOfSpeech: 'ot',
    definition: 'Bir tildagi yoki yozuvdagi matnni ikkinçi til/yozuvga ögiriş jarayoni va natijasi.',
    exampleNewLatin: 'Ovozli va yozma tarjima bir vaqtda amalga oşiriladi.'
  },
  integratsiya: {
    root: 'integratsiya',
    partOfSpeech: 'ot',
    definition: 'Qismlarni va tizimlarni o‘zaro uyg‘unlashtirib yagona butunlikka birlashtirish.',
    exampleNewLatin: 'Sun’iy intellekt va morfologik baza integratsiyasi kuchaytirildi.'
  },
  tani: {
    root: 'tani',
    partOfSpeech: 'fe’l',
    definition: 'Belgilariga ko‘ra bilib olmoq, aniqlamoq, farqlamoq.',
    exampleNewLatin: 'Tizim özbek tilidagi öazak va qöşimçalarni xatosiz taniydi.'
  },
  kuçaytir: {
    root: 'kuçaytir',
    partOfSpeech: 'fe’l',
    definition: 'Quvvatini, samaradorligini yoki ta’sir darajasini oşirmoq.',
    exampleNewLatin: 'Lug‘at va imlo tekşiruvçi integratsiyasi yanada kuçaytirildi.'
  }
};

/**
 * Strips productive Uzbek suffixes from a normalized word and finds its stem and suffix chain.
 */
export function decomposeUzbekWord(normalizedWord: string): {
  stem: string;
  reformedStem: string;
  suffixes: Array<{ suffix: string; meaning: string }>;
  wasInformalStemRestored: boolean;
} {
  const clean = normalizedWord
    .trim()
    .replace(/^[^A-Za-zÖöĞğŞşÇç’]+|[^A-Za-zÖöĞğŞşÇç’]+$/g, '');
  const lower = clean.toLowerCase();

  // Direct whole-word check in INFORMAL_TO_2026_STEMS
  if (INFORMAL_TO_2026_STEMS[lower]) {
    const restored = INFORMAL_TO_2026_STEMS[lower];
    return {
      stem: lower,
      reformedStem: restored,
      suffixes: [],
      wasInformalStemRestored: restored !== lower
    };
  }

  // Direct whole-word check in UZBEK_ROOT_LEXICON
  if (UZBEK_ROOT_LEXICON[lower]) {
    return {
      stem: lower,
      reformedStem: lower,
      suffixes: [],
      wasInformalStemRestored: false
    };
  }

  // Iteratively strip up to 3 layers of agglutinative suffixes from the right
  let working = lower;
  const foundSuffixes: Array<{ suffix: string; meaning: string }> = [];

  for (let pass = 0; pass < 3; pass++) {
    let matchedInPass = false;
    for (const item of UZBEK_SUFFIXES) {
      if (working.length > item.suffix.length + 1 && working.endsWith(item.suffix)) {
        const candidateStem = working.slice(0, working.length - item.suffix.length);
        // Check if candidateStem is a known root or informal stem, or at least 2 chars with a vowel
        if (
          INFORMAL_TO_2026_STEMS[candidateStem] ||
          UZBEK_ROOT_LEXICON[candidateStem] ||
          (candidateStem.length >= 3 && /[aeiouö]/.test(candidateStem))
        ) {
          foundSuffixes.unshift(item);
          working = candidateStem;
          matchedInPass = true;
          break;
        }
      }
    }
    if (!matchedInPass) break;
    if (INFORMAL_TO_2026_STEMS[working] || UZBEK_ROOT_LEXICON[working]) {
      break;
    }
  }

  const mappedStem = INFORMAL_TO_2026_STEMS[working] || working;
  return {
    stem: working,
    reformedStem: mappedStem,
    suffixes: foundSuffixes,
    wasInformalStemRestored: mappedStem !== working
  };
}
