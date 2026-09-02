# remark-myanmar-reading-time: Deterministic Syllable Segmentation and Accurate Reading Time Estimator for Myanmar (Burmese) Script

[![npm version](https://img.shields.io/npm/v/remark-myanmar-reading-time.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/remark-myanmar-reading-time)
[![License](https://img.shields.io/badge/license-Apache--2.0-green.svg?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/kalixlouiis/remark-myanmar-reading-time/release.yml?branch=main&style=flat-square)](https://github.com/kalixlouiis/remark-myanmar-reading-time/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6.svg?style=flat-square)](https://www.typescriptlang.org/)

An accurate, zero-dependency, rule-based reading time estimator and syllable segmenter for the **Myanmar (Burmese) script** and mixed-language technical content. Designed as a universal Remark plugin for **Astro**, **Next.js**, **Nuxt Content**, and modern unified markdown pipelines.

---

## The Problem: Why Existing Solutions Fail

Standard reading time libraries (e.g., `reading-time`) compute duration by splitting text on Unicode whitespace boundaries:

$$\text{Reading Time} = \frac{\text{Whitespace-delimited Tokens}}{\text{WPM}}$$

This assumption introduces fundamental failures for Burmese script:

1. **Unsegmented Writing System:** Burmese is an abugida written continuously without spaces between words or syllables. Spaces serve syntactic or aesthetic purposes rather than lexical boundaries. Whitespace-based tokenizers register an entire Burmese paragraph as a single "word," resulting in drastically underestimated reading times (e.g., `0 min read` for 1,000 syllables).
2. **Grammatical Affixes & Stacked Characters:** Naive regex character counters fail to handle complex Myanmar grapheme clusters—such as *Kinzi* (`င်္`), *Virama* stacking (`္`), and trailing grammatical suffixes (`င့်`, `ည့်`, `န့်`, `မ့်`, `ယ့်`).
3. **Technical Polyglot Content:** Developer blogs blend English technical vocabulary, inline code, fenced code blocks, and Burmese commentary. Counting code snippets at standard human reading speeds skews estimated metrics.

---

## The Solution: Hybrid Segmenter & Computational Architecture

`remark-myanmar-reading-time` resolves these issues using a deterministic, rule-based syllable tokenizer coupled with a dual-stream rate estimator:

* **Syllable-Level Tokenization:** Analyzes Myanmar Unicode blocks (`U+1000`–`U+109F`, `U+AA60`–`U+AA7F`) using positive and negative lookaround assertions to identify consonant onsets, preserve stacked consonants, and merge grammatical sticky suffixes into single semantic units.
* **Dual Rate Weighting:** Separates Latin tokens from Burmese syllables, calculating composite reading duration across distinct perceptual speeds:
  $$\text{Total Time} = \left(\frac{N_{\text{burmese}}}{S_{\text{burmese}}}\right) + \left(\frac{N_{\text{english}}}{W_{\text{english}}}\right)$$
  *(Defaults: $S_{\text{burmese}} = 350\text{ syllables/min}$, $W_{\text{english}} = 200\text{ words/min}$)*
* **AST Code-Block Stripping:** Automatically excludes AST code nodes and fenced blocks (` ``` `) from text analysis to prevent algorithmic distortion.
* **Structured Data Output:** Injects typed analytical objects rather than hardcoded strings, giving consumers full control over presentation and localization.

---

## Installation

```bash
npm install remark-myanmar-reading-time
# or
pnpm add remark-myanmar-reading-time
# or
yarn add remark-myanmar-reading-time

```

---

## Usage & Framework Integration

### 1. Astro

Add the plugin to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import remarkMyanmarReadingTime from 'remark-myanmar-reading-time';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [
        remarkMyanmarReadingTime,
        {
          spmBurmese: 350, // Syllables per minute for Burmese
          wpmEnglish: 200, // Words per minute for English
          excludeCodeBlocks: true,
        },
      ],
    ],
  },
});

```

Access the injected structured metadata in your `.astro` layout or template:

```astro
---
interface Props {
  frontmatter: {
    title: string;
    readingTime: {
      minutes: number;
      time: number;
      words: {
        burmese: number;
        english: number;
        total: number;
      };
      text: string;
    };
  };
}

const { frontmatter } = Astro.props;
const { readingTime } = frontmatter;
---

<article>
  <header>
    <h1>{frontmatter.title}</h1>
    <div class="meta">
      <span>⏱️ {readingTime.minutes} min read</span>
      <span>🇲🇲 {readingTime.words.burmese} syllables</span>
      <span>🔤 {readingTime.words.english} words</span>
    </div>
  </header>
  <slot />
</article>

```

---

### 2. Next.js (MDX / Contentlayer)

Add to your MDX compiler options (e.g., in `next.config.mjs` or Contentlayer configuration):

```javascript
import nextMDX from '@next/mdx';
import remarkMyanmarReadingTime from 'remark-myanmar-reading-time';

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkMyanmarReadingTime],
  },
});

export default withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
});

```

The plugin populates `vfile.data.matter.readingTime` directly into your page's frontmatter properties.

---

### 3. Standalone Programmatic API (Framework-Agnostic)

You can consume the pure computation engine without Remark:

```typescript
import { calculateReadingTime, tokenizeBurmese } from 'remark-myanmar-reading-time';

// Direct Syllable Tokenization
const tokens = tokenizeBurmese('မင်္ဂလာပါ ခေတ်မီ modern web framework များ');
console.log(tokens);
// Output: [ 'မင်္ဂ', 'လာ', 'ပါ', 'ခေတ်', 'မီ', 'modern', 'web', 'framework', 'များ' ]

// Direct Metric Calculation
const result = calculateReadingTime(`
  Astro framework ဟာ content-driven website တွေအတွက် အရမ်းမြန်တဲ့ framework ဖြစ်ပါတယ်။
  Zero JavaScript by default architecture ကို အသုံးပြုထားပါတယ်။
`);

console.log(result);
/*
Output:
{
  minutes: 1,
  time: 14285,
  words: {
    burmese: 28,
    english: 10,
    total: 38
  },
  text: '1 min read'
}
*/

```

---

## Options & Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `spmBurmese` | `number` | `350` | Estimated Burmese syllables read per minute. |
| `wpmEnglish` | `number` | `200` | Estimated Latin words read per minute. |
| `excludeCodeBlocks` | `boolean` | `true` | When `true`, fenced code blocks and inline code are ignored. |

---

## Data Schema (`MyanmarReadingTimeResult`)

```typescript
export interface MyanmarReadingTimeResult {
  /** Rounded-up reading time in minutes (minimum 1 min for non-empty text) */
  minutes: number;
  /** Exact duration in milliseconds */
  time: number;
  /** Granular token distribution breakdown */
  words: {
    burmese: number;
    english: number;
    total: number;
  };
  /** Fallback formatted string */
  text: string;
}

```

---

## Citation

If you use this package or its syllable segmentation logic in academic research, educational material, or software projects, please cite it as follows:

```bibtex
@software{khant2026remarkmyanmar,
  author = {Khant Sint Heinn},
  title = {remark-myanmar-reading-time: Deterministic Syllable Segmentation and Accurate Reading Time Estimator for Myanmar (Burmese) Script},
  year = {2026},
  publisher = {GitHub},
  url = {https://github.com/kalixlouiis/remark-myanmar-reading-time}
}

```

---

## License

Copyright © 2026 Khant Sint Heinn.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at **[LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)**.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.