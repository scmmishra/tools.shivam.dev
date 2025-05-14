/**
 * Counts syllables in a word using a basic heuristic.
 * @param word The word to count syllables in.
 * @returns The estimated number of syllables.
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length === 0) return 0;
  // Basic heuristic for short words
  if (word.length <= 3) return 1;

  // Remove non-alphabetic characters
  word = word.replace(/[^a-z]/g, "");
  if (word.length === 0) return 0;

  let syllableCount = 0;
  const vowels = "aeiouy";

  // Rule 1: Count vowel groups
  let lastCharIsVowel = false;
  for (let i = 0; i < word.length; i++) {
    const charIsVowel = vowels.includes(word[i]);
    if (charIsVowel && !lastCharIsVowel) {
      syllableCount++;
    }
    lastCharIsVowel = charIsVowel;
  }

  // Rule 2: Subtract 1 for silent 'e' at the end (except for 'le')
  if (
    word.endsWith("e") &&
    !word.endsWith("le") &&
    syllableCount > 1 &&
    !vowels.includes(word[word.length - 2]) // Ensure 'e' isn't the only vowel sound
  ) {
    syllableCount--;
  }

  // Rule 3: Add 1 if ends in 'le' and preceded by a consonant
  if (
    word.endsWith("le") &&
    word.length > 2 &&
    !vowels.includes(word[word.length - 3])
  ) {
    // Check if the 'e' in 'le' was already counted; if not, add syllable
    if (!vowels.includes(word[word.length - 2])) {
      // This case is tricky, often 'le' adds a syllable if not counted before
      // Let's refine: if the base count is low and ends 'le', it likely adds one
    }
    // Simpler: The previous vowel count often handles 'le' correctly enough for this heuristic
  }

  // Rule 4: Ensure at least one syllable for any word with letters
  return Math.max(1, syllableCount);
}

export interface ReadabilityScore {
  score: number;
  level: string;
  grade: string;
}

/**
 * Calculates the Flesch Reading Ease score for a given text.
 * @param text The input text.
 * @returns The Flesch Reading Ease score details including score, level, and grade.
 */
export function calculateFleschReadingEase(text: string): ReadabilityScore {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      level: "Invalid",
      grade: "N/A",
    };
  }

  // 1. Count Sentences
  // Split by sentence-ending punctuation. Filter out empty strings.
  const sentenceMatches = text.split(/[.!?]+/).filter(Boolean);
  const sentenceCount = sentenceMatches.length;
  if (sentenceCount === 0) {
    return {
      score: 0,
      level: "Invalid",
      grade: "N/A",
    };
  }

  // 2. Count Words
  // Split by whitespace and filter out empty strings.
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;
  if (wordCount === 0) {
    return {
      score: 0,
      level: "Invalid",
      grade: "N/A",
    };
  }

  // 3. Count Syllables
  const totalSyllables = words.reduce((total, word) => total + countSyllables(word), 0);
  if (totalSyllables === 0) {
    return {
      score: 0,
      level: "Invalid",
      grade: "N/A",
    };
  }

  // 4. Apply Flesch Reading Ease Formula
  // Score = 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
  const score = Math.max(
    0,
    Math.min(
      100,
      206.835 -
        1.015 * (wordCount / sentenceCount) -
        84.6 * (totalSyllables / wordCount)
    )
  );

  // Determine reading level and grade
  let level: string;
  let grade: string;

  if (score >= 90) {
    level = "Very Easy";
    grade = "5th Grade";
  } else if (score >= 80) {
    level = "Easy";
    grade = "6th Grade";
  } else if (score >= 70) {
    level = "Fairly Easy";
    grade = "7th Grade";
  } else if (score >= 60) {
    level = "Standard";
    grade = "8th-9th Grade";
  } else if (score >= 50) {
    level = "Fairly Difficult";
    grade = "10th-12th Grade";
  } else if (score >= 30) {
    level = "Difficult";
    grade = "College";
  } else {
    level = "Very Confusing";
    grade = "College Graduate";
  }

  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal place
    level,
    grade,
  };
}
