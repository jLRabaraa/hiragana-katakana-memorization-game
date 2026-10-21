import type { ReactElement } from 'react'
import { getItems } from '../../data'
import SpeakerButton from '../../components/SpeakerButton.tsx'
import type { Item, KanaItem, Level, VocabItem } from '../../types/domain'
import { sfxClick } from '../../utils/audio'

/**
 * Lesson phase: every level shows its cards once before the quizzes. The level
 * is then permanently "learned" — retries skip straight to the quiz.
 */

const GROUP_LABEL: Record<KanaItem['group'], string> = {
  basic: 'Basic',
  dakuten: 'Voiced (濁音)',
  yoon: 'Combination (拗音)',
}

function KanaCard({ item }: { item: KanaItem }): ReactElement {
  return (
    <article className="lesson-card lesson-kana">
      <SpeakerButton text={item.glyph} label="Hear this kana" />
      <span className="lesson-glyph" lang="ja">{item.glyph}</span>
      <span className="lesson-romaji">{item.romaji}</span>
      <span className="lesson-note">{GROUP_LABEL[item.group]} · {item.script}</span>
    </article>
  )
}

function VocabCard({ item }: { item: VocabItem }): ReactElement {
  return (
    <article className="lesson-card lesson-vocab">
      <SpeakerButton text={item.kana} label="Hear this word" />
      <span className="lesson-glyph" lang="ja">{item.kanji ?? item.kana}</span>
      <span className="lesson-reading" lang="ja">{item.kana}</span>
      <span className="lesson-gloss">{item.gloss}</span>
      {item.example && (
        <p className="lesson-example">
          <span lang="ja">{item.example.ja}</span>
          <span>{item.example.en}</span>
        </p>
      )}
    </article>
  )
}

function LessonCard({ item }: { item: Item }): ReactElement {
  return item.type === 'kana' ? <KanaCard item={item} /> : <VocabCard item={item} />
}

export default function LessonScreen({ level, onBack, onStart }: {
  level: Level
  onBack: () => void
  onStart: () => void
}): ReactElement {
  const items = level.learn.length > 0 ? getItems(level.learn) : []
  const notes = level.lessonNotes ?? []

  const start = (): void => {
    sfxClick()
    onStart()
  }

  return (
    <section id="screen-lesson" className="screen is-active">
      <div className="game-inner lesson-inner">
        <header className="lesson-head">
          <button className="icon-btn" type="button" onClick={onBack} aria-label="Back to level map">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="lesson-head-copy">
            <p className="eyebrow">Level {String(level.order).padStart(2, '0')} · Lesson</p>
            <h2 className="lesson-title">{level.title}</h2>
            <p className="lesson-sub">
              Meet the {items.length > 0 ? `${items.length} items` : 'pattern'} below, then prove it in the
              quiz. Mnemonic hints will appear if something trips you up.
            </p>
          </div>
        </header>

        {items.length > 0 && (
          <div className="lesson-grid">
            {items.map((item) => (
              <LessonCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {notes.length > 0 && (
          <div className="panel lesson-notes-panel">
            <p className="label">How these sentences work</p>
            <ul className="lesson-notes">
              {notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        )}

        <button
          className="start-btn lesson-start"
          type="button"
          onClick={start}
        >
          <span>Start the quiz</span>
          <span className="start-meta">Pass at {Math.round(level.passAccuracy * 100)}%</span>
        </button>
      </div>
    </section>
  )
}
