import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerScheduleImportTools } from "./schedule-import";

function createTestTools() {
  const tools: Record<string, { description: string; handler: Function }> = {};
  const mockServer = {
    tool: (name: string, description: string, schema: unknown, handler: Function) => {
      tools[name] = { description, handler };
    },
  } as unknown as McpServer;

  registerScheduleImportTools(mockServer, {} as never);
  return tools;
}

async function callPrepare(args: Record<string, unknown>) {
  const tools = createTestTools();
  const handler = tools["eventicious_prepare_schedule_import"].handler;
  const result = await handler(args);
  const text = result.content[0].text;
  return JSON.parse(text);
}

async function callValidate(args: Record<string, unknown>) {
  const tools = createTestTools();
  const handler = tools["eventicious_validate_schedule_plan"].handler;
  const result = await handler(args);
  const text = result.content[0].text;
  return JSON.parse(text);
}

const FULL_DEFAULTS = {
  createMissingLocations: true,
  createMissingTags: true,
  createMissingAclGroups: false,
  createMissingSpeakersAsUsers: false,
};

// ─────────────────────────────────────────────────
// 1. Valid minimal schedule row
// ─────────────────────────────────────────────────
describe("schedule-import: valid minimal row", () => {
  it("plan with title, startsAt, endsAt, locationName", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Opening Keynote",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          locationName: "Main Hall",
        },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(1);
    expect(plan.sessionsToCreate[0].title).toBe("Opening Keynote");
    expect(plan.sessionsToCreate[0].startTime).toBe("2026-09-01T10:00");
    expect(plan.sessionsToCreate[0].endTime).toBe("2026-09-01T11:00");
    expect(plan.sessionsToCreate[0].locationRef).toBe("Main Hall");
    expect(plan.errors).toHaveLength(0);
    expect(plan.locationsToCreate).toHaveLength(1);
    expect(plan.locationsToCreate[0].name).toBe("Main Hall");
  });
});

// ─────────────────────────────────────────────────
// 2. Valid via startDate/startTime + endDate/endTime
// ─────────────────────────────────────────────────
describe("schedule-import: split date+time", () => {
  it("normalizes startDate+startTime to ISO", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Workshop",
          startDate: "2026-09-01",
          startTime: "14:00",
          endDate: "2026-09-01",
          endTime: "16:00",
        },
      ],
    });

    expect(plan.sessionsToCreate[0].startTime).toBe("2026-09-01T14:00");
    expect(plan.sessionsToCreate[0].endTime).toBe("2026-09-01T16:00");
    expect(plan.errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────
// 3. Multiple sessions in one day
// ─────────────────────────────────────────────────
describe("schedule-import: multiple sessions one day", () => {
  it("creates distinct sessions", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "Morning Talk", startsAt: "2026-09-01T09:00", endsAt: "2026-09-01T10:00" },
        { title: "Afternoon Talk", startsAt: "2026-09-01T14:00", endsAt: "2026-09-01T15:00" },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(2);
    expect(plan.sessionsToCreate[0].title).toBe("Morning Talk");
    expect(plan.sessionsToCreate[1].title).toBe("Afternoon Talk");
  });
});

// ─────────────────────────────────────────────────
// 4. Multiple days
// ─────────────────────────────────────────────────
describe("schedule-import: multiple days", () => {
  it("handles sessions across different dates", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "Day 1 Session", startsAt: "2026-09-01T10:00", endsAt: "2026-09-01T11:00" },
        { title: "Day 2 Session", startsAt: "2026-09-02T10:00", endsAt: "2026-09-02T11:00" },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(2);
    expect(plan.sessionsToCreate[0].startTime).toContain("2026-09-01");
    expect(plan.sessionsToCreate[1].startTime).toContain("2026-09-02");
  });
});

// ─────────────────────────────────────────────────
// 5. Session with speakerNames, tagNames, aclGroupNames
// ─────────────────────────────────────────────────
describe("schedule-import: names for speakers/tags/acl", () => {
  it("queues unknown names for creation", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Panel Discussion",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          speakerNames: ["Alice Smith"],
          tagNames: ["AI", "ML"],
          aclGroupNames: ["VIP"],
        },
      ],
      options: { ...FULL_DEFAULTS, createMissingSpeakersAsUsers: true, createMissingAclGroups: true },
    });

    expect(plan.speakersToCreateAsUsers).toHaveLength(1);
    expect(plan.speakersToCreateAsUsers[0].firstName).toBe("Alice");
    expect(plan.tagsToCreate).toHaveLength(2);
    expect(plan.aclGroupsToCreate).toHaveLength(1);
    expect(plan.aclGroupsToCreate[0].name).toBe("VIP");
  });
});

// ─────────────────────────────────────────────────
// 6. Existing IDs: locationId, tagIds, speakerIds, aclGroupsIds
// ─────────────────────────────────────────────────
describe("schedule-import: existing IDs", () => {
  it("uses direct IDs without resolution", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Direct ID Session",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          locationId: 42,
          tagIds: [10, 20],
          speakerIds: [100],
          aclGroupsIds: [500],
        },
      ],
    });

    expect(plan.sessionsToCreate[0].locationRef).toBeUndefined();
    expect(plan.normalizedRows[0].locationId).toBe(42);
    expect(plan.normalizedRows[0].tagIds).toEqual([10, 20]);
    expect(plan.normalizedRows[0].speakerIds).toEqual([100]);
    expect(plan.normalizedRows[0].aclGroupsIds).toEqual([500]);
    expect(plan.locationsToCreate).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────
// 7. Mixed names and IDs
// ─────────────────────────────────────────────────
describe("schedule-import: mixed names and IDs", () => {
  it("locationId takes precedence; tagNames resolved via existingTags", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Mixed Session",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          locationName: "Room A",
          locationId: 42,
          tagNames: ["Existing Tag"],
          tagIds: [10],
        },
      ],
      existingTags: [{ id: 88, name: "Existing Tag" }],
    });

    expect(plan.normalizedRows[0].locationId).toBe(42);
    expect(plan.normalizedRows[0].tagIds).toContain(10);
    expect(plan.normalizedRows[0].tagIds).toContain(88);
  });
});

// ─────────────────────────────────────────────────
// 8. Empty input rows → Zod error
// ─────────────────────────────────────────────────
describe("schedule-import: empty rows", () => {
  it("returns error for empty rows", async () => {
    const plan = await callPrepare({ rows: [] });

    expect(plan.errors).toBeDefined();
    expect(plan.sessionsToCreate).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────
// 9. Missing title → no error in current implementation
// ─────────────────────────────────────────────────
describe("schedule-import: missing title", () => {
  it("row with empty title passes (title optional in schema)", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
        },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(1);
    expect(plan.sessionsToCreate[0].title).toBe("");
  });
});

// ─────────────────────────────────────────────────
// 10. Missing start time → error
// ─────────────────────────────────────────────────
describe("schedule-import: missing start time", () => {
  it("returns error for row without start time", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "No Start",
          endsAt: "2026-09-01T11:00",
        },
      ],
    });

    expect(plan.errors.length).toBeGreaterThan(0);
    expect(plan.errors.some((e: string) => e.includes("start time"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 11. Missing end time → error
// ─────────────────────────────────────────────────
describe("schedule-import: missing end time", () => {
  it("returns error for row without end time", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "No End",
          startsAt: "2026-09-01T10:00",
        },
      ],
    });

    expect(plan.errors.length).toBeGreaterThan(0);
    expect(plan.errors.some((e: string) => e.includes("end time"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 12. End before start → caught in validate
// ─────────────────────────────────────────────────
describe("schedule-import: end before start", () => {
  it("validate catches endTime <= startTime", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Backwards",
          startsAt: "2026-09-01T14:00",
          endsAt: "2026-09-01T10:00",
        },
      ],
    });

    const validation = await callValidate({ plan });

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e: string) => e.includes("endTime must be after startTime"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 13. Same start/end → validation catches
// ─────────────────────────────────────────────────
describe("schedule-import: same start and end", () => {
  it("validate catches equal start and end times", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Zero Duration",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T10:00",
        },
      ],
    });

    const validation = await callValidate({ plan });

    expect(validation.errors.some((e: string) => e.includes("endTime must be after startTime"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 14. Invalid date format → accepted (no validation in prepare)
// ─────────────────────────────────────────────────
describe("schedule-import: invalid date format", () => {
  it("prepare accepts any string for startsAt", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Bad Date",
          startsAt: "not-a-date",
          endsAt: "also-not-a-date",
        },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(1);
    expect(plan.sessionsToCreate[0].startTime).toBe("not-a-date");
  });
});

// ─────────────────────────────────────────────────
// 15. Invalid time format → accepted (no validation)
// ─────────────────────────────────────────────────
describe("schedule-import: invalid time format", () => {
  it("prepare accepts any string for startTime", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Bad Time",
          startDate: "2026-09-01",
          startTime: "25:99",
          endDate: "2026-09-01",
          endTime: "99:99",
        },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(1);
    expect(plan.sessionsToCreate[0].startTime).toBe("2026-09-01T25:99");
  });
});

// ─────────────────────────────────────────────────
// 16. Duplicate sessions
// ─────────────────────────────────────────────────
describe("schedule-import: duplicate sessions", () => {
  it("prepare does not warn about duplicate titles", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "Same Talk", startsAt: "2026-09-01T10:00", endsAt: "2026-09-01T11:00" },
        { title: "Same Talk", startsAt: "2026-09-01T14:00", endsAt: "2026-09-01T15:00" },
      ],
    });

    expect(plan.sessionsToCreate).toHaveLength(2);
    expect(plan.warnings).toHaveLength(0);
  });

  it("validate warns about duplicate externalIds", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "A", startsAt: "2026-09-01T10:00", endsAt: "2026-09-01T11:00", externalId: "ext-1" },
        { title: "B", startsAt: "2026-09-01T14:00", endsAt: "2026-09-01T15:00", externalId: "ext-1" },
      ],
    });

    const validation = await callValidate({ plan });
    expect(validation.warnings.some((w: string) => w.includes("Duplicate externalId"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 17. Unknown speaker without createMissingSpeakersAsUsers
// ─────────────────────────────────────────────────
describe("schedule-import: unknown speaker warning", () => {
  it("warns when speaker not found and createMissingSpeakersAsUsers=false", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          speakerNames: ["Unknown Person"],
        },
      ],
      options: { ...FULL_DEFAULTS, createMissingSpeakersAsUsers: false },
    });

    expect(plan.warnings.some((w: string) => w.includes("speaker"))).toBe(true);
    expect(plan.speakersToCreateAsUsers).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────
// 18. Missing ACL group without createMissingAclGroups
// ─────────────────────────────────────────────────
describe("schedule-import: missing ACL group warning", () => {
  it("warns when ACL group not found and createMissingAclGroups=false", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          aclGroupNames: ["Restricted"],
        },
      ],
      options: { ...FULL_DEFAULTS, createMissingAclGroups: false },
    });

    expect(plan.warnings.some((w: string) => w.includes("ACL group"))).toBe(true);
    expect(plan.warnings.some((w: string) => w.includes("visible to all"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 19. Russian text in title/location/speaker/tag
// ─────────────────────────────────────────────────
describe("schedule-import: Russian UTF-8 text", () => {
  it("preserves Cyrillic text without mojibake", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Открытие конференции",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          locationName: "Главный зал",
          speakerNames: ["Иван Петров"],
          tagNames: ["ИИ", "Машинное обучение"],
        },
      ],
      options: { ...FULL_DEFAULTS, createMissingSpeakersAsUsers: true },
    });

    expect(plan.sessionsToCreate[0].title).toBe("Открытие конференции");
    expect(plan.sessionsToCreate[0].locationRef).toBe("Главный зал");
    expect(plan.locationsToCreate[0].name).toBe("Главный зал");
    expect(plan.speakersToCreateAsUsers[0].firstName).toBe("Иван");
    expect(plan.tagsToCreate).toHaveLength(2);
    expect(plan.tagsToCreate[0].name).toBe("ИИ");
  });
});

// ─────────────────────────────────────────────────
// 20. Mojibake-looking text → encoding warning
// ─────────────────────────────────────────────────
describe("schedule-import: mojibake detection", () => {
  it("returns encoding warnings for mojibake text", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "\u00D0\u009F\u00D1\u0080\u00D0\u00B8\u00D0\u00B2\u00D0\u00B5\u00D1\u0082",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
        },
      ],
    });

    expect(plan.encodingWarnings).toBeDefined();
    expect(plan.encodingWarnings.length).toBeGreaterThan(0);
  });

  it("does not flag normal Russian text", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Нормальный русский заголовок",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
        },
      ],
    });

    expect(plan.encodingWarnings).toBeDefined();
    expect(plan.encodingWarnings).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────
// Dry-run / safety tests
// ─────────────────────────────────────────────────
describe("schedule-import: safety", () => {
  it("prepare tool description mentions no API calls", () => {
    const tools = createTestTools();
    const desc = tools["eventicious_prepare_schedule_import"].description;
    expect(desc.toLowerCase()).toContain("no eventicious api calls");
    expect(desc.toLowerCase()).toContain("does not write to eventicious");
  });

  it("validate tool description mentions no API calls", () => {
    const tools = createTestTools();
    const desc = tools["eventicious_validate_schedule_plan"].description;
    expect(desc.toLowerCase()).toContain("no eventicious api calls");
    expect(desc.toLowerCase()).toContain("does not write to eventicious");
  });

  it("prepare result is a plan, not execution", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "Test", startsAt: "2026-09-01T10:00", endsAt: "2026-09-01T11:00" },
      ],
    });

    expect(plan).toHaveProperty("sessionsToCreate");
    expect(plan).toHaveProperty("normalizedRows");
    expect(plan).toHaveProperty("warnings");
    expect(plan).toHaveProperty("errors");
    expect(plan).toHaveProperty("recommendedExecutionOrder");
    expect(plan.recommendedExecutionOrder).toBeInstanceOf(Array);
  });

  it("validate result is a report, not execution", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "Test", startsAt: "2026-09-01T10:00", endsAt: "2026-09-01T11:00" },
      ],
    });

    const validation = await callValidate({ plan });
    expect(validation).toHaveProperty("valid");
    expect(validation).toHaveProperty("errors");
    expect(validation).toHaveProperty("warnings");
    expect(validation).toHaveProperty("summary");
    expect(typeof validation.valid).toBe("boolean");
  });
});

// ─────────────────────────────────────────────────
// Edge: startDate only (no startTime)
// ─────────────────────────────────────────────────
describe("schedule-import: startDate only", () => {
  it("defaults time to 00:00, no error for missing endDate", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "All Day",
          startDate: "2026-09-01",
        },
      ],
    });

    expect(plan.sessionsToCreate[0].startTime).toBe("2026-09-01T00:00");
    expect(plan.errors.some((e: string) => e.includes("end time"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// Edge: startsAt with no endsAt
// ─────────────────────────────────────────────────
describe("schedule-import: startsAt without endsAt", () => {
  it("returns error for missing end time", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "No End",
          startsAt: "2026-09-01T10:00",
        },
      ],
    });

    expect(plan.errors.some((e: string) => e.includes("end time"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// Edge: speaker with email matching
// ─────────────────────────────────────────────────
describe("schedule-import: speaker email match", () => {
  it("resolves speaker by email", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          speakerNames: ["Alice"],
          speakerEmails: ["alice@example.com"],
        },
      ],
      existingUsersOrSpeakers: [
        { id: 42, firstName: "Alice", lastName: "Smith", email: "alice@example.com" },
      ],
    });

    expect(plan.normalizedRows[0].speakerIds).toContain(42);
    expect(plan.speakersToResolve[0].resolved).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// Edge: speaker with name matching
// ─────────────────────────────────────────────────
describe("schedule-import: speaker name match", () => {
  it("resolves speaker by full name", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          speakerNames: ["Alice Smith"],
        },
      ],
      existingUsersOrSpeakers: [
        { id: 42, firstName: "Alice", lastName: "Smith" },
      ],
    });

    expect(plan.normalizedRows[0].speakerIds).toContain(42);
    expect(plan.speakersToResolve[0].resolved).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// Edge: attachments
// ─────────────────────────────────────────────────
describe("schedule-import: attachments", () => {
  it("includes attachments in plan", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          attachments: [{ title: "Slides", url: "https://example.com/slides.pdf" }],
        },
      ],
    });

    expect(plan.attachmentsToCreate).toHaveLength(1);
    expect(plan.attachmentsToCreate[0].title).toBe("Slides");
    expect(plan.attachmentsToCreate[0].url).toBe("https://example.com/slides.pdf");
  });
});

// ─────────────────────────────────────────────────
// Edge: deduplication of IDs
// ─────────────────────────────────────────────────
describe("schedule-import: deduplication", () => {
  it("deduplicates tag IDs", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          tagIds: [10, 10, 20],
          tagNames: ["New"],
        },
      ],
    });

    expect(plan.normalizedRows[0].tagIds).toEqual([10, 20]);
  });

  it("deduplicates speaker IDs", async () => {
    const plan = await callPrepare({
      rows: [
        {
          title: "Talk",
          startsAt: "2026-09-01T10:00",
          endsAt: "2026-09-01T11:00",
          speakerIds: [42, 42],
          speakerNames: ["Alice Smith"],
        },
      ],
      existingUsersOrSpeakers: [
        { id: 42, firstName: "Alice", lastName: "Smith" },
      ],
    });

    expect(plan.normalizedRows[0].speakerIds).toEqual([42]);
  });
});

// ─────────────────────────────────────────────────
// Edge: recommendedExecutionOrder
// ─────────────────────────────────────────────────
describe("schedule-import: execution order", () => {
  it("includes recommended execution order", async () => {
    const plan = await callPrepare({
      rows: [
        { title: "Talk", startsAt: "2026-09-01T10:00", endsAt: "2026-09-01T11:00" },
      ],
    });

    expect(plan.recommendedExecutionOrder).toBeInstanceOf(Array);
    expect(plan.recommendedExecutionOrder.length).toBeGreaterThan(0);
    expect(plan.recommendedExecutionOrder.some((s: string) => s.includes("locations"))).toBe(true);
    expect(plan.recommendedExecutionOrder.some((s: string) => s.includes("sessions"))).toBe(true);
  });
});
