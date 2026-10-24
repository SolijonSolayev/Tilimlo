import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isBlockedDevToolsShortcut,
  sanitizeUserInput,
  redactSensitiveMetadata,
  createCookieConsent,
  parseCookieConsent
} from './securityUtils';

test('isBlockedDevToolsShortcut blocks F12 by key, code, and keyCode', () => {
  assert.equal(isBlockedDevToolsShortcut({ key: 'F12' }).blocked, true);
  assert.equal(isBlockedDevToolsShortcut({ code: 'F12' }).blocked, true);
  assert.equal(isBlockedDevToolsShortcut({ keyCode: 123 }).blocked, true);
});

test('isBlockedDevToolsShortcut blocks Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, and Ctrl+U', () => {
  assert.equal(
    isBlockedDevToolsShortcut({ key: 'I', ctrlKey: true, shiftKey: true }).blocked,
    true
  );
  assert.equal(
    isBlockedDevToolsShortcut({ key: 'j', ctrlKey: true, shiftKey: true }).blocked,
    true
  );
  assert.equal(
    isBlockedDevToolsShortcut({ key: 'C', metaKey: true, altKey: true }).blocked,
    true
  );
  assert.equal(
    isBlockedDevToolsShortcut({ key: 'u', ctrlKey: true, shiftKey: false }).blocked,
    true
  );
});

test('isBlockedDevToolsShortcut allows normal typing, Copy (Ctrl+C), and Paste (Ctrl+V)', () => {
  assert.equal(isBlockedDevToolsShortcut({ key: 'a' }).blocked, false);
  assert.equal(isBlockedDevToolsShortcut({ key: 'Ö' }).blocked, false);
  assert.equal(
    isBlockedDevToolsShortcut({ key: 'c', ctrlKey: true, shiftKey: false }).blocked,
    false
  );
  assert.equal(
    isBlockedDevToolsShortcut({ key: 'v', ctrlKey: true, shiftKey: false }).blocked,
    false
  );
});

test('sanitizeUserInput strips script tags and inline XSS handlers while keeping Uzbek letters', () => {
  const malicious =
    'Özbekiston <script>alert("xss")</script> <img src=x onerror="steal()" /> Ўзбекистон javascript:evil()';
  const cleaned = sanitizeUserInput(malicious);
  assert.equal(cleaned.includes('<script>'), false);
  assert.equal(cleaned.includes('onerror'), false);
  assert.equal(cleaned.includes('javascript:'), false);
  assert.equal(cleaned.includes('Özbekiston'), true);
  assert.equal(cleaned.includes('Ўзбекистон'), true);
});

test('redactSensitiveMetadata strips sensitive keys while keeping safe fields', () => {
  const raw = {
    reply: 'Assalomu alaykum',
    apiKey: 'secret-123',
    stack: 'Error at line 1',
    systemInstruction: 'hidden prompt',
    modeLabel: 'Tezkor'
  };
  const safe = redactSensitiveMetadata(raw);
  assert.equal('apiKey' in safe, false);
  assert.equal('stack' in safe, false);
  assert.equal('systemInstruction' in safe, false);
  assert.equal(safe.reply, 'Assalomu alaykum');
  assert.equal(safe.modeLabel, 'Tezkor');
});

test('createCookieConsent and parseCookieConsent round-trip valid consent state', () => {
  const allConsent = createCookieConsent('all');
  const serialized = JSON.stringify(allConsent);
  const parsed = parseCookieConsent(serialized);
  assert.ok(parsed);
  assert.equal(parsed.essential, true);
  assert.equal(parsed.preferences, true);
  assert.equal(parsed.level, 'all');

  assert.equal(parseCookieConsent('invalid-json'), null);
  assert.equal(parseCookieConsent(JSON.stringify({ essential: false })), null);
});
