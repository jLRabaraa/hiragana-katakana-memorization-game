# Hiragana / Katakana Memorization Game

A self-contained browser quiz for learning the Japanese kana. Choose hiragana, katakana, or both; practice basic, voiced, and combination sounds; and answer by multiple choice, drag-and-drop, or typing.

![Kana Dōjō home screen](screenshot.png)

## Play

Open `index.html` in any modern browser. No installation, build step, or internet connection is required.

To run it from a local server instead:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Features

- Hiragana, katakana, or both scripts
- Basic (基本), voiced/dakuten (濁音), and combination/yōon (拗音) character sets
- Five practice modes:
  - **Mixed** — all challenge types in one round
  - **Matching** — drag kana tiles onto their rōmaji readings
  - **Reading** — kana → rōmaji multiple choice
  - **Recall** — rōmaji → kana multiple choice
  - **Typing** — type the rōmaji in Hepburn or Kunrei spelling
- 10-question rounds (6 in Matching), with scoring, streak bonuses, and personal bests
- Optional 15-second timer for choice and typing questions
- Accuracy gauge and a review list of missed kana
- Japanese pronunciation through the browser's speech-synthesis voice, plus sound effects
- Keyboard shortcuts (`1`–`4`, `Enter`) and a responsive mobile layout
- Settings and best scores saved in `localStorage`

## Controls

| Action | Input |
| --- | --- |
| Choose an answer | Click, or press `1`–`4` |
| Continue after feedback | `Enter` |
| Place a kana tile | Drag it to a reading, or tap the tile and then the reading |
| Check a typed answer | `Enter` |
| Leave a round | Back arrow in the top-left |

## Audio note

The speaker button uses the Japanese voice installed on your device. If no Japanese voice is available, the buttons may be silent; the rest of the game works normally.

## Tech

Built as a single HTML file with vanilla HTML, CSS, and JavaScript. No frameworks, dependencies, or build tools.

## License

No license has been added yet. All rights reserved unless a license is added.
