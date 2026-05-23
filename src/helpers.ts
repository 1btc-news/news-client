export function countWords(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countWordsAndEstimateReadingTime(
  str: string,
  wordsPerMinute: number = 200
): { wordCount: number; readingTime: number } {
  const wordCount = countWords(str);
  const readingTime = wordCount === 0 ? 0 : Math.ceil(wordCount / wordsPerMinute);
  return { wordCount, readingTime };
}
