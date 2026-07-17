/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phonetic Bangla Transliterator Engine (Avro-style Rules)
 */

export interface PhoneticRule {
  pattern: string;
  replacement: string;
}

// Consonants list to identify conjunct triggers
export const CONSONANTS = new Set([
  'k', 'g', 'c', 'j', 'T', 'D', 'R', 'N', 't', 'd', 'n', 'p', 'f', 'b', 'v', 'm', 'z', 'r', 'l', 's', 'h'
]);

// Vowels mapping
export const INDEPENDENT_VOWELS: Record<string, string> = {
  'a': 'অ',
  'A': 'আ',
  'i': 'ই',
  'I': 'ঈ',
  'u': 'উ',
  'U': 'ঊ',
  'e': 'এ',
  'o': 'ও',
  'O': 'ও',
  'oi': 'ঐ',
  'ou': 'ঔ',
  'rri': 'ঋ',
};

export const DEPENDENT_VOWELS: Record<string, string> = {
  'a': 'া', // akar
  'i': 'ি', // ikar
  'I': 'ী', // eekhar
  'u': 'ু', // ukhar
  'U': 'ূ', // uukhar
  'e': 'ে', // ekhar
  'o': 'ো', // okhar
  'oi': 'ৈ', // oikhar
  'ou': 'ৌ', // oukhar
  'rri': 'ৃ', // rrikhar
};

// Default consonants and consonant clusters mapping
export const DEFAULT_CONSONANT_RULES: PhoneticRule[] = [
  { pattern: 'kh', replacement: 'খ' },
  { pattern: 'gh', replacement: 'ঘ' },
  { pattern: 'ch', replacement: 'ছ' },
  { pattern: 'jh', replacement: 'ঝ' },
  { pattern: 'Th', replacement: 'ঠ' },
  { pattern: 'Dh', replacement: 'ঢ' },
  { pattern: 'th', replacement: 'থ' },
  { pattern: 'dh', replacement: 'ধ' },
  { pattern: 'ph', replacement: 'ফ' },
  { pattern: 'bh', replacement: 'ভ' },
  { pattern: 'sh', replacement: 'শ' },
  { pattern: 'Sh', replacement: 'ষ' },
  { pattern: 'Ng', replacement: 'ঙ' },
  { pattern: 'ng', replacement: 'ং' },
  { pattern: 'Y', replacement: 'ঞ' },
  { pattern: 'R', replacement: 'ড়' },
  { pattern: 'Rh', replacement: 'ঢ়' },
  { pattern: 't`', replacement: 'ৎ' },
  
  { pattern: 'k', replacement: 'ক' },
  { pattern: 'g', replacement: 'গ' },
  { pattern: 'c', replacement: 'চ' },
  { pattern: 'j', replacement: 'জ' },
  { pattern: 'T', replacement: 'ট' },
  { pattern: 'D', replacement: 'ড' },
  { pattern: 't', replacement: 'ত' },
  { pattern: 'd', replacement: 'দ' },
  { pattern: 'n', replacement: 'ন' },
  { pattern: 'p', replacement: 'প' },
  { pattern: 'f', replacement: 'ফ' },
  { pattern: 'b', replacement: 'ব' },
  { pattern: 'v', replacement: 'ভ' },
  { pattern: 'm', replacement: 'ম' },
  { pattern: 'z', replacement: 'য' },
  { pattern: 'r', replacement: 'র' },
  { pattern: 'l', replacement: 'ল' },
  { pattern: 's', replacement: 'স' },
  { pattern: 'h', replacement: 'হ' },
  { pattern: 'N', replacement: 'ণ' },
];

// Special additions
export const SPECIAL_RULES: PhoneticRule[] = [
  { pattern: 'w', replacement: 'ও' },
  { pattern: 'y', replacement: 'য়' },
  { pattern: 'x', replacement: 'ক্স' },
  { pattern: 'q', replacement: 'ক' },
];

/**
 * Parses English phonetic text into Bangla unicode.
 * This function translates phonetic inputs dynamically, word-by-word or character-by-character.
 */
export function transliterate(text: string, customRules?: PhoneticRule[]): string {
  if (!text) return '';

  const rules = customRules || [
    ...DEFAULT_CONSONANT_RULES,
    ...SPECIAL_RULES
  ];

  let result = '';
  let i = 0;
  const n = text.length;

  while (i < n) {
    // 1. Check for vowels
    let vowelMatch = '';
    let vowelLen = 0;

    // Check longer vowel combinations first (e.g. 'rri', 'oi', 'ou')
    for (const len of [3, 2, 1]) {
      if (i + len <= n) {
        const sub = text.substring(i, i + len);
        if (sub in INDEPENDENT_VOWELS) {
          vowelMatch = sub;
          vowelLen = len;
          break;
        }
      }
    }

    if (vowelMatch) {
      // Check if previous character was a consonant to decide if we use Dependent Vowel (Kar)
      const prevChar = i > 0 ? text[i - 1].toLowerCase() : '';
      const hasConsonantPrev = prevChar && (
        CONSONANTS.has(prevChar) || 
        // Handle clusters like kh, sh, etc.
        (prevChar === 'h' && i > 1 && CONSONANTS.has(text[i - 2].toLowerCase())) ||
        (prevChar === 'g' && i > 1 && text[i - 2].toLowerCase() === 'n')
      );

      if (hasConsonantPrev) {
        // Apply dependent vowel (kar)
        const kar = DEPENDENT_VOWELS[vowelMatch];
        result += kar || INDEPENDENT_VOWELS[vowelMatch];
      } else {
        // Apply independent vowel
        result += INDEPENDENT_VOWELS[vowelMatch];
      }
      i += vowelLen;
      continue;
    }

    // 2. Check for consonant rules (including clusters)
    let matchFound = false;
    for (const rule of rules) {
      const len = rule.pattern.length;
      if (i + len <= n && text.substring(i, i + len) === rule.pattern) {
        // Check if we need to insert a Hasant (্) for a conjunct.
        // A conjunct is formed if the PREVIOUS parsed item was also a consonant,
        // and we are NOT separated by a vowel.
        if (result.length > 0 && i > 0) {
          const prevInputChar = text[i - 1].toLowerCase();
          // If previous input character was a consonant, and current is consonant, insert Hasant (্)
          const isCurrentConsonant = CONSONANTS.has(rule.pattern[0].toLowerCase());
          const isPrevConsonant = CONSONANTS.has(prevInputChar);

          // Exception: Do not link if previous is part of a vowel or special cluster
          if (isPrevConsonant && isCurrentConsonant) {
            // Check if they are not already joined or separated
            result += '্'; // Bengali Hasant (U+09CD)
          }
        }

        result += rule.replacement;
        i += len;
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      // Just copy the character (numbers, punctuation, symbols)
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Helper to check if a word can be phonetic
 */
export function isPhoneticInput(char: string): boolean {
  return /^[a-zA-Z`]$/.test(char);
}
