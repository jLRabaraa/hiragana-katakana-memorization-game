# Third-Party Notices

Kana Dōjō uses data derived from the following sources. When the vocabulary and grammar content
lands (Phase 2), the enriched data files are derivatives of these works and must keep these notices.

## JMdict — vocabulary

- **Source:** JMdict / EDICT dictionary project, Electronic Dictionary Research and Development Group (EDRDG)
- **URL:** https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project
- **Licence:** Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- **Used for:** Japanese readings, parts of speech, and English glosses for curated vocabulary.
- **Modifications:** a hand-curated subset of entries; glosses shortened and sense-selected; data
  reshaped into the application's item schema.

## KANJIDIC2 — kanji metadata

- **Source:** KANJIDIC2, Electronic Dictionary Research and Development Group (EDRDG)
- **URL:** https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- **Licence:** Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- **Used for:** kanji meanings, on/kun readings, and grade metadata for kanji taught inside words.
- **Modifications:** only kanji referenced by curated vocabulary are emitted; readings and meanings
  are filtered and reformatted.

## Tatoeba — example sentences

- **Source:** Tatoeba
- **URL:** https://tatoeba.org
- **Licence:** Creative Commons Attribution 2.0 France (CC BY 2.0 FR)
- **Used for:** Japanese example sentences with English translations attached to vocabulary items.
- **Modifications:** sentence selection, deduplication, and pairing with vocabulary entries.

## Share-alike and distribution

The generated vocabulary/kanji dataset (under `data/generated/`) is a derivative work of CC BY-SA
3.0 material and is distributed under **CC BY-SA 3.0**. The application source code in `src/` is
separate and is not a derivative of the dictionary data.

Attribution is also rendered in the site footer via `src/components/AttributionFooter.tsx`. Do not
remove it.

## Application code

The Kana Dōjō application source code currently has **no open-source licence**; all rights are
reserved unless a licence is added to the repository.

## Legacy file

`legacy/kana-dojo-legacy.html` is the original project work of this repository and is covered by the
same terms as the application code.
