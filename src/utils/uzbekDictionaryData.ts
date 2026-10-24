/**
 * Curated Tri-Script Uzbek Dictionary (Eski Lotin, Yangi 2026 Lotin, Kirill),
 * 28-Letter Alphabet Reference, and Interactive Exercise Bank.
 */

export interface DictionaryEntry {
  id: string;
  newLatin: string;
  oldLatin: string;
  cyrillic: string;
  syllables: string;
  partOfSpeech: 'ot' | 'sifat' | 'fe’l' | 'ravish' | 'olmosh';
  featuredLetter: 'Ö' | 'Ğ' | 'Ş' | 'Ç' | '’' | 'Umumiy';
  definition: string;
  exampleNewLatin: string;
  exampleOldLatin: string;
}

export interface AlphabetLetterInfo {
  number: number;
  upper: string;
  lower: string;
  oldLatin: string;
  cyrillic: string;
  name: string;
  ipa: string;
  isReformed: boolean;
  exampleNew: string;
  exampleOld: string;
  note?: string;
}

export interface ExerciseQuestion {
  id: string;
  mode: 'multiple-choice' | 'typing' | 'spot-error';
  prompt: string;
  sourceText: string;
  correctAnswer: string;
  options?: string[];
  wrongWord?: string;
  explanation: string;
  targetLetter: 'Ö' | 'Ğ' | 'Ş' | 'Ç' | '’';
}

export const INITIAL_DICTIONARY: DictionaryEntry[] = [
  {
    id: 'dict-1',
    newLatin: 'Özbekiston',
    oldLatin: 'O‘zbekiston',
    cyrillic: 'Ўзбекистон',
    syllables: 'Öz-be-kis-ton',
    partOfSpeech: 'ot',
    featuredLetter: 'Ö',
    definition: 'Markaziy Osiyoning markaziy qismida joylaşgan mustaqil davlat, Vatanimiz.',
    exampleNewLatin: 'Özbekiston Respublikasida yangi lotin alifbosi qabul qilindi.',
    exampleOldLatin: "O'zbekiston Respublikasida yangi lotin alifbosi qabul qilindi."
  },
  {
    id: 'dict-2',
    newLatin: 'öqituvçi',
    oldLatin: 'o‘qituvchi',
    cyrillic: 'ўқитувчи',
    syllables: 'ö-qi-tuv-çi',
    partOfSpeech: 'ot',
    featuredLetter: 'Ö',
    definition: 'Maktab yoki oliy öquv yurtida yoshlarga ta’lim va tarbiya beruvçi mutaxassis, ustoz.',
    exampleNewLatin: 'Mahoratli öqituvçi darsda yangi imlo qoidalarini tuşuntirdi.',
    exampleOldLatin: "Mahoratli o'qituvchi darsda yangi imlo qoidalarini tushuntirdi."
  },
  {
    id: 'dict-3',
    newLatin: 'töğri',
    oldLatin: 'to‘g‘ri',
    cyrillic: 'тўғри',
    syllables: 'töğ-ri',
    partOfSpeech: 'sifat',
    featuredLetter: 'Ğ',
    definition: 'Haqiqatga va qoidaga mos, xatosiz, adolatli.',
    exampleNewLatin: 'Çiroyli va töğri yozuv — inson madaniyatining közgusidir.',
    exampleOldLatin: "Chiroyli va to'g'ri yozuv — inson madaniyatining ko'zgusidir."
  },
  {
    id: 'dict-4',
    newLatin: 'ğalaba',
    oldLatin: 'g‘alaba',
    cyrillic: 'ғалаба',
    syllables: 'ğa-la-ba',
    partOfSpeech: 'ot',
    featuredLetter: 'Ğ',
    definition: 'Kurash, musobaqa yoki mehnat jarayonida erişilgan yutuq, zafar.',
    exampleNewLatin: 'Ilm-fan yöli mamlakatni buyuk ğalabalarga yetaklaydi.',
    exampleOldLatin: "Ilm-fan yo'li mamlakatni buyuk g'alabalarga yetaklaydi."
  },
  {
    id: 'dict-5',
    newLatin: 'şahar',
    oldLatin: 'shahar',
    cyrillic: 'шаҳар',
    syllables: 'şa-har',
    partOfSpeech: 'ot',
    featuredLetter: 'Ş',
    definition: 'Aholisi ziç joylaşgan yirik ma’muriy, sanoat, savdo va madaniyat markazi.',
    exampleNewLatin: 'Köça peşlavhalari va şahar xaritasi yangi alifboda yozildi.',
    exampleOldLatin: "Ko'cha peshlavhalari va shahar xaritasi yangi alifboda yozildi."
  },
  {
    id: 'dict-6',
    newLatin: 'qöşiq',
    oldLatin: 'qo‘shiq',
    cyrillic: 'қўшиқ',
    syllables: 'qö-şiq',
    partOfSpeech: 'ot',
    featuredLetter: 'Ş',
    definition: 'Kuyga solingan she’riy asar, ashula.',
    exampleNewLatin: 'Milliy qöşiqlarimiz xalqimizning qalb sadolarini ifodalaydi.',
    exampleOldLatin: "Milliy qo'shiqlarimiz xalqimizning qalb sadolarini ifodalaydi."
  },
  {
    id: 'dict-7',
    newLatin: 'çiroyli',
    oldLatin: 'chiroyli',
    cyrillic: 'чиройли',
    syllables: 'çi-roy-li',
    partOfSpeech: 'sifat',
    featuredLetter: 'Ç',
    definition: 'Körkam, gözal, kishiga estetik zavq bağışlaydigan.',
    exampleNewLatin: 'Çiroyli yozuv — inson husni.',
    exampleOldLatin: 'Chiroyli yozuv — inson husni.'
  },
  {
    id: 'dict-8',
    newLatin: 'köça',
    oldLatin: 'ko‘cha',
    cyrillic: 'кўча',
    syllables: 'kö-ça',
    partOfSpeech: 'ot',
    featuredLetter: 'Ç',
    definition: 'Şahar yoki qişloqda ikki qator binolar oralığidagi qatnov yöli.',
    exampleNewLatin: 'Toshkentning keng köçalarida yoruğ çiroqlar porlaydi.',
    exampleOldLatin: "Toshkentning keng ko'chalarida yorug' chiroqlar porlaydi."
  },
  {
    id: 'dict-9',
    newLatin: 'ma’no',
    oldLatin: 'ma’no',
    cyrillic: 'маъно',
    syllables: 'ma’-no',
    partOfSpeech: 'ot',
    featuredLetter: '’',
    definition: 'Söz, ibora yoki nutqning ichki mazmuni, mohiyati.',
    exampleNewLatin: 'Har bir sözning öz örni va çuqur ma’nosi bor.',
    exampleOldLatin: "Har bir so'zning o'z o'rni va chuqur ma’nosi bor."
  },
  {
    id: 'dict-10',
    newLatin: 'ta’lim',
    oldLatin: 'ta’lim',
    cyrillic: 'таълим',
    syllables: 'ta’-lim',
    partOfSpeech: 'ot',
    featuredLetter: '’',
    definition: 'Bilim beriş, öqitiş va malaka hosil qiliş tizimi.',
    exampleNewLatin: 'Zamonaviy ta’lim tizimi yoshlarning tafakkurini boyitadi.',
    exampleOldLatin: 'Zamonaviy ta’lim tizimi yoshlarning tafakkurini boyitadi.'
  },
  {
    id: 'dict-11',
    newLatin: 'ğoya',
    oldLatin: 'g‘oya',
    cyrillic: 'ғоя',
    syllables: 'ğo-ya',
    partOfSpeech: 'ot',
    featuredLetter: 'Ğ',
    definition: 'Inson tafakkurida tuğilgan asosiy fikr, maqsad va rejalar majmui.',
    exampleNewLatin: 'Yangi alifbo ğoyasi turkiy tillar yaqinligini mustahkamlaydi.',
    exampleOldLatin: "Yangi alifbo g'oyasi turkiy tillar yaqinligini mustahkamlaydi."
  },
  {
    id: 'dict-12',
    newLatin: 'özgarış',
    oldLatin: 'o‘zgarish',
    cyrillic: 'ўзгариш',
    syllables: 'öz-ga-rış',
    partOfSpeech: 'ot',
    featuredLetter: 'Ö',
    definition: 'Bir holatdan ikkinçi yangi holatga ötiş, yangilaniş jarayoni.',
    exampleNewLatin: 'Til va imlodagi ijobiy özgarışlar raqamli texnologiyalarni osonlaştiradi.',
    exampleOldLatin: "Til va imlodagi ijobiy o'zgarishlar raqamli texnologiyalarni osonlashtiradi."
  },
  {
    id: 'dict-13',
    newLatin: 'peşlavha',
    oldLatin: 'peshlavha',
    cyrillic: 'пешлавҳа',
    syllables: 'peş-lav-ha',
    partOfSpeech: 'ot',
    featuredLetter: 'Ş',
    definition: 'Bino, muassasa yoki dökon kiriş qismiga örnatilgan nom yozuvi.',
    exampleNewLatin: 'Barcha davlat idoralari peşlavhalari bosqiçma-bosqiç yangilanadi.',
    exampleOldLatin: 'Barcha davlat idoralari peshlavhalari bosqichma-bosqich yangilanadi.'
  },
  {
    id: 'dict-14',
    newLatin: 'çöqqi',
    oldLatin: 'cho‘qqi',
    cyrillic: 'чўққи',
    syllables: 'çöq-qi',
    partOfSpeech: 'ot',
    featuredLetter: 'Ç',
    definition: 'Toğ yoki tepalikning eng baland, uşli qismi; yuksak marra.',
    exampleNewLatin: 'Bilimli yoshlar ilm-fan çöqqilarini zabt etadilar.',
    exampleOldLatin: "Bilimli yoshlar ilm-fan cho'qqilarini zabt etadilar."
  },
  {
    id: 'dict-15',
    newLatin: 'boğbon',
    oldLatin: 'bog‘bon',
    cyrillic: 'боғбон',
    syllables: 'boğ-bon',
    partOfSpeech: 'ot',
    featuredLetter: 'Ğ',
    definition: 'Boğ yaratuvçi va mevali daraxtlarni parvariş qiluvçi usta.',
    exampleNewLatin: 'Mehnatkaş boğbon kuzda şirin mevalardan möl hosil oldi.',
    exampleOldLatin: "Mehnatkash bog'bon kuzda shirin mevalardan mo'l hosil oldi."
  },
  {
    id: 'dict-16',
    newLatin: 'san’at',
    oldLatin: 'san’at',
    cyrillic: 'санъат',
    syllables: 'san’-at',
    partOfSpeech: 'ot',
    featuredLetter: '’',
    definition: 'Voqelikni badiiy obrazlar orqali aks ettiruvçi ijodiy faoliyat sohasi.',
    exampleNewLatin: 'Xattotlik va kitobat san’ati xalqimizning qadimiy merosidir.',
    exampleOldLatin: 'Xattotlik va kitobat san’ati xalqimizning qadimiy merosidir.'
  }
];

export const ALPHABET_2026_CHART: AlphabetLetterInfo[] = [
  { number: 1, upper: 'A', lower: 'a', oldLatin: 'A a', cyrillic: 'А а', name: 'a', ipa: '[ɑ, æ]', isReformed: false, exampleNew: 'Alifbo', exampleOld: 'Alifbo' },
  { number: 2, upper: 'B', lower: 'b', oldLatin: 'B b', cyrillic: 'Б б', name: 'be', ipa: '[b]', isReformed: false, exampleNew: 'Baxt', exampleOld: 'Baxt' },
  { number: 3, upper: 'D', lower: 'd', oldLatin: 'D d', cyrillic: 'Д д', name: 'de', ipa: '[d]', isReformed: false, exampleNew: 'Darslik', exampleOld: 'Darslik' },
  { number: 4, upper: 'E', lower: 'e', oldLatin: 'E e', cyrillic: 'Э э / Е е', name: 'e', ipa: '[e]', isReformed: false, exampleNew: 'Eşik', exampleOld: 'Eshik' },
  { number: 5, upper: 'F', lower: 'f', oldLatin: 'F f', cyrillic: 'Ф ф', name: 'ef', ipa: '[f]', isReformed: false, exampleNew: 'Fan', exampleOld: 'Fan' },
  { number: 6, upper: 'G', lower: 'g', oldLatin: 'G g', cyrillic: 'Г г', name: 'ge', ipa: '[g]', isReformed: false, exampleNew: 'Gulxan', exampleOld: 'Gulxan' },
  { number: 7, upper: 'H', lower: 'h', oldLatin: 'H h', cyrillic: 'Ҳ ҳ', name: 'he', ipa: '[h]', isReformed: false, exampleNew: 'Husn', exampleOld: 'Husn' },
  { number: 8, upper: 'I', lower: 'i', oldLatin: 'I i', cyrillic: 'И и', name: 'i', ipa: '[i, ɨ]', isReformed: false, exampleNew: 'Ilm', exampleOld: 'Ilm' },
  { number: 9, upper: 'J', lower: 'j', oldLatin: 'J j', cyrillic: 'Ж ж', name: 'je', ipa: '[dʒ, ʒ]', isReformed: false, exampleNew: 'Jamiyat', exampleOld: 'Jamiyat' },
  { number: 10, upper: 'K', lower: 'k', oldLatin: 'K k', cyrillic: 'К к', name: 'ka', ipa: '[k]', isReformed: false, exampleNew: 'Kitob', exampleOld: 'Kitob' },
  { number: 11, upper: 'L', lower: 'l', oldLatin: 'L l', cyrillic: 'Л л', name: 'el', ipa: '[l]', isReformed: false, exampleNew: 'Luğat', exampleOld: "Lug'at" },
  { number: 12, upper: 'M', lower: 'm', oldLatin: 'M m', cyrillic: 'М м', name: 'em', ipa: '[m]', isReformed: false, exampleNew: 'Maktab', exampleOld: 'Maktab' },
  { number: 13, upper: 'N', lower: 'n', oldLatin: 'N n', cyrillic: 'Н н', name: 'en', ipa: '[n]', isReformed: false, exampleNew: 'Nutq', exampleOld: 'Nutq' },
  { number: 14, upper: 'O', lower: 'o', oldLatin: 'O o', cyrillic: 'О о', name: 'o', ipa: '[ɒ]', isReformed: false, exampleNew: 'Ona', exampleOld: 'Ona' },
  { number: 15, upper: 'P', lower: 'p', oldLatin: 'P p', cyrillic: 'П п', name: 'pe', ipa: '[p]', isReformed: false, exampleNew: 'Peşlavha', exampleOld: 'Peshlavha' },
  { number: 16, upper: 'Q', lower: 'q', oldLatin: 'Q q', cyrillic: 'Қ қ', name: 'qa', ipa: '[q]', isReformed: false, exampleNew: 'Qonun', exampleOld: 'Qonun' },
  { number: 17, upper: 'R', lower: 'r', oldLatin: 'R r', cyrillic: 'Р р', name: 'er', ipa: '[r]', isReformed: false, exampleNew: 'Respublika', exampleOld: 'Respublika' },
  { number: 18, upper: 'S', lower: 's', oldLatin: 'S s', cyrillic: 'С с / Ц ц', name: 'es', ipa: '[s]', isReformed: false, exampleNew: 'Sirk', exampleOld: 'Sirk' },
  { number: 19, upper: 'T', lower: 't', oldLatin: 'T t', cyrillic: 'Т т', name: 'te', ipa: '[t]', isReformed: false, exampleNew: 'Töğri', exampleOld: "To'g'ri" },
  { number: 20, upper: 'U', lower: 'u', oldLatin: 'U u', cyrillic: 'У у', name: 'u', ipa: '[u]', isReformed: false, exampleNew: 'Ustoz', exampleOld: 'Ustoz' },
  { number: 21, upper: 'V', lower: 'v', oldLatin: 'V v', cyrillic: 'В в', name: 've', ipa: '[v, w]', isReformed: false, exampleNew: 'Vatan', exampleOld: 'Vatan' },
  { number: 22, upper: 'X', lower: 'x', oldLatin: 'X x', cyrillic: 'Х х', name: 'xa', ipa: '[χ]', isReformed: false, exampleNew: 'Xalq', exampleOld: 'Xalq' },
  { number: 23, upper: 'Y', lower: 'y', oldLatin: 'Y y', cyrillic: 'Й й', name: 'ye', ipa: '[j]', isReformed: false, exampleNew: 'Yulduz', exampleOld: 'Yulduz' },
  { number: 24, upper: 'Z', lower: 'z', oldLatin: 'Z z', cyrillic: 'З з', name: 'ze', ipa: '[z]', isReformed: false, exampleNew: 'Ziyo', exampleOld: 'Ziyo' },
  {
    number: 25,
    upper: 'Ö',
    lower: 'ö',
    oldLatin: 'O‘ o‘',
    cyrillic: 'Ў ў',
    name: 'ö',
    ipa: '[o, ɵ]',
    isReformed: true,
    exampleNew: 'Özbekiston',
    exampleOld: "O'zbekiston",
    note: 'Eski O‘ (o va bir tirnoq) örniga yagona diakritik Ö ö harfi qabul qilindi.'
  },
  {
    number: 26,
    upper: 'Ğ',
    lower: 'ğ',
    oldLatin: 'G‘ g‘',
    cyrillic: 'Ғ ғ',
    name: 'ğé',
    ipa: '[ʁ]',
    isReformed: true,
    exampleNew: 'Ğalaba',
    exampleOld: "G'alaba",
    note: 'Eski G‘ birikmasi örniga yagona Ğ ğ harfi joriy etildi.'
  },
  {
    number: 27,
    upper: 'Ş',
    lower: 'ş',
    oldLatin: 'Sh sh',
    cyrillic: 'Ш ш',
    name: 'şa',
    ipa: '[ʃ]',
    isReformed: true,
    exampleNew: 'Şavkat',
    exampleOld: 'Shavkat',
    note: 'Ikki harfli "Sh" digrafi yagona "Ş ş" harfiga almaştirildi.'
  },
  {
    number: 28,
    upper: 'Ç',
    lower: 'ç',
    oldLatin: 'Ch ch',
    cyrillic: 'Ч ч',
    name: 'ça',
    ipa: '[tʃ]',
    isReformed: true,
    exampleNew: 'Çiroyli',
    exampleOld: 'Chiroyli',
    note: 'Ikki harfli "Ch" digrafi yagona "Ç ç" harfiga almaştirildi.'
  }
];

export const SAMPLE_PRESETS = [
  {
    id: 'preset-law',
    title: '2026 Alifbo Qonuni (Qöllanmadan namuna)',
    scriptLabel: 'Eski Lotin → 2026 Lotin',
    text: "O'zbekiston Respublikasi Prezidenti Shavkat Mirziyoyev yangi alifbo to'g'risidagi qonunni imzoladi. Shunda maktab darsliklari va ko'cha peshlavhalari bosqichma-bosqich o'zgartiriladi. Chiroyli yozuv - inson husni."
  },
  {
    id: 'preset-informal',
    title: 'Apostrofsiz va qöşimçali sözlar (Morfologik tahlil)',
    scriptLabel: 'sozlarni → sözlarni',
    text: "O'zbek tilidagi barcha sozlar bilan ishlash mumkin. Hozir tizim kop sozlarni, qoshimchalarni, oqituvchilarimizni va togri malumotlarni avtomatik taniydi."
  },
  {
    id: 'preset-cyrillic',
    title: 'Kirill yozuvidan namuna (Nuanslar bilan)',
    scriptLabel: 'Kirill → 2026 Lotin',
    text: 'Ўзбекистон Республикасида янги лотин алифбоси таълим ва маънавият соҳасида катта ўзгаришларга йўл очади. Федерация ва цирк сўзларидаги ҳарфлар ҳам аниқ қоида асосида ёзилади.'
  },
  {
    id: 'preset-errors',
    title: 'Imlo xatolari bor matn (Tekşiruv uçun)',
    scriptLabel: 'Xatolarni topiş va töğrilaş',
    text: "Xурматли o'qituvchi bugun maktabda muhim elon va malumotlarni berdi. Shaxar ko'chalarida xamma haridorlar hursand bo'lib sayr qilmoqda."
  }
];

export const EXERCISE_QUESTIONS: ExerciseQuestion[] = [
  {
    id: 'ex-1',
    mode: 'multiple-choice',
    prompt: '2026-yilgi yangilangan özbek lotin alifbosida "O\'qituvchi" sözi qanday töğri yoziladi?',
    sourceText: "O'qituvchi",
    correctAnswer: 'Öqituvçi',
    options: ['Öqituvçi', 'O‘qituvçi', 'Öqituvchi', 'Uqituvçi'],
    explanation: '"O\'" harfi "Ö" ga, "ch" harflar birikmasi esa "ç" ga aylanadi: Öqituvçi.',
    targetLetter: 'Ö'
  },
  {
    id: 'ex-2',
    mode: 'multiple-choice',
    prompt: '"To\'g\'risidagi" sözining yangi 2026-yilgi imlo me’yoridagi shaklini tanlang:',
    sourceText: "to'g'risidagi",
    correctAnswer: 'töğrisidagi',
    options: ['töğrisidagi', 'tög‘risidagi', 'to‘ğrisidagi', 'tögrisidagi'],
    explanation: 'Sözdagi "o\'" -> "ö" va "g\'" -> "ğ" harflariga töliq almaştiriladi: töğrisidagi.',
    targetLetter: 'Ğ'
  },
  {
    id: 'ex-3',
    mode: 'multiple-choice',
    prompt: 'Kirill yozuvidagi "Қўшиқ ва шуъла" iborasi yangi alifboda qanday yoziladi?',
    sourceText: 'Қўшиқ ва шуъла',
    correctAnswer: 'Qöşiq va şu’la',
    options: ['Qöşiq va şu’la', 'Qo‘shiq va shu’la', 'Qöshiq va şula', 'Qöşiq va şöla'],
    explanation: 'Ў -> Ö, Ш -> Ş, Ъ (ayriş belgisi) esa tutuq belgisi (’ U+2019) sifatida saqlanadi: Qöşiq va şu’la.',
    targetLetter: 'Ş'
  },
  {
    id: 'ex-4',
    mode: 'multiple-choice',
    prompt: 'Yangi 2026-yilgi alifbo jadvalida jami neçta harf va neçta belgi mavjud?',
    sourceText: 'Alifbo tarkibi',
    correctAnswer: '28 ta harf va 1 ta tutuq belgisi (’)',
    options: [
      '28 ta harf va 1 ta tutuq belgisi (’)',
      '29 ta harf va 1 ta tutuq belgisi',
      '30 ta harf (ng harfi bilan)',
      '26 ta standart lotin harfi'
    ],
    explanation: '"ng" digrafi alohida harf sifatida alifbo jadvalidan çiqarildi; natijada 28 ta harf va 1 ta tutuq belgisi (’) qoldi.',
    targetLetter: 'Ç'
  },
  {
    id: 'ex-5',
    mode: 'typing',
    prompt: 'Quyidagi eski lotin yozuvidagi sözni 2026-yilgi yangi alifboda yozing:',
    sourceText: "ko'cha peshlavhalari",
    correctAnswer: 'köça peşlavhalari',
    explanation: "ko'cha -> köça (o' -> ö, ch -> ç), peshlavhalari -> peşlavhalari (sh -> ş).",
    targetLetter: 'Ç'
  },
  {
    id: 'ex-6',
    mode: 'typing',
    prompt: 'Kirill yozuvidagi sözni yangi 2026 lotin alifbosiga ögiring:',
    sourceText: 'Ўзбекистон ғалабаси',
    correctAnswer: 'Özbekiston ğalabasi',
    explanation: 'Ў -> Ö, ғ -> ğ: Özbekiston ğalabasi.',
    targetLetter: 'Ğ'
  },
  {
    id: 'ex-7',
    mode: 'typing',
    prompt: 'Eski yozuvdagi iborani yangi 2026 lotin standartida yozing:',
    sourceText: 'Chiroyli qo‘shiq',
    correctAnswer: 'Çiroyli qöşiq',
    explanation: 'Ch -> Ç, o‘ -> ö, sh -> ş: Çiroyli qöşiq.',
    targetLetter: 'Ş'
  },
  {
    id: 'ex-8',
    mode: 'spot-error',
    prompt: 'Jumlada yangi alifbo qoidasiga zid qolgan sözni topib, töğri shaklini tanlang: "Şunda maktab darsliklari bosqiçma-bosqiç o\'zgartiriladi."',
    sourceText: "Şunda maktab darsliklari bosqiçma-bosqiç o'zgartiriladi.",
    wrongWord: "o'zgartiriladi",
    correctAnswer: 'özgartiriladi',
    options: ['özgartiriladi', 'o‘zgartiriladi', 'uzgartiriladi', 'özkartiriladi'],
    explanation: '"o\'zgartiriladi" sözidagi eski "o\'" birikmasi yangi "ö" harfi bilan "özgartiriladi" deb yozilishi shart.',
    targetLetter: 'Ö'
  },
  {
    id: 'ex-9',
    mode: 'spot-error',
    prompt: 'Jumlada tutuq belgisi va harf islohoti xatosi bor sözni töğrilang: "Yangi qonun tög‘risidagi malumot e’lon qilindi."',
    sourceText: 'Yangi qonun tög‘risidagi malumot e’lon qilindi.',
    wrongWord: 'tög‘risidagi malumot',
    correctAnswer: 'töğrisidagi ma’lumot',
    options: [
      'töğrisidagi ma’lumot',
      'to‘g‘risidagi malumot',
      'töğrisidagi malumot',
      'tög‘risidagi ma’lumot'
    ],
    explanation: '"tög‘risidagi" sözida "g‘" -> "ğ" bölishi, "malumot" sözida esa tutuq belgisi (ma’lumot) qöyilişi lozim.',
    targetLetter: 'Ğ'
  }
];
