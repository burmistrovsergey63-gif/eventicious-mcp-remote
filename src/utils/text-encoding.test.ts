import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  detectLikelyMojibake,
  collectTextEncodingWarnings,
} from "./text-encoding";

describe("detectLikelyMojibake", () => {
  it("detects CP1251->UTF8 mojibake for Cyrillic", () => {
    const cp1251Mojibake = "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082";
    expect(detectLikelyMojibake(cp1251Mojibake)).toBe(true);
  });

  it("detects Latin-1->UTF8 mojibake for Cyrillic", () => {
    const latin1Mojibake = "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082";
    expect(detectLikelyMojibake(latin1Mojibake)).toBe(true);
  });

  it("detects replacement character sequences", () => {
    expect(detectLikelyMojibake("text \u00EF\u00BF\u00BD more")).toBe(true);
  });

  it("does not flag normal Russian text", () => {
    const normalRussian = "\u041F\u0440\u0438\u0432\u0435\u0442, \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435, \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435";
    expect(detectLikelyMojibake(normalRussian)).toBe(false);
    expect(detectLikelyMojibake("\u041F\u0440\u0438\u0432\u0435\u0442")).toBe(false);
    expect(detectLikelyMojibake("\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435")).toBe(false);
  });

  it("does not flag English text", () => {
    expect(detectLikelyMojibake("Hello World")).toBe(false);
    expect(detectLikelyMojibake("test123")).toBe(false);
  });

  it("does not flag empty strings", () => {
    expect(detectLikelyMojibake("")).toBe(false);
  });

  it("does not flag non-string values gracefully", () => {
    expect(detectLikelyMojibake(undefined as unknown as string)).toBe(false);
    expect(detectLikelyMojibake(null as unknown as string)).toBe(false);
    expect(detectLikelyMojibake(42 as unknown as string)).toBe(false);
  });
});

describe("collectTextEncodingWarnings", () => {
  it("returns warnings for mojibake in string fields", () => {
    const cp1251Mojibake = "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082";
    const input = {
      name: cp1251Mojibake,
      description: "Normal text",
    };
    const warnings = collectTextEncodingWarnings(input);
    expect(warnings.length).toBe(1);
    expect(warnings[0].field).toBe("name");
    expect(warnings[0].type).toBe("mojibake_suspected");
  });

  it("returns no warnings for clean input", () => {
    const input = {
      name: "\u041F\u0440\u0438\u0432\u0435\u0442",
      description: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C",
    };
    const warnings = collectTextEncodingWarnings(input);
    expect(warnings.length).toBe(0);
  });

  it("checks nested objects", () => {
    const latin1Mojibake = "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082";
    const input = {
      nested: {
        title: latin1Mojibake,
      },
    };
    const warnings = collectTextEncodingWarnings(input);
    expect(warnings.length).toBe(1);
    expect(warnings[0].field).toBe("nested.title");
  });

  it("checks array elements", () => {
    const cp1251Mojibake = "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082";
    const input = {
      items: ["\u041F\u0440\u0438\u0432\u0435\u0442", cp1251Mojibake],
    };
    const warnings = collectTextEncodingWarnings(input);
    expect(warnings.length).toBe(1);
    expect(warnings[0].field).toBe("items[1]");
  });

  it("truncates long snippets", () => {
    const cp1251Mojibake = "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082";
    const longMojibake = cp1251Mojibake.repeat(10);
    const input = { text: longMojibake };
    const warnings = collectTextEncodingWarnings(input);
    expect(warnings.length).toBe(1);
    expect(warnings[0].snippet!.length).toBeLessThan(longMojibake.length);
    expect(warnings[0].snippet).toContain("...");
  });
});
