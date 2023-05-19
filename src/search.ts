import { ratio } from "fuzzball";

export function bestMatchingSubstring(
  searchString: string,
  textString: string
) {
  let bestMatch: string | null = null;
  let bestScore = 0;
  let bestStartIdx = -1;
  const lenSearchString = searchString.split(" ").length;

  const textStringWords = textString.split(" ");

  for (let i = 0; i < textStringWords.length; i++) {
    for (let j = i + lenSearchString; j <= textStringWords.length; j++) {
      const substring = textStringWords.slice(i, j).join(" ");
      const score = ratio(searchString, substring);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = substring;
        bestStartIdx = i;
      }
    }
  }

  return {
    bestMatch,
    bestScore,
    bestStartIdx,
  };
}
