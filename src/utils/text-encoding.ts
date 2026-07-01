export interface TextEncodingWarning {
  type: "mojibake_suspected";
  field?: string;
  snippet?: string;
  message: string;
}

const MOJIBAKE_PATTERNS = [
  /\u00D0[\u0080-\u00BF]/,
  /\u00D1[\u0080-\u00AF]/,
  /\u00C3[\u0080-\u00BF]/,
  /\u00EF\u00BF\u00BD/,
  /[\u00C0-\u00FF]{2,}[\u0400-\u04FF]/,
  /[\u0400-\u04FF][\u00C0-\u00FF]{2,}/,
];

const MOJIBAKE_SAMPLE_STRINGS = [
  "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082",
  "\u00D0\u0090\u00D1\u0080\u00D1\u0082\u00D0\u00B5\u00D0\u00BC\u00D0\u00B8\u00D1\u0081",
  "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082",
  "\u00D0\u00A0\u00D0\u00B5\u00D0\u00B3\u00D0\u00B8\u00D1\u0081\u00D1\u0082\u00D1\u0080\u00D0\u00B0\u00D1\u0086\u00D0\u00B8\u00D1\u008F",
  "\u00EF\u00BF\u00BD",
];

function hasMojibakePattern(value: string): boolean {
  for (const pattern of MOJIBAKE_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

export function detectLikelyMojibake(value: string): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  if (hasMojibakePattern(value)) {
    return true;
  }

  for (const sample of MOJIBAKE_SAMPLE_STRINGS) {
    if (value.includes(sample)) {
      return true;
    }
  }

  const hasCyrillic = /[\u0400-\u04FF]/.test(value);
  const hasHighBytes = /[\u00C0-\u00FF]{2,}/.test(value);
  if (hasCyrillic && hasHighBytes) {
    return true;
  }

  return false;
}

export function collectTextEncodingWarnings(
  input: Record<string, unknown>
): TextEncodingWarning[] {
  const warnings: TextEncodingWarning[] = [];

  function checkValue(val: unknown, fieldPath: string) {
    if (typeof val === "string") {
      if (detectLikelyMojibake(val)) {
        const snippet = val.length > 80 ? val.slice(0, 80) + "..." : val;
        warnings.push({
          type: "mojibake_suspected",
          field: fieldPath,
          snippet,
          message: `Possible mojibake detected in field "${fieldPath}". Ensure text is encoded as UTF-8 and not passed through CP1251 or similar encoding.`,
        });
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => checkValue(item, `${fieldPath}[${i}]`));
    } else if (val !== null && typeof val === "object") {
      for (const [key, nested] of Object.entries(val as Record<string, unknown>)) {
        checkValue(nested, fieldPath ? `${fieldPath}.${key}` : key);
      }
    }
  }

  for (const [key, value] of Object.entries(input)) {
    checkValue(value, key);
  }

  return warnings;
}
