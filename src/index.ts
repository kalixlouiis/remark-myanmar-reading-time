import { toString } from 'mdast-util-to-string';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { calculateReadingTime } from './core/counter';
import type { ReadingTimeOptions, MyanmarReadingTimeResult } from './types';

// Re-export core utilities for developers who need pure functions without Remark
export { calculateReadingTime } from './core/counter';
export { tokenizeBurmese } from './core/segmenter';
export * from './types';

/**
 * Remark plugin to compute accurate reading time for Myanmar (Burmese) and mixed content.
 * Injects structured results into `file.data.astro.frontmatter` (Astro)
 * and `file.data.matter` (Next.js / general unified ecosystems).
 */
export default function remarkMyanmarReadingTime(options: ReadingTimeOptions = {}) {
  return function (tree: Root, file: VFile): void {
    // Extract plain readable text from the markdown abstract syntax tree
    const textContent = toString(tree);

    // Compute reading time metrics using our rule-based engine
    const result: MyanmarReadingTimeResult = calculateReadingTime(textContent, options);

    // 1. Astro support: inject into frontmatter
    file.data = file.data || {};
    const astroData = (file.data.astro = (file.data.astro as Record<string, any>) || {});
    astroData.frontmatter = astroData.frontmatter || {};
    astroData.frontmatter.readingTime = result;

    // 2. Next.js / Gray-matter / MDX support: inject into matter data
    const matterData = (file.data.matter = (file.data.matter as Record<string, any>) || {});
    matterData.readingTime = result;
  };
}