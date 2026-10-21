/**
 * Rōmaji comparison lives here: lowercase, fold accents/macrons to plain vowels,
 * then strip everything that is not a-z. Both Hepburn and Kunrei spellings must
 * survive this normalisation to match the item's accepted readings.
 */
export function normalizeRomaji(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[āáàâ]/g, 'a')
    .replace(/[īíìî]/g, 'i')
    .replace(/[ūúùû]/g, 'u')
    .replace(/[ēéèê]/g, 'e')
    .replace(/[ōóòô]/g, 'o')
    .replace(/[^a-z]/g, '')
}
