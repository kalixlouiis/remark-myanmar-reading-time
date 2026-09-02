import { describe, it, expect } from 'vitest';
import { remark } from 'remark';
import remarkMyanmarReadingTime from '../src/index';

describe('Remark Plugin Integration (remarkMyanmarReadingTime)', () => {
  it('should inject readingTime object into Astro frontmatter', async () => {
    const markdownContent = `
# မြန်မာဝဘ်ဆိုက်များအတွက် လမ်းညွှန်

ဤဆောင်းပါးသည် ခေတ်မီ modern web framework များတွင် မြန်မာစာအသုံးပြုပုံကို ရှင်းပြထားပါသည်။
    `.trim();

    const file = await remark()
      .use(remarkMyanmarReadingTime)
      .process(markdownContent);

    const astroFrontmatter = (file.data as any)?.astro?.frontmatter;

    expect(astroFrontmatter).toBeDefined();
    expect(astroFrontmatter.readingTime).toBeDefined();
    expect(astroFrontmatter.readingTime.minutes).toBe(1);
    expect(astroFrontmatter.readingTime.words.burmese).toBeGreaterThan(0);
    expect(astroFrontmatter.readingTime.text).toBe('1 min read');
  });

  it('should inject readingTime object into Next.js / Gray-matter file data', async () => {
    const markdownContent = `
# Mixed Content Test

Astro and Next.js are popular web frameworks in Myanmar developer community.
    `.trim();

    const file = await remark()
      .use(remarkMyanmarReadingTime)
      .process(markdownContent);

    const matterData = (file.data as any)?.matter;

    expect(matterData).toBeDefined();
    expect(matterData.readingTime).toBeDefined();
    expect(matterData.readingTime.words.english).toBeGreaterThan(0);
  });

  it('should respect custom options passed to the plugin', async () => {
    // Large repeated text to test custom reading speed
    const repeatedBurmese = 'လေ့လာသင်ယူခြင်းသည် ကောင်းမွန်သောအလေ့အကျင့်ဖြစ်ပါသည်။ '.repeat(100);

    const file = await remark()
      // Set very fast speed (1000 syllables/min)
      .use(remarkMyanmarReadingTime, { spmBurmese: 1000 })
      .process(repeatedBurmese);

    const result = (file.data as any).astro.frontmatter.readingTime;
    expect(result.minutes).toBeDefined();
    expect(result.words.burmese).toBeGreaterThan(500);
  });
});