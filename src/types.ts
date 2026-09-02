export interface ReadingTimeOptions {
  /**
   * Burmese Syllables Per Minute.
   * @default 350
   */
  spmBurmese?: number;

  /**
   * English Words Per Minute.
   * @default 200
   */
  wpmEnglish?: number;

  /**
   * Whether to exclude markdown code blocks from reading time.
   * @default true
   */
  excludeCodeBlocks?: boolean;
}

export interface MyanmarReadingTimeResult {
  /** Total estimated reading time in rounded-up minutes */
  minutes: number;
  /** Exact time in milliseconds */
  time: number;
  /** Detailed token counts */
  words: {
    burmese: number;
    english: number;
    total: number;
  };
  /** Default fallback text */
  text: string;
}