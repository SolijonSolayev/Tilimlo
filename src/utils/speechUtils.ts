/**
 * Voice synthesis (TTS) and Speech Recognition (STT) utility
 * Combines server-side Gemini TTS/STT with browser Web Speech API fallback so voice works seamlessly.
 */

export async function speakUzbekText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  if (!text || !text.trim()) {
    onEnd?.();
    return;
  }

  onStart?.();

  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64 && !data.fallback) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audio.onended = () => onEnd?.();
        audio.onerror = () => fallbackBrowserSpeak(text, onEnd);
        await audio.play();
        return;
      }
    }
  } catch {
    // Fall through to browser Web Speech API
  }

  fallbackBrowserSpeak(text, onEnd);
}

function fallbackBrowserSpeak(text: string, onEnd?: () => void) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      // Normalize reformed diacritics slightly for standard TTS engines that read Turkish/Uzbek phonetics
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('uz')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('tr')) ||
        voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.lang = preferredVoice?.lang || 'tr-TR';
      utterance.rate = 0.95;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
      // Safety timeout in headless browsers where speechSynthesis onend might not fire
      setTimeout(() => {
        onEnd?.();
      }, Math.min(Math.max(text.length * 65, 1500), 8000));
      return;
    } catch {
      onEnd?.();
      return;
    }
  }
  setTimeout(() => onEnd?.(), 600);
}

export function createUzbekSpeechRecognizer(
  onResult: (transcript: string) => void,
  onEnd?: () => void,
  onError?: () => void
): { start: () => void; stop: () => void } | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionImpl =
    (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

  if (!SpeechRecognitionImpl) {
    return null;
  }

  const recognition = new SpeechRecognitionImpl() as {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
  };

  recognition.lang = 'uz-UZ';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  };

  recognition.onend = () => onEnd?.();
  recognition.onerror = () => onError?.();

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        onError?.();
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        onEnd?.();
      }
    }
  };
}

