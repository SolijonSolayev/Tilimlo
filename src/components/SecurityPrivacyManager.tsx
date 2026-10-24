import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Cookie,
  Trash2,
  X,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import {
  COOKIE_STORAGE_KEY,
  CookieConsentState,
  createCookieConsent,
  isBlockedDevToolsShortcut,
  parseCookieConsent
} from '../utils/securityUtils';

interface SecurityPrivacyManagerProps {
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
  onClearAllUserData: () => void;
}

export const SecurityPrivacyManager: React.FC<SecurityPrivacyManagerProps> = ({
  isModalOpen,
  onCloseModal,
  onOpenModal,
  onClearAllUserData
}) => {
  const [cookieConsent, setCookieConsent] = useState<CookieConsentState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return parseCookieConsent(localStorage.getItem(COOKIE_STORAGE_KEY));
    } catch {
      return null;
    }
  });

  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !parseCookieConsent(localStorage.getItem(COOKIE_STORAGE_KEY));
    } catch {
      return true;
    }
  });

  const [dataClearedNotice, setDataClearedNotice] = useState<boolean>(false);

  // Local toggle inside the Privacy & Cookie Modal
  const [prefToggle, setPrefToggle] = useState<boolean>(
    cookieConsent ? cookieConsent.preferences : true
  );

  useEffect(() => {
    if (cookieConsent) {
      setPrefToggle(cookieConsent.preferences);
    }
  }, [cookieConsent]);

  const saveConsentState = useCallback((nextState: CookieConsentState) => {
    setCookieConsent(nextState);
    setShowCookieBanner(false);
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleAcceptAllCookies = useCallback(() => {
    const state = createCookieConsent('all', {
      preferences: true
    });
    saveConsentState(state);
  }, [saveConsentState]);

  const handleAcceptEssentialCookies = useCallback(() => {
    const state = createCookieConsent('essential', {
      preferences: false
    });
    saveConsentState(state);
  }, [saveConsentState]);

  const handleSaveCustomSettings = useCallback(() => {
    const state = createCookieConsent('custom', {
      preferences: prefToggle
    });
    saveConsentState(state);
    onCloseModal();
  }, [prefToggle, saveConsentState, onCloseModal]);

  const handleWipeLocalData = useCallback(() => {
    try {
      const currentConsent = cookieConsent || createCookieConsent('essential');
      localStorage.clear();
      sessionStorage.clear();
      // Preserve minimal essential cookie notice so banner doesn't nag immediately unless desired
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(currentConsent));
    } catch {
      // Ignore storage errors
    }
    onClearAllUserData();
    setDataClearedNotice(true);
    setTimeout(() => {
      setDataClearedNotice(false);
    }, 3500);
  }, [cookieConsent, onClearAllUserData]);

  // Global F12 & DevTools Shortcut Blocker (runs silently in background)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const check = isBlockedDevToolsShortcut({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        altKey: e.altKey
      });

      if (check.blocked) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        return false;
      }
      return undefined;
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return (
    <>
      {/* Bottom Cookie & Privacy Consent Banner */}
      {showCookieBanner && (
        <aside
          aria-label="Cookie va maxfiylik eslatmasi"
          data-testid="cookie-consent-banner"
          className="animate-banner-up fixed bottom-0 inset-x-0 z-40 p-4 sm:p-5 pointer-events-none"
        >
          <div className="max-w-[1280px] mx-auto bg-white/95 backdrop-blur-md border border-slate-300/90 rounded-2xl p-4 sm:p-5 shadow-xl pointer-events-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Cookie fayllari va Foydalanuvçi Maxfiyligi Eslatmasi
                  </h2>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                    Reklama kuzatuvisiz · 100% Maxfiy
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>TilImlo</strong> saytning barqaror işlaşi, Kun/Tun rejimi va luğat
                  sozlamalarini saqlaş uçun cookie hamda mahalliy xotiradan foydalanadi. Şaxsiy
                  matnlaringiz uçinçi şaxslarga uzatilmaydi.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
              <button
                type="button"
                data-testid="cookie-customize-btn"
                onClick={onOpenModal}
                className="btn-modern inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl"
              >
                <Settings2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Sozlamalar</span>
              </button>

              <button
                type="button"
                data-testid="cookie-accept-essential"
                onClick={handleAcceptEssentialCookies}
                className="btn-modern px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl"
              >
                Faqat zaruriy
              </button>

              <button
                type="button"
                data-testid="cookie-accept-all"
                onClick={handleAcceptAllCookies}
                className="btn-modern inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Barçasini qabul qiliş</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* User-Facing Cookie & Privacy Preferences Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          data-testid="privacy-security-modal"
          className="animate-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        >
          <div className="animate-modal-pop bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="privacy-modal-title"
                    className="text-base sm:text-lg font-bold text-slate-900"
                  >
                    Maxfiylik va Cookie Sozlamalari
                  </h2>
                  <p className="text-xs text-slate-500">
                    TilImlo (tilimlo.uz) — Foydalanuvçi maxfiyligi va xotira boşqaruvi
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="close-privacy-modal-btn"
                onClick={onCloseModal}
                aria-label="Yopish"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Privacy Summary */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Şaxsiy Matnlar Maxfiyligi</span>
                </span>
                <span className="text-[11px] font-mono text-teal-700">KAFOLATLANGAN</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tarjima va morfologik tahlil brauzerning özida bajariladi, kiritilgan matnlar
                reklama yoki uçinçi şaxslarga uzatilmaydi.
              </p>
            </div>

            {/* User Cookie Preference */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Cookie Sozlamalari
              </h3>

              <div className="space-y-2.5">
                {/* Preferences Cookies */}
                <label className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl cursor-pointer hover:border-teal-600/40 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">
                      Foydalanuvçi qulayligi va Kun/Tun rejimi xotirasi
                    </div>
                    <p className="text-xs text-slate-500">
                      Tanlangan mavzu (Kun yoki Tun rejimi) hamda luğat sozlamalarini keyingi
                      taşrifda saqlaş.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefToggle}
                    onChange={(e) => setPrefToggle(e.target.checked)}
                    className="w-4 h-4 accent-teal-700 rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </div>

            {/* 1-Click Local Data & Cache Wipe */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <button
                  type="button"
                  data-testid="clear-user-data-btn"
                  onClick={handleWipeLocalData}
                  className="btn-modern inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Tarix va mahalliy keşni tozalaş</span>
                </button>
                {dataClearedNotice && (
                  <p
                    data-testid="data-cleared-confirmation"
                    className="animate-slide-down text-xs font-medium text-teal-700 flex items-center gap-1 pt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Barça mahalliy ma’lumotlar va keş tozalandi!</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
                >
                  Bekor qiliş
                </button>
                <button
                  type="button"
                  data-testid="save-privacy-settings-btn"
                  onClick={handleSaveCustomSettings}
                  className="btn-modern inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sozlamalarni saqlaş</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
