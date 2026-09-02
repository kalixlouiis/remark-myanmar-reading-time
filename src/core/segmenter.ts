/**
 * Lightweight, rule-based Burmese syllable tokenizer for modern JS/TS runtimes.
 * Converted and adapted from proven Myanmar NLP syllable segmentation patterns.
 */

const CONSONANT_BLOCK = 'က-အ';
const SPECIAL_CHARS = 'ဣဤဥဦဧဩဪဿ၌၍၏၀-၉၊။!\\-/:-@\\[-`{-~\\s.,';

// Post-positional syllables and stacked markers that shouldn't stand alone
const STICKY_SUFFIXES = new Set(['င့်', 'ည့်', 'န့်', 'မ့်', 'ယ့်']);

/**
 * Recombines over-segmented units (like grammatical suffixes or stacked 'ဿ')
 * with their parent syllable.
 */
function recombineComponents(tokens: string[]): string[] {
  const result: string[] = [];
  const limit = tokens.length;
  let idx = 0;

  while (idx < limit) {
    const current = tokens[idx];
    const next = tokens[idx + 1];

    if (next) {
      // Condition A: Attach sticky grammatical suffixes (e.g., 'နှင့်' + 'င့်' -> 'နှင့်')
      if (STICKY_SUFFIXES.has(next)) {
        result.push(current + next);
        idx += 2;
        continue;
      }

      // Condition B: Keep stacked characters like 'ဿ' together with preceding base
      if (next.startsWith('ဿ')) {
        result.push(current + next);
        idx += 2;
        continue;
      }
    }

    result.push(current);
    idx += 1;
  }

  return result;
}

/**
 * Splits raw Burmese text into individual syllables/tokens.
 */
export function tokenizeBurmese(text: string): string[] {
  if (!text || text.trim() === '') {
    return [];
  }

  // 1. Primary break: Insert space before standalone consonants or special characters
  const primaryRegex = new RegExp(
    `(?<![္])([${CONSONANT_BLOCK}])(?![်္])|([${SPECIAL_CHARS}])`,
    'g'
  );
  let segmented = text.replace(primaryRegex, ' $1$2').trim();

  // 2. Put boundary spaces between Burmese letters and Latin/Arabic characters
  segmented = segmented.replace(/(?<=[က-ၴ])([a-zA-Z0-9])/g, ' $1');

  // 3. Keep Burmese and Western digits grouped together cleanly
  segmented = segmented.replace(/(?<=[0-9၀-၉ဝ])\s+(?=[0-9၀-၉ဝ])/g, '');
  segmented = segmented.replace(/([0-9၀-၉ဝ]+)\s+(\+)/g, '$1 $2 ');

  // 4. Split by whitespace and merge split syllables
  const rawTokens = segmented.split(/\s+/).filter(Boolean);
  return recombineComponents(rawTokens);
}