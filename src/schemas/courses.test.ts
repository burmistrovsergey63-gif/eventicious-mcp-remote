import { describe, it, expect } from "vitest";
import { z } from "zod";
import { courseImportSchema } from "./courses";

describe("courses schema - courseImportSchema", () => {
  it("accepts valid input with description", () => {
    const schema = z.object(courseImportSchema);
    const result = schema.safeParse({
      name: "Test Course",
      description: "Course description",
      coverImageFileId: 1,
      coverImageThumbnailFileId: 2,
      settings: {
        progress: { isEnabled: true, hintText: "Progress" },
        finalScreen: { isEnabled: true, title: "Done", text: "Complete" },
        deadline: { isEnabled: true, fixedDeadlineDate: "2026-12-31" },
        isFreeOrderAllowed: true,
      },
      stages: [{ name: "Stage 1", type: "Common" }],
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing description", () => {
    const schema = z.object(courseImportSchema);
    const result = schema.safeParse({
      name: "Test Course",
      coverImageFileId: 1,
      coverImageThumbnailFileId: 2,
      settings: {
        progress: { isEnabled: true, hintText: "Progress" },
        finalScreen: { isEnabled: true, title: "Done", text: "Complete" },
        deadline: { isEnabled: true, fixedDeadlineDate: "2026-12-31" },
        isFreeOrderAllowed: true,
      },
      dry_run: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.filter(i => i.path.includes("description"));
      expect(issues.length).toBeGreaterThan(0);
    }
  });
});