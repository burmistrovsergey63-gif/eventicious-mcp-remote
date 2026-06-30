import { describe, it, expect } from "vitest";
import { normalizeAndValidateBaseUrl } from "./eventicious-credentials";

describe("eventicious-credentials utility", () => {
  describe("normalizeAndValidateBaseUrl", () => {
    it("normalizes trailing slash", () => {
      const result = normalizeAndValidateBaseUrl("https://api.example.ru/");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.normalized).toBe("https://api.example.ru");
      }
    });

    it("removes quotes", () => {
      const result = normalizeAndValidateBaseUrl('"https://api.example.ru"');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.normalized).toBe("https://api.example.ru");
      }
    });

    it("trims spaces", () => {
      const result = normalizeAndValidateBaseUrl("  https://api.example.ru  ");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.normalized).toBe("https://api.example.ru");
      }
    });

    it("rejects empty URL", () => {
      const result = normalizeAndValidateBaseUrl("");
      expect(result.ok).toBe(false);
    });

    it("rejects non-http URL", () => {
      const result = normalizeAndValidateBaseUrl("ftp://api.example.ru");
      expect(result.ok).toBe(false);
    });

    it("rejects token endpoint URL", () => {
      const result = normalizeAndValidateBaseUrl("https://api.example.ru/connect/token");
      expect(result.ok).toBe(false);
    });
  });
});