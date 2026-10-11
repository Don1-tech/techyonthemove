const profanity = [
  "asshole",
  "arse",
  "bastard",
  "bitch",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dick",
  "fuck",
  "motherfucker",
  "piss",
  "shit",
  "slut",
  "whore",
];

export class ReviewValidationError extends Error {}

function decodeForInspection(value: string): string {
  let decoded = value;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    let next = decoded;

    next = next.replace(
      /%([0-9a-f]{2})/gi,
      (_sequence, byte: string) =>
        String.fromCharCode(Number.parseInt(byte, 16))
    );

    next = next
      .replace(/&amp;/gi, "&")
      .replace(/&colon;/gi, ":")
      .replace(/&tab;/gi, "\t")
      .replace(/&newline;/gi, "\n")
      .replace(/&(?:lt|#0*60|#x0*3c);?/gi, "<")
      .replace(/&(?:gt|#0*62|#x0*3e);?/gi, ">")
      .replace(/&(?:quot|#0*34|#x0*22);?/gi, '"')
      .replace(/&(?:apos|#0*39|#x0*27);?/gi, "'");
    next = next.replace(
      /&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));?/gi,
      (entity, hex: string | undefined, decimal: string | undefined) => {
        const codePoint = Number.parseInt(hex ?? decimal ?? "", hex ? 16 : 10);
        return codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }
    );

    if (next === decoded) {
      break;
    }

    decoded = next;
  }

  return decoded;
}

function normalizeLetters(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function normalizeCustomerName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en");
}

export function containsUnsafeMarkup(value: string): boolean {
  const inspected = decodeForInspection(value);
  const compact = inspected.replace(/[\u0000-\u0020\u007f]/g, "");

  return (
    /<\s*[a-z/!?]/i.test(inspected) ||
    /\bon[a-z]{3,}\s*=/i.test(inspected) ||
    /on[a-z]{3,}=/.test(compact) ||
    /javascript:/.test(compact.toLocaleLowerCase("en")) ||
    /data:text\/html/i.test(compact) ||
    /srcdoc=/.test(compact.toLocaleLowerCase("en")) ||
    /expression\(/i.test(compact)
  );
}

function containsProfanity(value: string): boolean {
  const words = value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .match(/\p{L}+/gu) ?? [];

  const plainText = normalizeLetters(value).replace(
    /[013457@$]/g,
    (character) =>
      ({
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
      })[character] ?? character
  );

  return words.some((word) => profanity.includes(word)) ||
    profanity.some((word) => plainText.includes(word));
}

function isObviousSpam(value: string): boolean {
  const compact = normalizeLetters(value);
  const longConsonantRun = value
    .toLocaleLowerCase("en")
    .match(/\b\p{L}{12,}\b/gu)
    ?.some((word) => !/[aeiouy]/i.test(word) || (word.match(/[aeiouy]/gi)?.length ?? 0) < word.length * 0.18);

  return (
    /(.)\1{5,}/u.test(value) ||
    /\b(?:qwerty|asdf|zxcv|12345|09876)\b/i.test(value) ||
    /\b(?:https?:\/\/|www\.)/i.test(value) ||
    /\b(.{2,30})(?:\s+\1){3,}\b/i.test(value) ||
    (compact.length >= 8 && new Set(compact).size <= 2) ||
    Boolean(longConsonantRun)
  );
}

export function validateReviewSubmission(
  customerName: string,
  reviewText: string
): string | null {
  if (!customerName.trim() || !reviewText.trim()) {
    return "Enter your name and review before submitting.";
  }

  if (!/[a-z0-9]/i.test(reviewText)) {
    return "Please provide a little more detail about your experience.";
  }

  if (containsUnsafeMarkup(customerName) || containsUnsafeMarkup(reviewText)) {
    return "HTML and script-like content are not allowed in reviews.";
  }

  if (
    containsProfanity(customerName) ||
    containsProfanity(reviewText)
  ) {
    return "Please remove abusive language from your review.";
  }

  if (isObviousSpam(customerName) || isObviousSpam(reviewText)) {
    return "Please enter a genuine name and review.";
  }

  if (!/\p{L}/u.test(customerName)) {
    return "Enter a valid customer name.";
  }

  if (!/\p{L}{3}/u.test(reviewText)) {
    return "Please provide a little more detail about your experience.";
  }

  return null;
}
