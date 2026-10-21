/**
 * WebAudio tones + Japanese speech synthesis, ported from the legacy game.
 *
 * Every path degrades silently when the API is missing, audio is blocked, or
 * the sound toggle is off — it must never throw into the UI.
 */

let ctx: AudioContext | null = null
let soundOn = true

type AudioContextCtor = typeof AudioContext

function contextClass(): AudioContextCtor | null {
  const scope = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

export function setSoundEnabled(on: boolean): void {
  soundOn = on
}

export function isSoundEnabled(): boolean {
  return soundOn
}

function audio(): AudioContext | null {
  if (!soundOn) return null
  try {
    if (!ctx) {
      const AC = contextClass()
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, delay: number, duration: number, type: OscillatorType = 'sine', volume = 0.05): void {
  const ac = audio()
  if (!ac) return
  try {
    const t0 = ac.currentTime + delay
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + duration + 0.03)
  } catch {
    /* ignore */
  }
}

export function sfxCorrect(): void {
  tone(523.25, 0, 0.2, 'sine', 0.055)
  tone(659.25, 0.07, 0.22, 'sine', 0.05)
  tone(783.99, 0.14, 0.3, 'sine', 0.045)
}

export function sfxWrong(): void {
  tone(196, 0, 0.22, 'triangle', 0.05)
  tone(155.56, 0.11, 0.3, 'triangle', 0.045)
}

export function sfxPlace(): void {
  tone(659.25, 0, 0.09, 'sine', 0.035)
  tone(880, 0.05, 0.12, 'sine', 0.028)
}

export function sfxClick(): void {
  tone(440, 0, 0.05, 'sine', 0.02)
}

export function sfxFinish(): void {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, i * 0.11, 0.35, 'sine', 0.04))
}

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Japanese TTS; silently no-ops when unavailable or muted. */
export function speak(text: string): void {
  if (!speechSupported || !soundOn) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.72
    utterance.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const ja = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith('ja'))
    if (ja) utterance.voice = ja
    window.speechSynthesis.speak(utterance)
  } catch {
    /* ignore */
  }
}

// Prime the voice list so the first speak() already has Japanese candidates.
if (speechSupported) {
  try {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {})
  } catch {
    /* ignore */
  }
}
