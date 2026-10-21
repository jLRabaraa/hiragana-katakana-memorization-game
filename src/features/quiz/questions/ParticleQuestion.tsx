import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { Question } from '../../../engine/types'
import { sfxClick, sfxPlace, sfxWrong } from '../../../utils/audio'
import type { QuizApi } from '../api'
import type { RegisterKeys } from './ChoiceQuestion'

type ParticleData = Extract<Question, { kind: 'particle' }>

interface ParticleQuestionProps {
  q: ParticleData
  locked: boolean
  api: QuizApi
  registerKeys: RegisterKeys
}

function fullSentence(tokens: string[], answers: Record<number, string>): string {
  const parts = tokens.map((token, i) => answers[i] ?? token)
  return `${parts.join('')}。`
}

/**
 * Particle fill-in: blanks are answered left to right (any unanswered blank may
 * be tapped to refocus it). Every wrong chip resets the streak and marks the
 * sentence as a miss; the full sentence is revealed in the feedback either way.
 */
export default function ParticleQuestion({ q, locked, api, registerKeys }: ParticleQuestionProps): ReactElement {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [current, setCurrent] = useState<number>(q.blanks[0]?.index ?? -1)
  const [missed, setMissed] = useState(false)
  const [done, setDone] = useState(false)
  const answerTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (answerTimer.current !== null) window.clearTimeout(answerTimer.current)
    },
    [],
  )

  const pickChip = (chip: string): void => {
    if (done || current < 0) return
    const blank = q.blanks.find((entry) => entry.index === current)
    if (!blank || answers[blank.index] !== undefined) return

    if (chip === blank.answer) {
      const next = { ...answers, [blank.index]: chip }
      setAnswers(next)
      sfxPlace()
      const nextBlank = q.blanks.find((entry) => next[entry.index] === undefined)
      if (nextBlank) {
        setCurrent(nextBlank.index)
        return
      }
      setDone(true)
      answerTimer.current = window.setTimeout(() => {
        answerTimer.current = null
        const sentence = fullSentence(q.tokens, next)
        api.answer({
          correct: !missed,
          base: 100,
          correctText: sentence,
          wrongText: `The sentence is ${sentence}`,
          grammarMiss: missed ? { id: q.sourceId, sentence, translation: q.translation } : undefined,
        })
      }, 420)
      return
    }

    setMissed(true)
    api.resetStreak()
    sfxWrong()
  }

  useEffect(() => {
    if (locked || done) {
      registerKeys(null)
      return undefined
    }
    registerKeys((ev) => {
      const digit = Number(ev.key)
      const blank = q.blanks.find((entry) => entry.index === current)
      if (!blank) return
      if (digit >= 1 && digit <= blank.choices.length) {
        ev.preventDefault()
        pickChip(blank.choices[digit - 1])
      }
    })
    return () => registerKeys(null)
  })

  const currentBlank = current >= 0 ? q.blanks.find((entry) => entry.index === current) : undefined
  const answeredCount = q.blanks.filter((blank) => answers[blank.index] !== undefined).length

  return (
    <div className="prompt g-card">
      <div className="kana-display g-sentence" lang="ja">
        {q.tokens.map((token, i) => {
          const blank = q.blanks.find((entry) => entry.index === i)
          if (!blank) return <span key={i} className="g-token">{token}</span>
          return (
            <button
              key={i}
              type="button"
              className={`g-blank${answers[i] !== undefined ? ' is-filled' : ''}${current === i && answers[i] === undefined ? ' is-current' : ''}`}
              lang="ja"
              disabled={locked || answers[i] !== undefined}
              onClick={() => {
                if (locked || done) return
                sfxClick()
                setCurrent(blank.index)
              }}
            >
              {answers[i] !== undefined ? answers[i] : '？'}
            </button>
          )
        })}
      </div>

      {answeredCount < q.blanks.length && !done && currentBlank && (
        <div className="g-chips">
          {currentBlank.choices.map((chip, i) => (
            <button
              key={chip}
              type="button"
              className="g-chip"
              lang="ja"
              disabled={locked}
              onClick={() => pickChip(chip)}
            >
              <span className="key-hint">{i + 1}</span>{chip}
            </button>
          ))}
        </div>
      )}

      <p className="g-translation">{q.translation}</p>
    </div>
  )
}
