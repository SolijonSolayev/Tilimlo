import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeToNewUzbekLatin,
  cyrillicToNewUzbekLatin,
  convertFromNewUzbekLatin,
  detectScript,
  checkUzbekTextErrors,
  applyAllOrthographyFixes,
  analyzeUzbekText,
  syllabifyUzbekWord,
  analyzeSingleUzbekWord
} from './uzbekLinguistics';
import { buildGraphicalMorphemeChain } from './uzbekGraphicalMorphology';

test('normalizeToNewUzbekLatin converts O\', G\', Sh, Ch accurately per 2026 guide', () => {
  const input =
    "O'zbekiston Respublikasi Prezidenti Shavkat Mirziyoyev yangi alifbo to'g'risidagi qonunni imzoladi. Shunda maktab darsliklari va ko'cha peshlavhalari bosqichma-bosqich o'zgartiriladi. Chiroyli yozuv - inson husni.";
  const expected =
    'Özbekiston Respublikasi Prezidenti Şavkat Mirziyoyev yangi alifbo töğrisidagi qonunni imzoladi. Şunda maktab darsliklari va köça peşlavhalari bosqiçma-bosqiç özgartiriladi. Çiroyli yozuv - inson husni.';
  assert.equal(normalizeToNewUzbekLatin(input), expected);
});

test('recognizes informal apostrophe-less Uzbek words and suffix chains (sozlarni -> sözlarni, kop -> köp)', () => {
  const informal = "O'zbek tilidagi barcha sozlarni va kop qoshimchalarni togri taniydi.";
  const converted = applyAllOrthographyFixes(informal);
  assert.equal(converted, 'Özbek tilidagi barça sözlarni va köp qöşimçalarni töğri taniydi.');
});

test('normalizeToNewUzbekLatin preserves tutuq belgisi (’ U+2019) in Arabic loanwords', () => {
  assert.equal(normalizeToNewUzbekLatin("ma'no va ta'lim"), 'ma’no va ta’lim');
  assert.equal(normalizeToNewUzbekLatin("san`at va e'lon"), 'san’at va e’lon');
  assert.equal(normalizeToNewUzbekLatin("qoʻshiq va shu'la"), 'qöşiq va şu’la');
});

test('cyrillicToNewUzbekLatin handles Е, Ё, Ц, Ю, Я, Э, Ъ nuances', () => {
  assert.equal(cyrillicToNewUzbekLatin('Елкан ва тайёр беш эшик'), 'Yelkan va tayyor beş eşik');
  assert.equal(cyrillicToNewUzbekLatin('Федерация ва Цирк'), 'Federatsiya va Sirk');
  assert.equal(cyrillicToNewUzbekLatin('Юлдуз ва яхши ёмғир'), 'Yulduz va yaxşi yomğir');
  assert.equal(cyrillicToNewUzbekLatin('Маъно ва съезд'), 'Ma’no va s’yezd');
});

test('convertFromNewUzbekLatin converts back to Old Latin and Cyrillic', () => {
  const newLatin = 'Özbekiston ğalabasi va çiroyli qöşiq';
  assert.equal(
    convertFromNewUzbekLatin(newLatin, 'old-latin'),
    'O‘zbekiston g‘alabasi va chiroyli qo‘shiq'
  );
  assert.equal(
    convertFromNewUzbekLatin(newLatin, 'cyrillic'),
    'Ўзбекистон ғалабаси ва чиройли қўшиқ'
  );
});

test('detectScript identifies old-latin, cyrillic, new-latin-2026, and mixed', () => {
  assert.equal(detectScript("O'zbekiston shahar"), 'old-latin');
  assert.equal(detectScript('Ўзбекистон шаҳар'), 'cyrillic');
  assert.equal(detectScript('Özbekiston şahar'), 'new-latin-2026');
  assert.equal(detectScript('Ўзбекистон shahar'), 'mixed');
});

test('checkUzbekTextErrors and applyAllOrthographyFixes detect and repair inflected issues', () => {
  const sample = "Xurmatli o'qituvchilarimiz muhim elonlarni va malumotlarni berdi.";
  const issues = checkUzbekTextErrors(sample);
  assert.ok(issues.length >= 4);
  const fixed = applyAllOrthographyFixes(sample);
  assert.equal(fixed, 'Hurmatli öqituvçilarimiz muhim e’lonlarni va ma’lumotlarni berdi.');
});

test('analyzeSingleUzbekWord decomposes arbitrary inflected Uzbek words into root and suffixes', () => {
  const morph = analyzeSingleUzbekWord('sozlarni');
  assert.equal(morph.newLatin, 'sözlarni');
  assert.equal(morph.root, 'söz');
  assert.ok(morph.suffixes.length >= 1);
  assert.equal(morph.cyrillic, 'сўзларни');
});

test('buildGraphicalMorphemeChain splits compound and derived words into sequential atomic morphemes', () => {
  const chain1 = buildGraphicalMorphemeChain('sozlarimizga');
  assert.equal(chain1.newLatin, 'sözlarimizga');
  assert.deepEqual(
    chain1.morphemes.map((m) => m.text),
    ['söz', '-lar', '-imiz', '-ga']
  );

  const chain2 = buildGraphicalMorphemeChain("o'qituvchilarimizdan");
  assert.equal(chain2.newLatin, 'öqituvçilarimizdan');
  assert.deepEqual(
    chain2.morphemes.map((m) => m.text),
    ['öqi', '-t', '-uvçi', '-lar', '-imiz', '-dan']
  );
});

test('analyzeUzbekText computes replacement stats and syllable counts', () => {
  const analysis = analyzeUzbekText("O'zbekistonning go'zal shaharlari va chiroyli bog'lari.");
  assert.equal(analysis.wordCount, 6);
  assert.ok(analysis.totalReplacements >= 5);
  assert.ok(analysis.syllableCount >= 15);
  assert.equal(syllabifyUzbekWord('Özbekiston'), 'Öz-be-kis-ton');
});

