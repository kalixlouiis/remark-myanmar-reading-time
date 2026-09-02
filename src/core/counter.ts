import { tokenizeBurmese } from './segmenter';
import type { MyanmarReadingTimeResult, ReadingTimeOptions } from '../types';

// Regex to detect pure Burmese Unicode range
const BURMESE_REGEX = /[\u1000-\u109F\uAA60-\uAA7F]/;

// Regex to identify standard Western/Latin words
const LATIN_WORD_REGEX = /[a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?/g;

// Strip out markdown code blocks and HTML tags before counting
const CODE_BLOCK_REGEX = /```[\s\S]*?```|`.*?`/g;
const HTML_TAG_REGEX = /<[^>]+>/g;

/**
 * Calculates reading time for mixed content (Burmese syllables + English words).
 */
export function calculateReadingTime(
  rawContent: string,
  options: ReadingTimeOptions = {}
): MyanmarReadingTimeResult {
  const {
    spmBurmese = 350, // Average syllables per minute for Burmese
    wpmEnglish = 200, // Standard words per minute for English
    excludeCodeBlocks = true,
  } = options;

  if (!rawContent || typeof rawContent !== 'string') {
    return {
      minutes: 0,
      time: 0,
      words: { burmese: 0, english: 0, total: 0 },
      text: '0 min read',
    };
  }

  // 1. Clean content (strip code blocks and raw HTML)
  let cleanText = rawContent;
  if (excludeCodeBlocks) {
    cleanText = cleanText.replace(CODE_BLOCK_REGEX, '');
  }
  cleanText = cleanText.replace(HTML_TAG_REGEX, '');

  // 2. Count English words first, then remove them to prevent duplicate counting
  const englishMatches = cleanText.match(LATIN_WORD_REGEX) || [];
  const englishWordCount = englishMatches.length;
  const burmeseOnlyText = cleanText.replace(LATIN_WORD_REGEX, '');

  // 3. Tokenize remaining Burmese script using our rule-based segmenter
  const burmeseTokens = tokenizeBurmese(burmeseOnlyText);

  // Filter out pure punctuation marks (၊ ။ ! . , ? etc.)
  let burmeseSyllableCount = 0;
  for (const token of burmeseTokens) {
    if (BURMESE_REGEX.test(token)) {
      burmeseSyllableCount++;
    }
  }

  // 4. Calculate reading time (Minutes = Syllables/SPM + Words/WPM)
  const burmeseMinutes = burmeseSyllableCount / spmBurmese;
  const englishMinutes = englishWordCount / wpmEnglish;
  const totalMinutesFloat = burmeseMinutes + englishMinutes;

  // Round up to nearest whole minute (Standard practice: anything under 1 min rounds to 1)
  const minutes = totalMinutesFloat > 0 ? Math.max(1, Math.ceil(totalMinutesFloat)) : 0;
  const totalTimeMs = Math.round(totalMinutesFloat * 60 * 1000);
  const totalTokens = burmeseSyllableCount + englishWordCount;

  return {
    minutes,
    time: totalTimeMs,
    words: {
      burmese: burmeseSyllableCount,
      english: englishWordCount,
      total: totalTokens,
    },
    text: `${minutes} min read`,
  };
}