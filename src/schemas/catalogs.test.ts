import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  catalogCreateSchema,
  catalogUpdateSchema,
  catalogDeleteSchema,
} from "./catalogs";

describe("catalogs schema shapes", () => {
  describe("catalogCreateSchema", () => {
    it("accepts valid input with description", () => {
      const schema = z.object(catalogCreateSchema);
      const result = schema.safeParse({
        name: "Test Catalog",
        description: "Catalog description",
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing description", () => {
      const schema = z.object(catalogCreateSchema);
      const result = schema.safeParse({
        name: "Test Catalog",
        dry_run: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.filter(i => i.path.includes("description"));
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0].message).toContain("Required");
      }
    });

    it("accepts empty description (non-undefined is sufficient for API)", () => {
      const schema = z.object(catalogCreateSchema);
      const result = schema.safeParse({
        name: "Test Catalog",
        description: "",
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all optional fields", () => {
      const schema = z.object(catalogCreateSchema);
      const result = schema.safeParse({
        name: "Test Catalog",
        description: "Catalog description",
        isHtmlText: true,
        externalId: "cat-1",
        order: 1,
        coverImageUrl: "https://example.com/cover.jpg",
        viewOptions: "textAndImage",
        textLogoImageUrl: "https://example.com/logo.png",
        fullLogoImageUrl: "https://example.com/full.png",
        aclGroupsExternalIds: [1001, 1002],
        dry_run: true,
        confirm: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("catalogUpdateSchema", () => {
    it("accepts minimal update (description stays optional for update)", () => {
      const schema = z.object(catalogUpdateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("catalogDeleteSchema", () => {
    it("accepts valid delete input", () => {
      const schema = z.object(catalogDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        dry_run: true,
        confirm: false,
      });
      expect(result.success).toBe(true);
    });
  });
});