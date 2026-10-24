/**
 * Pure security, input sanitization, F12/DevTools shortcut detection,
 * and cookie consent management utilities for TilImlo.
 */

export interface KeyEventLike {
  key?: string;
  code?: string;
  keyCode?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export interface ShortcutCheckResult {
  blocked: boolean;
  reason: string | null;
}

export interface CookieConsentState {
  essential: true;
  preferences: boolean;
  strictContextMenuGuard: boolean;
  consentedAt: string;
  level: 'all' | 'essential' | 'custom';
}

export const COOKIE_STORAGE_KEY = 'tilimlo-cookie-consent-v1';

/**
 * Detects whether a keyboard event corresponds to F12 or developer inspection shortcuts.
 */
export function isBlockedDevToolsShortcut(event: KeyEventLike): ShortcutCheckResult {
  const key = (event.key || '').toUpperCase();
  const code = (event.code || '').toUpperCase();
  const keyCode = event.keyCode || 0;

  // 1. Direct F12 key press
  if (key === 'F12' || code === 'F12' || keyCode === 123) {
    return {
      blocked: true,
      reason: 'F12 (Dasturçi vositalari)'
    };
  }

  const isCtrlOrCmd = Boolean(event.ctrlKey || event.metaKey);
  const isShiftOrAlt = Boolean(event.shiftKey || event.altKey);

  // 2. Ctrl+Shift+I / Cmd+Option+I (DevTools Inspector)
  if (isCtrlOrCmd && isShiftOrAlt && (key === 'I' || code === 'KEYI' || keyCode === 73)) {
    return {
      blocked: true,
      reason: 'Ctrl+Shift+I (Kod inspektori)'
    };
  }

  // 3. Ctrl+Shift+J / Cmd+Option+J (JavaScript Console)
  if (isCtrlOrCmd && isShiftOrAlt && (key === 'J' || code === 'KEYJ' || keyCode === 74)) {
    return {
      blocked: true,
      reason: 'Ctrl+Shift+J (Konsol oynasi)'
    };
  }

  // 4. Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
  if (isCtrlOrCmd && isShiftOrAlt && (key === 'C' || code === 'KEYC' || keyCode === 67)) {
    return {
      blocked: true,
      reason: 'Ctrl+Shift+C (Element tekşiruvçi)'
    };
  }

  // 5. Ctrl+U / Cmd+U (View Source)
  if (isCtrlOrCmd && !event.shiftKey && (key === 'U' || code === 'KEYU' || keyCode === 85)) {
    return {
      blocked: true,
      reason: 'Ctrl+U (Sahifa manba kodi)'
    };
  }

  return {
    blocked: false,
    reason: null
  };
}

/**
 * Sanitizes untrusted user input by stripping dangerous HTML/script payloads,
 * event handlers, and control characters while preserving Uzbek Latin & Cyrillic letters.
 */
export function sanitizeUserInput(input: string, maxLength = 8000): string {
  if (typeof input !== 'string') return '';

  let cleaned = input
    // Remove <script>...</script> blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove <iframe>, <object>, <embed>, <style>, <link>, <meta> tags
    .replace(/<\/?(?:iframe|object|embed|style|link|meta|svg|math|base|form)\b[^>]*>/gi, '')
    // Remove inline event handlers like onerror=, onload=, onclick=
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: or data:text/html URIs
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    // Strip null bytes and non-printable ASCII control chars except newline/tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Strips sensitive or internal server metadata keys from any response object
 * so internal model IDs, API keys, or stack traces are never exposed.
 */
const SENSITIVE_KEYS = new Set([
  'apiKey',
  'api_key',
  'secret',
  'token',
  'stack',
  'systemInstruction',
  'rawModelId',
  'internalSource'
]);

export function redactSensitiveMetadata<T extends Record<string, unknown>>(
  payload: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue;
    }
    result[key] = value;
  }
  return result;
}

/**
 * Creates a valid CookieConsentState object.
 */
export function createCookieConsent(
  level: 'all' | 'essential' | 'custom',
  options?: { preferences?: boolean; strictContextMenuGuard?: boolean }
): CookieConsentState {
  if (level === 'all') {
    return {
      essential: true,
      preferences: true,
      strictContextMenuGuard: Boolean(options?.strictContextMenuGuard ?? false),
      consentedAt: new Date().toISOString(),
      level: 'all'
    };
  }

  if (level === 'essential') {
    return {
      essential: true,
      preferences: false,
      strictContextMenuGuard: Boolean(options?.strictContextMenuGuard ?? false),
      consentedAt: new Date().toISOString(),
      level: 'essential'
    };
  }

  return {
    essential: true,
    preferences: Boolean(options?.preferences ?? true),
    strictContextMenuGuard: Boolean(options?.strictContextMenuGuard ?? false),
    consentedAt: new Date().toISOString(),
    level: 'custom'
  };
}

/**
 * Safely parses stored JSON cookie consent from localStorage.
 */
export function parseCookieConsent(rawJson: string | null | undefined): CookieConsentState | null {
  if (!rawJson || typeof rawJson !== 'string') return null;
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || parsed.essential !== true) {
      return null;
    }
    return {
      essential: true,
      preferences: Boolean(parsed.preferences),
      strictContextMenuGuard: Boolean(parsed.strictContextMenuGuard),
      consentedAt:
        typeof parsed.consentedAt === 'string' ? parsed.consentedAt : new Date().toISOString(),
      level:
        parsed.level === 'all' || parsed.level === 'essential' || parsed.level === 'custom'
          ? parsed.level
          : 'essential'
    };
  } catch {
    return null;
  }
}
