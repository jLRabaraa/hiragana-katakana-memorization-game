import { useState } from 'react'
import type { GrammarQuestion, Item, KanaItem, Level, VocabItem } from '../../types/domain'
import {
  curriculumProblems,
  GENERATED_KANJI,
  getItems,
  GRAMMAR_QUESTIONS,
  KANA_ITEMS,
  LEVELS,
  VOCAB_ITEMS,
} from '../../data'

type Tab = 'levels' | 'kana' | 'vocab' | 'grammar'

const STAGE_LABEL: Record<Level['stage'], string> = {
  kana: 'Kana',
  vocab: 'Vocabulary',
  grammar: 'Grammar',
}

const SCRIPT_LABEL: Record<KanaItem['script'], string> = {
  hiragana: 'Hiragana',
  katakana: 'Katakana',
}

const GROUP_LABEL: Record<KanaItem['group'], string> = {
  basic: 'Basic',
  dakuten: 'Voiced',
  yoon: 'Combos',
}

function Chip({ item }: { item: Item }) {
  if (item.type === 'kana') {
    return (
      <span className="review-chip" title={item.romaji}>
        <span className="review-chip-glyph" lang="ja">{item.glyph}</span>
        <span className="review-chip-sub">{item.romaji}</span>
      </span>
    )
  }
  return (
    <span className="review-chip" title={item.gloss}>
      <span className="review-chip-glyph" lang="ja">{item.kanji ?? item.kana}</span>
      <span className="review-chip-sub">{item.gloss}</span>
    </span>
  )
}

function LevelCard({ level, titles }: { level: Level; titles: Map<string, string> }) {
  const learned = level.learn.length ? getItems(level.learn) : []
  const grammarCount = level.grammar?.length ?? 0

  return (
    <article className="review-level">
      <header className="review-level-head">
        <span className="review-level-num">{String(level.order).padStart(2, '0')}</span>
        <div className="review-level-titles">
          <h3>{level.title}</h3>
          <p>
            <span className={`review-tag review-tag-${level.stage}`}>{STAGE_LABEL[level.stage]}</span>
            <span className="review-meta">Pass at {Math.round(level.passAccuracy * 100)}%</span>
            {level.requires.length > 0 && (
              <span className="review-meta">
                after {level.requires.map((id) => titles.get(id) ?? id).join(', ')}
              </span>
            )}
          </p>
        </div>
      </header>

      {learned.length > 0 && (
        <div className="review-chip-row">
          {learned.map((item) => <Chip key={item.id} item={item} />)}
        </div>
      )}

      {grammarCount > 0 && (
        <p className="review-meta">
          {grammarCount} grammar questions · {level.lessonNotes?.length ?? 0} explanation cards
        </p>
      )}
    </article>
  )
}

function KanaSection({ script }: { script: KanaItem['script'] }) {
  const items = KANA_ITEMS.filter((item) => item.script === script)
  const groups: KanaItem['group'][] = ['basic', 'dakuten', 'yoon']

  return (
    <section className="review-block">
      <h3 className="review-block-title">
        {SCRIPT_LABEL[script]} <span className="review-count">{items.length}</span>
      </h3>
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group)
        if (!groupItems.length) return null
        return (
          <div className="review-kana-group" key={group}>
            <p className="review-subtitle">
              {GROUP_LABEL[group]} <span className="review-count">{groupItems.length}</span>
            </p>
            <div className="review-kana-grid">
              {groupItems.map((item) => (
                <div className="review-kana" key={item.id}>
                  <span className="review-kana-glyph" lang="ja">{item.glyph}</span>
                  <span className="review-kana-romaji">{item.romaji}</span>
                  {item.alts.length > 0 && (
                    <span className="review-kana-alts">also {item.alts.join(', ')}</span>
                  )}
                  <span className={`review-kana-mnemonic${item.mnemonic ? '' : ' is-empty'}`}>
                    {item.mnemonic ?? (group === 'basic' ? 'missing mnemonic' : 'combination / voiced form')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function VocabCard({ item }: { item: VocabItem }) {
  const kanji = item.kanji
    ? Array.from(item.kanji).filter((char) => /\p{Script=Han}/u.test(char))
    : []

  return (
    <article className="review-vocab">
      <div className="review-vocab-main">
        <span className="review-vocab-word" lang="ja">{item.kanji ?? item.kana}</span>
        <div className="review-vocab-reading">
          <span lang="ja">{item.kana}</span>
          <span className="review-vocab-gloss">{item.gloss}</span>
        </div>
      </div>

      {item.example && (
        <p className="review-vocab-example">
          <span lang="ja">{item.example.ja}</span>
          <span>{item.example.en}</span>
        </p>
      )}

      {item.mnemonic && <p className="review-vocab-mnemonic">{item.mnemonic}</p>}

      {kanji.length > 0 && (
        <p className="review-kanji-list">
          {kanji.map((char) => {
            const info = GENERATED_KANJI.find((entry) => entry.literal === char)
            const meanings = info?.meanings.length ? info.meanings.join(', ') : 'readings pending dataset'
            return (
              <span className="review-kanji" key={char}>
                <span className="review-kanji-char" lang="ja">{char}</span>
                {meanings}
              </span>
            )
          })}
        </p>
      )}
    </article>
  )
}

function GrammarCard({ question }: { question: GrammarQuestion }) {
  if (question.kind === 'particle-fill') {
    return (
      <article className="review-grammar">
        <p className="review-grammar-sentence" lang="ja">
          {question.tokens.map((token, index) => {
            const blank = question.blanks.find((entry) => entry.index === index)
            return blank
              ? <mark className="review-blank" key={index}>{token}</mark>
              : <span key={index}>{token}</span>
          })}
          。
        </p>
        <p className="review-grammar-en">{question.translation}</p>
        <p className="review-grammar-choices">
          {question.blanks.map((blank) => (
            <span key={blank.index}>
              <strong>{blank.answer}</strong> ← {blank.choices.filter((choice) => choice !== blank.answer).join(', ')}
            </span>
          ))}
        </p>
      </article>
    )
  }

  return (
    <article className="review-grammar">
      <p className="review-grammar-sentence" lang="ja">{question.answer.join('')}。</p>
      <p className="review-grammar-en">{question.translation}</p>
      <p className="review-grammar-choices">
        <span>Tiles: <span lang="ja">{question.tokens.join(' · ')}</span></span>
      </p>
    </article>
  )
}

export default function CurriculumReview({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('levels')
  const problems = curriculumProblems()
  const titles = new Map(LEVELS.map((level) => [level.id, level.title]))

  const tabs: { id: Tab; label: string }[] = [
    { id: 'levels', label: `Levels · ${LEVELS.length}` },
    { id: 'kana', label: `Kana · ${KANA_ITEMS.length}` },
    { id: 'vocab', label: `Words · ${VOCAB_ITEMS.length}` },
    { id: 'grammar', label: `Grammar · ${GRAMMAR_QUESTIONS.length}` },
  ]

  return (
    <section id="screen-review" className="screen is-active">
      <div className="review-inner">
        <header className="review-head">
          <button className="ghost-btn review-back" type="button" onClick={onBack}>
            ← Back
          </button>
          <div>
            <p className="eyebrow">Phase 2 · Checkpoint 1</p>
            <h2 className="review-title">Curriculum review</h2>
            <p className="review-sub">
              Verify readings, glosses, mnemonics, and sentence naturalness. This screen is a
              development preview and is removed from production builds.
            </p>
          </div>
        </header>

        {problems.length > 0 && (
          <div className="review-problems">
            <strong>Curriculum problems</strong>
            <ul>{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
          </div>
        )}

        <nav className="review-tabs" aria-label="Curriculum sections">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`review-tab${tab === entry.id ? ' is-on' : ''}`}
              aria-pressed={tab === entry.id}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="review-panel">
          {tab === 'levels' && (
            <div className="review-levels">
              {LEVELS.map((level) => (
                <LevelCard key={level.id} level={level} titles={titles} />
              ))}
            </div>
          )}

          {tab === 'kana' && (
            <>
              <KanaSection script="hiragana" />
              <KanaSection script="katakana" />
            </>
          )}

          {tab === 'vocab' && (
            <div className="review-vocab-grid">
              {VOCAB_ITEMS.map((item) => <VocabCard key={item.id} item={item} />)}
            </div>
          )}

          {tab === 'grammar' && (
            <div className="review-grammar-wrap">
              <section className="review-block">
                <h3 className="review-block-title">Explanation cards</h3>
                <ul className="review-notes">
                  {LEVELS.find((level) => level.stage === 'grammar')?.lessonNotes?.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
              <div className="review-vocab-grid">
                {GRAMMAR_QUESTIONS.map((question) => (
                  <GrammarCard key={question.id} question={question} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
