import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import SpeakerButton from '../../../components/SpeakerButton'
import type { Question } from '../../../engine/types'
import type { QuizApi } from '../api'

type ChoiceData = Extract<Question, { kind: 'choice' }>

export type RegisterKeys = (handler: ((ev: KeyboardEvent) => void) | null) => void

interface ChoiceQuestionProps {
  q: ChoiceData
  locked: boolean
  api: QuizApi
  registerKeys: RegisterKeys
}

/** Prompt label for feedback: "あ = a" or "水（みず） — water". */
function answerTextFor(q: ChoiceData): string {
  const item = q.item
  if (item.type === 'kana') return `${item.glyph} = ${item.romaji}`
  return item.kanji ? `${item.kanji}（${item.kana}） — ${item.gloss}` : `${item.kana} — ${item.gloss}`
}

export default function ChoiceQuestion({ q, locked, api, registerKeys }: ChoiceQuestionProps): ReactElement {
  const [chosen, setChosen] = useState<number | null>(null)
  const answered = locked
  const isLongPrompt = q.prompt.length > 1

  const pick = (index: number): void => {
    if (answered || chosen !== null) return
    setChosen(index)
    const correct = index === q.answerIndex
    api.answer({
      correct,
      base: 100,
      itemId: q.itemId,
      correctText: answerTextFor(q),
      wrongText: `The answer is ${answerTextFor(q)}.`,
      mnemonic: !correct ? q.item.mnemonic : undefined,
    })
  }

  useEffect(() => {
    if (answered) {
      registerKeys(null)
      return
    }
    registerKeys((ev) => {
      const digit = Number(ev.key)
      if (digit >= 1 && digit <= q.options.length) {
        ev.preventDefault()
        pick(digit - 1)
      }
    })
    return () => registerKeys(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pick closes over the frozen question
  }, [answered, registerKeys, q])

  const optionClass = (index: number): string => {
    let cls = 'choice'
    if (chosen === index) {
      cls += correctClass(index)
    } else if (index === q.answerIndex && chosen !== null) {
      cls += ' is-correct'
    } else if (chosen !== null) {
      cls += ' is-dim'
    }
    return cls
  }

  function correctClass(index: number): string {
    return index === q.answerIndex ? ' is-correct' : ' is-wrong'
  }

  return (
    <div className="prompt">
      {q.speakText && <SpeakerButton text={q.speakText} label="Hear this aloud" />}
      <div className={`kana-display${isLongPrompt && q.promptLang === 'ja' ? ' is-long' : ''}`} lang={q.promptLang === 'ja' ? 'ja' : undefined}>
        {q.prompt}
      </div>
      {q.promptNote && <p className="prompt-note" lang="ja">{q.promptNote}</p>}
      <p className="prompt-sub">{q.promptSub}</p>

      <div className="choice-grid">
        {q.options.map((label, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            className={optionClass(index)}
            disabled={answered}
            onClick={() => pick(index)}
          >
            <span className={q.optionLang === 'ja' ? `choice-kana${label.length > 1 ? ' is-long' : ''}` : ''}>
              {label}
            </span>
            <span className="key-hint">{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
