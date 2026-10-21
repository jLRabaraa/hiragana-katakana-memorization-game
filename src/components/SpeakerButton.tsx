import type { ReactElement } from 'react'
import { speak } from '../utils/audio'

/** Icon button that speaks Japanese text through the shared audio helper. */
export default function SpeakerButton({ text, label = 'Hear this' }: {
  text: string
  label?: string
}): ReactElement {
  return (
    <button
      className="sound-btn"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        speak(text)
      }}
    >
      <SpeakerIcon />
    </button>
  )
}

function SpeakerIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  )
}
