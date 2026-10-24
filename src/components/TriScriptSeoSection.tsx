import React, { useEffect, useState } from 'react';
import { Globe, Search, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';

export type ActiveSection =
  | 'translator'
  | 'morphology'
  | 'dictionary'
  | 'chat'
  | 'exercises'
  | 'guide';

interface TriScriptSeoSectionProps {
  activeTab: ActiveSection;
  onSelectQuery: (text: string) => void;
}

const SECTION_SEO_MAP: Record<
  ActiveSection,
  {
    title: string;
    description: string;
  }
> = {
  translator: {
    title: 'TilImlo — Yangi Özbek Alifbosi, Lotin va Kirill Tarjimoni hamda Imlo Tizimi',
    description:
      'TilImlo (ТилИмло) — 2026-yilgi yangilangan özbek lotin alifbosi (Ö, Ğ, Ş, Ç), eski lotin (O‘, G‘, Sh, Ch) va kirill (Ў, Ғ, Ш, Ч) matn va ovozli tarjimon hamda imlo tekşiruvçi.'
  },
  morphology: {
    title: 'Morfologik Tahlil (Özak va Qöşimçalar Grafik Sxemasi) — TilImlo',
    description:
      'TilImlo — Özbek tilidagi sözlarning özak, söz yasovçi, lug‘aviy shakl va sintaktik qöşimçalarini grafik bloklar hamda daraxt sxemasida tahlil qiluvçi tizim.'
  },
  dictionary: {
    title: 'Uç Yozuvli Özbek Tili Luğati — TilImlo (O‘zbekcha Lug‘at · ТилИмло Луғат)',
    description:
      'TilImlo — Özbek tilidagi barcha sözlarning 2026 Yangi Lotin, Eski Lotin va Kirill yozuvidagi shakli, özak-qöşimça tahlili va izohli luğati.'
  },
  chat: {
    title: 'AI Savol-Javob va Tilşunos Chatbot — TilImlo',
    description:
      'TilImlo — Özbek tilidagi erkin suhbat, savol-javob, insho yozish va 2026 alifbo maslahatçisi.'
  },
  exercises: {
    title: 'Interaktiv Imlo va Alifbo Maşqlari — TilImlo',
    description:
      'TilImlo — Yangilangan 2026-yilgi özbek lotin alifbosini (Ö, Ğ, Ş, Ç va ’) tez örganiş uçun interaktiv test va amaliy maşqlar.'
  },
  guide: {
    title: '2026 Yangi Özbek Alifbosi Qoidalari (28 Harf Jadvali) — TilImlo',
    description:
      'TilImlo — 2026-yil oktabr me’yoriy qoidalariga muvofiq 28 harfli yangi özbek lotin alifbosi jadvali, tutuq belgisi va kirilldan ögiriş qoidalari.'
  }
};

const TRI_SCRIPT_SEARCH_CLUSTERS = [
  {
    category: 'Asosiy tarjima va konvertatsiya (3 alifboda)',
    newLatin2026: 'Yangi özbek lotin alifbosiga ögiriş (Ö, Ğ, Ş, Ç)',
    oldLatin1995: 'Yangi o‘zbek lotin alifbosiga o‘girish (O‘, G‘, Sh, Ch)',
    cyrillic: 'Янги ўзбек лотин алифбосига ўгириш (Ў, Ғ, Ш, Ч)',
    sampleText:
      'O‘zbekiston Respublikasida ta’lim va ilm-fan rivojlanmoqda. Ўзбекистон Республикасида таълим ва илм-фан ривожланмоқда.'
  },
  {
    category: 'Imlo xatolarini tekşiriş va morfologiya',
    newLatin2026: 'Matndagi imlo xatolarini tekşiriş va söz özagini topiş',
    oldLatin1995: 'Matndagi imlo xatolarini tekshirish va so‘z o‘zagini topish',
    cyrillic: 'Матндаги имло хатоларини текшириш ва сўз ўзагини топиш',
    sampleText:
      'Bizning oqituvchilarimiz oquvchilarga kop foydali sozlarni va malumotlarni orgatishdi.'
  },
  {
    category: 'Izohli luğat va atamalar qidiruvi',
    newLatin2026: 'Özbek tili izohli va imlo luğati (3 yozuvda)',
    oldLatin1995: 'O‘zbek tili izohli va imlo lug‘ati (Lotin-Kirill)',
    cyrillic: 'Ўзбек тили изоҳли ва имло луғати (Лотин-Кирилл)',
    sampleText:
      'Ma’naviyat, ma’rifat, bağrikenglik va ğoya sözlarining yangi alifbodagi yozilişi.'
  }
];

const POPULAR_TRI_SCRIPT_KEYWORDS = [
  {
    new2026: 'Özbekiston',
    old1995: 'O‘zbekiston',
    cyr: 'Ўзбекистон'
  },
  {
    new2026: 'Öqituvçilarimizga',
    old1995: 'O‘qituvchilarimizga',
    cyr: 'Ўқитувчиларимизга'
  },
  {
    new2026: 'Ma’lumotnoma',
    old1995: 'Ma’lumotnoma',
    cyr: 'Маълумотнома'
  },
  {
    new2026: 'Böğoz va ğoya',
    old1995: 'Bo‘g‘oz va g‘oya',
    cyr: 'Бўғоз ва ғоя'
  },
  {
    new2026: 'Şaharlararo',
    old1995: 'Shaharlararo',
    cyr: 'Шаҳарлараро'
  }
];

export const TriScriptSeoSection: React.FC<TriScriptSeoSectionProps> = React.memo(({
  activeTab,
  onSelectQuery
}) => {
  const [showExtendedClusters, setShowExtendedClusters] = useState(false);

  // Dynamically synchronize document title, meta description, OpenGraph, and canonical URL silently in <head>
  useEffect(() => {
    const meta = SECTION_SEO_MAP[activeTab] || SECTION_SEO_MAP.translator;
    document.title = meta.title;

    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    setMetaContent('meta[name="description"]', meta.description);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.description);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.description);

    if (typeof window !== 'undefined') {
      const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
      let canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonicalUrl);

      let ogUrlEl = document.querySelector('meta[property="og:url"]');
      if (!ogUrlEl) {
        ogUrlEl = document.createElement('meta');
        ogUrlEl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrlEl);
      }
      ogUrlEl.setAttribute('content', canonicalUrl);

      const hreflangs = [
        { lang: 'uz', href: canonicalUrl },
        { lang: 'uz-Latn', href: `${canonicalUrl}?script=latn` },
        { lang: 'uz-Cyrl', href: `${canonicalUrl}?script=cyrl` },
        { lang: 'x-default', href: canonicalUrl }
      ];
      hreflangs.forEach(({ lang, href }) => {
        let linkEl = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.setAttribute('rel', 'alternate');
          linkEl.setAttribute('hreflang', lang);
          document.head.appendChild(linkEl);
        }
        linkEl.setAttribute('href', href);
      });
    }
  }, [activeTab]);

  return (
    <section
      hidden
      aria-hidden="true"
      aria-label="3-Alifboli Qidiruv Namunalari"
      className="hidden bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
            <Globe className="w-3.5 h-3.5 text-teal-700" />
            <span>Uç Alifboli Qidiruv Indeksi (Yangi Lotin · Eski Lotin · Kirill)</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
            3 Yozuvda Tezkor Namuna va Qidiruv Sözlari
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setShowExtendedClusters((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-colors"
          >
            {showExtendedClusters ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Mavzularni yig‘iş</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>3-alifbo namunalari</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Tri-Script Search Term Tags */}
      <div className="pt-1 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 mr-1">
          <Search className="w-3.5 h-3.5 text-teal-700" />
          <span>3 alifbodagi tezkor qidiruv namunalari:</span>
        </span>
        {POPULAR_TRI_SCRIPT_KEYWORDS.map((kw, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectQuery(`${kw.old1995} — ${kw.cyr} — ${kw.new2026}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-600/50 rounded-lg text-slate-700 hover:text-teal-950 transition-colors"
          >
            <span className="font-semibold text-slate-900">{kw.new2026}</span>
            <span className="text-slate-400">/</span>
            <span>{kw.old1995}</span>
            <span className="text-slate-400">/</span>
            <span>{kw.cyr}</span>
          </button>
        ))}
      </div>

      {/* Collapsible Parallel Tri-Script Search Clusters */}
      {showExtendedClusters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80">
          {TRI_SCRIPT_SEARCH_CLUSTERS.map((cluster, idx) => (
            <article
              key={idx}
              className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-teal-600/50 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                  {cluster.category}
                </div>
                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="text-[11px] text-slate-400">2026 Yangi Lotin:</dt>
                    <dd className="font-semibold text-slate-900">{cluster.newLatin2026}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">1995 Eski Lotin:</dt>
                    <dd className="font-medium text-slate-700">{cluster.oldLatin1995}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Kirill:</dt>
                    <dd className="font-medium text-slate-700">{cluster.cyrillic}</dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={() => onSelectQuery(cluster.sampleText)}
                className="inline-flex items-center justify-between w-full pt-2.5 border-t border-slate-200/80 text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors"
              >
                <span>Tarjimonda sinab köriş</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
});
