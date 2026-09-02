import { describe, it, expect } from 'vitest';
import { tokenizeBurmese } from '../src/core/segmenter';
import { calculateReadingTime } from '../src/core/counter';

describe('Myanmar Syllable Tokenizer (tokenizeBurmese)', () => {
  it('should return an empty array for empty or whitespace strings', () => {
    expect(tokenizeBurmese('')).toEqual([]);
    expect(tokenizeBurmese('   ')).toEqual([]);
  });

  it('should segment basic Burmese syllables correctly', () => {
    // "မင်္ဂလာပါ" -> "မင်", "ဂ", "လာ", "ပါ"
    const tokens = tokenizeBurmese('မင်္ဂလာပါ');
    expect(tokens).toEqual(['မင်္ဂ', 'လာ', 'ပါ']);
  });

  it('should keep sticky suffixes merged with the preceding syllable', () => {
    // "နှင့်" + "င့်" should not detach
    const tokens = tokenizeBurmese('စာဖတ်ခြင်းနှင့်လေ့လာခြင်း');
    expect(tokens).toContain('နှင့်');
    expect(tokens).not.toContain('င့်');
  });

  it('should handle stacked characters like ဿ without over-segmentation', () => {
    const tokens = tokenizeBurmese('ပြဿနာ');
    expect(tokens).toContain('ပြဿ');
  });

  it('should group Burmese digits and Western numbers correctly', () => {
    const tokens = tokenizeBurmese('၂၀၂၆ ခုနှစ် 100 days');
    expect(tokens).toContain('၂၀၂၆');
    expect(tokens).toContain('100');
  });
});

describe('Reading Time Calculator (calculateReadingTime)', () => {
  it('should return 0 minutes for empty content', () => {
    const result = calculateReadingTime('');
    expect(result.minutes).toBe(0);
    expect(result.words.total).toBe(0);
  });

  it('should calculate Burmese syllable count accurately', () => {
    const text = 'ကွန်ပျူတာသိပ္ပံပညာရပ်ကို လေ့လာကြပါစို့။';
    const result = calculateReadingTime(text);

    expect(result.words.burmese).toBeGreaterThan(0);
    expect(result.words.english).toBe(0);
    expect(result.minutes).toBe(1); // Standard short text rounds up to 1 min
  });

  it('should handle mixed Burmese and English tech articles', () => {
    const mixedText = `
      Astro framework ဟာ content-driven website တွေအတွက် အရမ်းမြန်တဲ့ web framework ဖြစ်ပါတယ်။
      Zero JavaScript by default architecture ကို အသုံးပြုထားပါတယ်။
    `;

    const result = calculateReadingTime(mixedText);

    expect(result.words.english).toBeGreaterThan(0);
    expect(result.words.burmese).toBeGreaterThan(0);
    expect(result.words.total).toBe(result.words.burmese + result.words.english);
  });

  it('should exclude markdown code blocks by default', () => {
    const contentWithCode = `
      Markdown စာသားအပိုင်း ဖြစ်ပါတယ်။

      \`\`\`typescript
      const greet = "Hello world";
      console.log(greet);
      for (let i = 0; i < 100; i++) {
        // Many technical code lines here
      }
      \`\`\`

      ဆက်လက်ဖတ်ရှုရန် စာသားအပိုင်း ဖြစ်ပါတယ်။
    `;

    const withoutExclusion = calculateReadingTime(contentWithCode, { excludeCodeBlocks: false });
    const withExclusion = calculateReadingTime(contentWithCode, { excludeCodeBlocks: true });

    // With exclusion active, English words inside code blocks must not inflate the word count
    expect(withExclusion.words.english).toBeLessThan(withoutExclusion.words.english);
  });
});