/**
 * Attribution notice for the CC-licensed dictionary and sentence data used by
 * the vocab and grammar levels. Required by the licence terms of JMdict,
 * KANJIDIC2 (CC BY-SA 3.0) and Tatoeba (CC BY 2.0 FR).
 *
 * Keep this visible on every deployed build. Details live in
 * THIRD_PARTY_LICENSES.md at the repository root.
 */
export default function AttributionFooter() {
  return (
    <footer className="credit-footer">
      <p>
        Dictionary data from{' '}
        <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noreferrer">
          JMdict
        </a>{' '}
        and{' '}
        <a href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project" target="_blank" rel="noreferrer">
          KANJIDIC2
        </a>{' '}
        © Electronic Dictionary Research and Development Group, CC BY-SA 3.0. Example sentences from{' '}
        <a href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a>, CC BY 2.0 FR.
      </p>
    </footer>
  )
}
