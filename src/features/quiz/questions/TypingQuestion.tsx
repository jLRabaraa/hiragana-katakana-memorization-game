import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import SpeakerButton from '../../../components/SpeakerButton'
import type { Question } from '../../../engine/types'
import { kanaRomajiVariants } from '../../../utils/kanaToRomaji'
import { normalizeRomaji } from '../../../utils/normalizeRomaji'
import { escapeHTML } from '../../../utils/escapeHTML'
import type { QuizApi } from '../api'
import type { RegisterKeys } from './ChoiceQuestion'

type TypingData = Extract<Question, { kind: 'typing' }>

interface TypingQuestionProps {
  q: TypingData
  locked: boolean
  api: QuizApi
  registerKeys: RegisterKeys
}

export default function TypingQuestion({ q, locked, api, registerKeys }: TypingQuestionProps): ReactElement {
  const answered = locked
  const [value, setValue] = useState('')
  const [state, setState] = useState<'nudged' | 'done'>('done')
  const [result, setResult] = useState<'pending' | 'correct' | 'wrong'>('pending')
  const answeredRef = useRef(false)

  const item = q.item
  const variants = useMemo(() => kanaRomajiVariants(q.reading), [q.reading])
  const firstVariant = variants[0] ?? normalizeRomaji(q.accepts[0] ?? '')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const submit = (raw: string): void => {
    if (answeredRef.current) return
    const answer = raw.trim()
    if (answer.length === 0) {
      setState('nudged')
      window.setTimeout(() => setState('done'), 320)
      return
    }
    const correct = q.accepts.includes(normalizeRomaji(answer))
    answeredRef.current = true
    setResult(correct ? 'correct' : 'wrong')
    setState('done')

    if (item.type === 'kana') {
      api.answer({
        correct,
        base: 120,
        itemId: item.id,
        correctText: `${item.glyph} = ${item.romaji}`,
        wrongText: `You wrote “${escapeHTML(answer)}” — the answer is ${item.glyph} = ${item.romaji}.`,
        mnemonic: !correct ? item.mnemonic : undefined,
      })
    } else {
      const written = item.kanji ? `${item.kanji}（${item.kana}）` : item.kana
      api.answer({
        correct,
        base: 120,
        itemId: item.id,
        correctText: `${written} — ${item.gloss}`,
        wrongText: `You wrote “${escapeHTML(answer)}” — the reading is ${item.kana} (${firstVariant}).`,
        mnemonic: !correct ? item.mnemonic : undefined,
      })
    }
  }

  // Enter inside the input is handled by the form; no document-level key here.
  useEffect(() => {
    if (answered) registerKeys(null)
    return undefined
  }, [answered, registerKeys])

  // Autofocus the input on desktop only (mobile keyboards open on demand).
  useEffect(() => {
    if (!window.matchMedia('(min-width: 760px)').matches) return
    const timer = window.setTimeout(() => {
      try {
        inputRef.current?.focus()
      } catch {
        /* focus is best-effort */
      }
    }, 60)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="prompt">
      {q.speakText && <SpeakerButton text={q.speakText} label="Hear this aloud" />}
      <div className="kana-display" lang="ja">{q.prompt}</div>
      {q.promptNote && <p className="prompt-note" lang="ja">{q.promptNote}</p>}
      <p className="prompt-sub">{q.promptSub}</p>

      <form
        className="type-form"
        autoComplete="off"
        onSubmit={(ev) => {
          ev.preventDefault()
          if (answeredRef.current) return
          submit(value)
        }}
      >
        <input
          ref={inputRef}
          className={`type-input${result === 'pending' && state === 'nudged' ? ' is-nudged' : ''}${result === 'correct' ? ' is-correct' : ''}${result === 'wrong' ? ' is-wrong' : ''}`}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          placeholder={q.promptLang === 'ja' ? 'type in rōmaji' : ''}
          disabled={locked}
          readOnly={locked}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          lang="ja"
          aria-label="Type the reading in rōmaji"
          maxLength={16}
        />
        <button className="type-submit" type="submit" disabled={locked}>
          Check
        </button>
      </form>

      <p className="type-hint">Hepburn or Kunrei style both work · press <kbd>Enter</kbd> to check</p>
    </div>
  )
}
