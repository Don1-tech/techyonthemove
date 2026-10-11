export function normalizeKenyanPhone(value: string): string | null {
  const trimmed = value.trim();

  if (!/^\+?[\d\s().-]+$/.test(trimmed)) {
    return null;
  }

  let digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("254")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!/^[17]\d{8}$/.test(digits)) {
    return null;
  }

  return `+254${digits}`;
}
