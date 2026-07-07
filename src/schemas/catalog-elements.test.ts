import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  folderCreateSchema,
  folderUpdateSchema,
  folderDeleteSchema,
  fileAddToCatalogSchema,
  fileDeleteFromCatalogSchema,
  linkCreateSchema,
  linkDeleteSchema,
  text2CreateSchema,
  text2DeleteSchema,
  videoAddToCatalogSchema,
  videoDeleteFromCatalogSchema,
  catalogGroupAddSchema,
  catalogGroupDeleteSchema,
  catalogOrderSchema,
  catalogElementOrderSchema,
  catalogBulkDeleteSchema,
  catalogMenuAddSchema,
  catalogMenuDeleteSchema,
} from "./catalog-elements";

describe("catalog-elements schema shapes - raw shape validation", () => {
  describe("folderCreateSchema", () => {
    it("can be wrapped in z.object for MCP tool registration", () => {
      const schema = z.object(folderCreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        name: "Test Folder",
        description: "Test folder description",
        viewOptions: "textOnly",
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields (catalogId, name, description, viewOptions)", () => {
      const schema = z.object(folderCreateSchema);
      const result = schema.safeParse({ dry_run: true });
      expect(result.success).toBe(false);
    });

    it("rejects missing required description", () => {
      const schema = z.object(folderCreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        name: "Test Folder",
        viewOptions: "textOnly",
        dry_run: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.filter(i => i.path.includes("description"));
        expect(issues.length).toBeGreaterThan(0);
      }
    });

    it("accepts all optional fields", () => {
      const schema = z.object(folderCreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        name: "Test Folder",
        description: "Test description",
        isHtmlText: false,
        externalId: "folder-1",
        order: 1,
        coverImageUrl: "https://example.com/image.jpg",
        viewOptions: "textAndImage",
        textLogoImageUrl: "https://example.com/logo1.jpg",
        fullLogoImageUrl: "https://example.com/logo2.jpg",
        aclGroupsExternalIds: [1001, 1002],
        dry_run: true,
        confirm: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid viewOptions", () => {
      const schema = z.object(folderCreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        name: "Test Folder",
        viewOptions: "invalid",
        dry_run: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("folderUpdateSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(folderUpdateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        folderId: 100,
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("requires catalogId and folderId", () => {
      const schema = z.object(folderUpdateSchema);
      const result = schema.safeParse({ dry_run: true });
      expect(result.success).toBe(false);
    });
  });

  describe("folderDeleteSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(folderDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        folderId: 100,
        dry_run: true,
        confirm: false,
        danger_confirm: "DELETE_EVENTICIOUS_CATALOG_FOLDER",
      });
      expect(result.success).toBe(true);
    });

    it("accepts danger_confirm literal for real deletion", () => {
      const schema = z.object(folderDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        folderId: 100,
        dry_run: false,
        confirm: true,
        danger_confirm: "DELETE_EVENTICIOUS_CATALOG_FOLDER",
      });
      expect(result.success).toBe(true);
    });

    it("rejects wrong danger_confirm value by literal type", () => {
      const schema = z.object(folderDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        folderId: 100,
        dry_run: false,
        confirm: true,
        danger_confirm: "WRONG",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("fileAddToCatalogSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(fileAddToCatalogSchema);
      const result = schema.safeParse({
        catalogId: 1,
        fileId: 100,
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const schema = z.object(fileAddToCatalogSchema);
      const result = schema.safeParse({ catalogId: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe("fileDeleteFromCatalogSchema", () => {
    it("can be wrapped in z.object with danger_confirm", () => {
      const schema = z.object(fileDeleteFromCatalogSchema);
      const result = schema.safeParse({
        catalogId: 1,
        catalogElementId: 100,
        dry_run: true,
        confirm: false,
        danger_confirm: "DELETE_EVENTICIOUS_CATALOG_CONTENT",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("linkCreateSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(linkCreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        name: "Test Link",
        url: "https://example.com",
        viewOptions: "textOnly",
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const schema = z.object(linkCreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        name: "Test Link",
        url: "not-a-url",
        viewOptions: "textOnly",
        dry_run: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("text2CreateSchema", () => {
    it("accepts GravityJson object", () => {
      const schema = z.object(text2CreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        text: { type: "doc", content: [{ type: "text", text: "Hello" }] },
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts JSON string", () => {
      const schema = z.object(text2CreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        text: '{"type":"doc","content":[]}',
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts markdown string", () => {
      const schema = z.object(text2CreateSchema);
      const result = schema.safeParse({
        catalogId: 1,
        text: "# Title\n\nSome content",
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("videoAddToCatalogSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(videoAddToCatalogSchema);
      const result = schema.safeParse({
        catalogId: 1,
        videoId: 100,
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("catalogGroupAddSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(catalogGroupAddSchema);
      const result = schema.safeParse({
        catalogId: 1,
        groups: [{ externalId: 1001, order: 1 }],
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing groups array", () => {
      const schema = z.object(catalogGroupAddSchema);
      const result = schema.safeParse({ catalogId: 1, dry_run: true });
      expect(result.success).toBe(false);
    });
  });

  describe("catalogOrderSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(catalogOrderSchema);
      const result = schema.safeParse({
        catalogIds: [1, 2, 3],
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("requires catalogIds array", () => {
      const schema = z.object(catalogOrderSchema);
      const result = schema.safeParse({ dry_run: true });
      expect(result.success).toBe(false);
    });
  });

  describe("catalogElementOrderSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(catalogElementOrderSchema);
      const result = schema.safeParse({
        catalogId: 1,
        orderedItems: [{ id: 100, type: "Catalog" }],
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("catalogBulkDeleteSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(catalogBulkDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts subcatalogIds and elementIds", () => {
      const schema = z.object(catalogBulkDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        subcatalogIds: [10, 20],
        elementIds: [100, 200],
        dry_run: true,
        danger_confirm: "DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("catalogMenuAddSchema", () => {
    it("can be wrapped in z.object", () => {
      const schema = z.object(catalogMenuAddSchema);
      const result = schema.safeParse({
        catalogId: 1,
        dry_run: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("catalogMenuDeleteSchema", () => {
    it("can be wrapped in z.object with danger_confirm", () => {
      const schema = z.object(catalogMenuDeleteSchema);
      const result = schema.safeParse({
        catalogId: 1,
        dry_run: false,
        confirm: true,
        danger_confirm: "CHANGE_EVENTICIOUS_CATALOG_ORDER",
      });
      expect(result.success).toBe(true);
    });
  });
});