// Documentation-only renderer. Run from the repository root with Node on Windows.
// SVG is the editable vector artifact; PNG exports use the companion PowerShell script.
const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const out = 'docs/diagrams'
const ink = '#243746'
const muted = '#526b7b'
const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function diagram(height) {
  const parts = []
  const rect = (x, y, w, h, fill = '#ffffff', stroke = '#bdc8d0') =>
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}"/>`)
  const decision = (x, y, w, h) => parts.push(`<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="#ffffff" stroke="#bdc8d0"/>`)
  const text = (x, y, label, size = 19, weight = 400, color = ink) =>
    parts.push(`<text x="${x}" y="${y}" font-family="Segoe UI,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(label)}</text>`)
  const lines = (x, y, labels, size = 19) => labels.forEach((s, i) => text(x, y + i * 30, s, size))
  const arrow = (points, label, x, y, dashed = true) => {
    parts.push(`<polyline points="${points.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${muted}" stroke-width="2"${dashed ? ' stroke-dasharray="8 5"' : ''}/>`)
    const [ex, ey] = points.at(-1), [px, py] = points.at(-2)
    const angle = Math.atan2(ey - py, ex - px)
    const tip = (offset) => [ex - 13 * Math.cos(angle + offset), ey - 13 * Math.sin(angle + offset)].join(',')
    parts.push(`<polyline points="${tip(-0.45)} ${ex},${ey} ${tip(0.45)}" fill="none" stroke="${muted}" stroke-width="2"/>`)
    if (label) text(x, y, label, 17, 400, muted)
  }
  const box = (x, y, w, h, title, labels, fill = '#ffffff', stereotype = 'component') => {
    rect(x, y, w, h, fill)
    text(x + 20, y + 28, `«${stereotype}»`, 15, 400, muted)
    text(x + 20, y + 62, title, 24, 650)
    lines(x + 20, y + 98, labels)
  }
  const title = (name, subtitle) => {
    rect(0, 0, 1800, height, '#f4f7fa', '#f4f7fa')
    text(50, 58, name, 36, 700)
    text(50, 99, subtitle, 21, 400, muted)
    text(50, 131, 'Agreed 2026-10-29 · PLANNED / NOT IMPLEMENTED · Canonical specification: docs/CLOUD-SYNC.md', 18, 600, muted)
  }
  const save = (name, description) => {
    fs.writeFileSync(`${out}/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="${height}" viewBox="0 0 1800 ${height}" role="img" aria-labelledby="title description"><title id="title">${escape(name)}</title><desc id="description">${escape(description)}</desc>\n${parts.join('\n')}\n</svg>\n`)
  }
  return { rect, decision, text, lines, arrow, box, title, save }
}

fs.mkdirSync(out, { recursive: true })
{
  const d = diagram(1490)
  d.title('Kana Dōjō · Planned cloud architecture', 'UML component view · Public Google sign-in · Offline reopen · Cross-device completion merging')
  d.rect(45, 175, 1100, 1060, '#fbfcfe', '#9aabb8')
  d.text(65, 205, '«execution environment» Learner’s browser', 19, 650)
  d.box(75, 230, 480, 190, 'App shell + learning screens', ['Sign in before first learning', 'Home → lesson → quiz → results', 'Restart unfinished quizzes'], '#eaf2fc')
  d.box(645, 230, 470, 190, 'Authentication / session adapter', ['Google account → stable Firebase UID', 'Remember the signed-in account', 'Reauthenticate online for cloud access'], '#edf6f1')
  d.arrow([[555, 320], [645, 320]], 'uses', 575, 304)
  d.box(75, 500, 1040, 190, 'useProgress + progress coordinator', ['Apply pure learning rules; atomically commit completions and upload outbox entries', 'Expose local / syncing / synced / sign-in-required / cloud-unavailable status', 'Isolate all local records, listeners, and uploads by account UID'], '#eaf2fc')
  d.arrow([[310, 420], [310, 500]], 'completion callbacks', 330, 464)
  d.arrow([[880, 420], [880, 500]], 'active account', 900, 464)
  d.box(75, 780, 490, 195, 'Pure learning engine', ['Eligibility + round building + recall gates', 'Fold each completion ID once', 'Local path / order / direction checking'], '#fff5e5')
  d.box(635, 780, 480, 195, 'IndexedDB repository', ['Versioned v3 records per Firebase UID', 'Completions + projections + upload outbox', 'No unfinished quiz or raw drawings'], '#edf6f1', 'local database')
  d.arrow([[310, 690], [310, 780]], 'calls', 330, 744)
  d.arrow([[875, 690], [875, 780]], 'atomic local save', 895, 744)
  d.box(75, 1050, 490, 155, 'Service worker + curriculum cache', ['Cache app files for offline launch', 'Reviewed guides and compatible updates'], '#f1f3f5')
  d.box(635, 1050, 480, 155, 'Synchronization adapter', ['Unique IDs; retries; incremental downloads', 'Combine completed work across devices'], '#eaf5f6')
  d.arrow([[875, 1050], [875, 975]], 'reads outbox / writes acknowledgments', 895, 1027)
  d.rect(1220, 175, 535, 1060, '#fbfcfe', '#9aabb8')
  d.text(1240, 205, '«cloud boundary» Firebase Spark · no billing', 19, 650)
  d.box(1250, 230, 475, 190, 'Firebase Authentication', ['Google sign-in; public registration', 'First sign-in requires internet', 'Account UID identifies progress owner'], '#edf6f1', 'managed service')
  d.arrow([[1115, 320], [1250, 320]], 'sign in', 1145, 302)
  d.box(1250, 500, 475, 190, 'Firestore Security Rules', ['Check authenticated UID ownership', 'Validate fields, types, sizes, operations', 'Deny changes to committed completions'], '#f2effa')
  d.box(1250, 780, 475, 195, 'Firestore Standard database', ['users/{uid}/completions/{completionId}', 'Completed lessons, rounds, tracing', 'Reading, review, and habit evidence'], '#eaf5f6', 'cloud database')
  d.arrow([[1485, 690], [1485, 780]], 'authorized access', 1505, 744)
  d.arrow([[1115, 1130], [1190, 1130], [1190, 600], [1250, 600]], 'Firebase client SDK', 980, 1267)
  d.text(1245, 1050, 'Immutable completions → rebuildable progress', 20, 650)
  d.lines(1245, 1090, ['Union passes and per-kana tracing completion', 'Keep highest scores; tally each round once', 'No full-progress last-write-wins uploads', 'No deployed custom API or paid services'], 18)
  d.text(60, 1307, 'Guided tracing: required once per new kana; reveal only accepted strokes; all strokes required; no points or recall credit.', 20, 600)
  d.text(60, 1347, 'Fresh Google accounts: leave v2 / legacy saves untouched and do not import them. Commit tracing when the round finishes.', 19)
  d.text(60, 1387, 'Offline startup requires prior online sign-in and caching. Pending uploads wait for valid authentication and available quota.', 19)
  d.text(60, 1433, 'Dashed arrows denote dependencies. Secondary UI/data dependencies omitted. Current implementation remains localStorage-only.', 18, 400, muted)
  d.save('planned-cloud-architecture', 'Planned UML component diagram separating browser UI, authentication, pure engine, account-scoped IndexedDB and synchronization from Firebase Authentication, Security Rules, and Firestore on Spark without billing.')
}
{
  const d = diagram(1550)
  d.title('Kana Dōjō · Planned learning and save flow', 'UML activity view · Required guided tracing · Completed-work persistence · Offline synchronization')
  d.box(55, 185, 790, 142, 'Open app / identify account', ['First visit: online Google sign-in; cache app and curriculum', 'Return offline: use remembered account and cached content'], '#eaf2fc', 'activity')
  d.box(55, 395, 790, 142, 'Lesson → quiz', ['Use only introduced items; keep unaided recall separate', 'Include tracing for every new kana without committed completion'], '#eaf2fc', 'activity')
  d.arrow([[450, 327], [450, 395]], '', 0, 0, false)
  d.box(55, 605, 790, 142, 'Capture the next guided stroke invisibly', ['Highlight next guide; do not show attempted ink', 'On release, check path coverage / shape / order / direction'], '#fff5e5', 'activity')
  d.arrow([[450, 537], [450, 605]], 'tracing required', 470, 575, false)
  d.decision(285, 802, 330, 92)
  d.text(331, 855, 'Stroke accepted?', 22, 650)
  d.arrow([[450, 747], [450, 802]], '', 0, 0, false)
  d.box(975, 605, 760, 142, 'Retry the same stroke', ['Incorrect ink stays hidden; give accessible retry feedback', 'No points, reading penalty, or accepted stroke on cancellation'], '#fff5e5', 'activity')
  d.arrow([[615, 848], [1350, 848], [1350, 747]], '[no]', 925, 832, false)
  d.arrow([[975, 675], [845, 675]], 'retry', 884, 660, false)
  d.box(55, 965, 790, 142, 'Reveal accepted stroke', ['Keep accepted ink; advance to the next stroke', 'All strokes accepted → tracing exercise complete'], '#edf6f1', 'activity')
  d.arrow([[450, 894], [450, 965]], '[yes]', 470, 932, false)
  d.arrow([[55, 1035], [25, 1035], [25, 675], [55, 675]], '', 0, 0, false)
  d.text(64, 1150, 'Repeat while strokes remain; after all strokes, continue the quiz.', 19)
  d.box(975, 965, 760, 142, 'Finish the round → local atomic commit', ['Unique round completion + tracing results + upload outbox', 'Save even below the reading pass gate; tracing adds no score'], '#edf6f1', 'activity')
  d.arrow([[845, 1035], [975, 1035]], 'round ends', 854, 1018, false)
  d.box(55, 1210, 790, 166, 'Close before round completion', ['Discard unfinished answers, position, candidate paths, and tracing', 'Previously completed lessons and rounds remain saved', 'Next attempt starts a fresh quiz'], '#f1f3f5', 'interruption')
  d.box(975, 1210, 760, 166, 'Sync when authenticated and cloud available', ['Upload the same completion ID on retries; download missing events', 'Merge passes/tracing; keep bests; count unique rounds once', 'Otherwise retain local work and show pending / unavailable status'], '#eaf5f6', 'activity')
  d.arrow([[1350, 1107], [1350, 1210]], '', 0, 0, false)
  d.text(55, 1430, 'Reading progression still requires per-kana unaided recall and an 80% checkpoint. Tracing is assisted practice, not recall.', 20, 600)
  d.text(55, 1471, 'Tracing completion becomes durable only when its round finishes. Other devices skip it after receiving the committed completion.', 19)
  d.text(55, 1512, 'Solid arrows show activity flow. Interrupted quizzes restart. Daily-review first-attempt evidence has a separate persistence policy.', 18, 400, muted)
  d.save('planned-learning-flow', 'Planned learning activity flow showing Google sign-in, required once-per-kana tracing, hidden incorrect strokes, retry, completion-only local saves, quiz restart on interruption, and later cross-device synchronization.')
}

// Keep the existing diagram truthful about the code, while pointing at the current target plan.
const currentPath = `${out}/current-architecture.svg`
let current = fs.readFileSync(currentPath, 'utf8')
current = current.replace('Current architecture · UML component and activity views', 'Implemented baseline · UML component and activity views')
current = current.replace(/Planned, unbuilt:[^<]+/, 'Planned, unbuilt: Google sign-in · Spark sync · IndexedDB + offline reopen · guided pilot + required tracing · daily review · React Dojo')
fs.writeFileSync(currentPath, current)

for (const name of ['current-architecture', 'planned-cloud-architecture', 'planned-learning-flow']) {
  execFileSync('powershell.exe', ['-NoProfile', '-File', 'scripts/export-diagram-png.ps1', '-SvgPath', `${out}/${name}.svg`], { stdio: 'inherit' })
}
