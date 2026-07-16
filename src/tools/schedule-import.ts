import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "../logger";
import { EventiciousRequestInfo } from "../auth";
import { detectLikelyMojibake } from "../utils/text-encoding";

interface NormalizedRow {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  locationId?: number;
  tagNames?: string[];
  tagIds?: number[];
  speakerNames?: string[];
  speakerEmails?: string[];
  speakerIds?: number[];
  aclGroupNames?: string[];
  aclGroupsIds?: number[];
  attachments?: { title: string; url: string }[];
  externalId?: string;
  type?: number;
}

interface SchedulePlan {
  normalizedRows: NormalizedRow[];
  locationsToCreate: { name: string; suggestedId: number }[];
  tagsToCreate: { name: string; suggestedId: number }[];
  speakersToResolve: { name?: string; email?: string; id?: number; resolved: boolean }[];
  speakersToCreateAsUsers: { firstName: string; lastName: string; email?: string; suggestedId: number }[];
  aclGroupsToResolve: { name?: string; id?: number; resolved: boolean }[];
  aclGroupsToCreate: { name: string; suggestedId: number }[];
  sessionsToCreate: { id: number; title: string; startTime: string; endTime: string; locationRef?: string; tagRefs?: string[]; speakerRefs?: string[]; aclGroupRefs?: string[] }[];
  attachmentsToCreate: { sessionId: number; title: string; url: string }[];
  warnings: string[];
  errors: string[];
  recommendedExecutionOrder: string[];
}

function normalizeDateTime(dateStr?: string, timeStr?: string, isoStr?: string): string | undefined {
  if (isoStr) return isoStr;
  if (dateStr && timeStr) return `${dateStr}T${timeStr}`;
  if (dateStr) return `${dateStr}T00:00`;
  return undefined;
}

function checkRowEncodingWarnings(row: NormalizedRow, rowIndex: number): { field: string; message: string }[] {
  const warnings: { field: string; message: string }[] = [];
  const fields: [string, string | undefined][] = [
    ["title", row.title],
    ["locationName", row.locationName],
    ["description", row.description],
  ];

  if (row.tagNames) {
    for (let i = 0; i < row.tagNames.length; i++) {
      fields.push([`tagNames[${i}]`, row.tagNames[i]]);
    }
  }
  if (row.speakerNames) {
    for (let i = 0; i < row.speakerNames.length; i++) {
      fields.push([`speakerNames[${i}]`, row.speakerNames[i]]);
    }
  }
  if (row.aclGroupNames) {
    for (let i = 0; i < row.aclGroupNames.length; i++) {
      fields.push([`aclGroupNames[${i}]`, row.aclGroupNames[i]]);
    }
  }

  for (const [field, value] of fields) {
    if (value && detectLikelyMojibake(value)) {
      warnings.push({
        field: `Row ${rowIndex + 1}.${field}`,
        message: `Possible mojibake detected in "${field}". Ensure text is UTF-8 encoded.`,
      });
    }
  }

  return warnings;
}

function matchByName<T extends { id: number; name: string }>(items: T[], name: string): T | undefined {
  return items.find(i => i.name.toLowerCase() === name.toLowerCase());
}

function matchUserByEmail<T extends { id: number; email?: string }>(items: T[], email: string): T | undefined {
  return items.find(i => i.email?.toLowerCase() === email.toLowerCase());
}

export function registerScheduleImportTools(
  server: McpServer,
  _credentials: ReturnType<typeof import("../auth").extractEventiciousCredentials>,
  requestContext?: EventiciousRequestInfo,
  acceptLanguage?: string
) {
  server.tool(
    "eventicious_prepare_schedule_import",
    "Builds an import plan only. Does not write to Eventicious. Pure helper — no Eventicious API calls. Use before real schedule import. For Russian text use UTF-8. In direct PowerShell 5.1 HTTP JSON calls do not pass JSON as -Body string; use UTF-8 bytes.",
    {
      rows: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        startTime: z.string().optional(),
        startsAt: z.string().optional(),
        endDate: z.string().optional(),
        endTime: z.string().optional(),
        endsAt: z.string().optional(),
        locationName: z.string().optional(),
        locationId: z.number().optional(),
        tagNames: z.array(z.string()).optional(),
        tagIds: z.array(z.number()).optional(),
        speakerNames: z.array(z.string()).optional(),
        speakerEmails: z.array(z.string()).optional(),
        speakerIds: z.array(z.number()).optional(),
        aclGroupNames: z.array(z.string()).optional(),
        aclGroupsIds: z.array(z.number()).optional(),
        attachments: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
        externalId: z.string().optional(),
        type: z.number().optional(),
      })).min(1).describe("Schedule rows from Excel/JSON"),
      existingLocations: z.array(z.object({ id: z.number(), name: z.string() })).optional().describe("Already known locations"),
      existingTags: z.array(z.object({ id: z.number(), name: z.string() })).optional().describe("Already known tags"),
      existingAclGroups: z.array(z.object({ id: z.number(), name: z.string() })).optional().describe("Already known ACL groups"),
      existingUsersOrSpeakers: z.array(z.object({ id: z.number(), firstName: z.string(), lastName: z.string(), email: z.string().optional() })).optional().describe("Already known users/speakers"),
      options: z.object({
        createMissingLocations: z.boolean().default(true),
        createMissingTags: z.boolean().default(true),
        createMissingAclGroups: z.boolean().default(false),
        createMissingSpeakersAsUsers: z.boolean().default(false),
        timezone: z.string().optional(),
        defaultLanguage: z.string().optional(),
      }).optional(),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_prepare_schedule_import", row_count: params.rows.length });

      const opts = params.options || { createMissingLocations: true, createMissingTags: true, createMissingAclGroups: false, createMissingSpeakersAsUsers: false };
      const existingLocations = params.existingLocations || [];
      const existingTags = params.existingTags || [];
      const existingAclGroups = params.existingAclGroups || [];
      const existingSpeakers = params.existingUsersOrSpeakers || [];

      const warnings: string[] = [];
      const errors: string[] = [];
      const encodingWarnings: { field: string; message: string }[] = [];
      const normalizedRows: NormalizedRow[] = [];
      const locationsToCreate = new Map<string, { name: string; suggestedId: number }>();
      const tagsToCreate = new Map<string, { name: string; suggestedId: number }>();
      const speakersToResolve: { name?: string; email?: string; id?: number; resolved: boolean }[] = [];
      const speakersToCreateAsUsers: { firstName: string; lastName: string; email?: string; suggestedId: number }[] = [];
      const aclGroupsToResolve: { name?: string; id?: number; resolved: boolean }[] = [];
      const aclGroupsToCreate = new Map<string, { name: string; suggestedId: number }>();
      const sessionsToCreate: SchedulePlan["sessionsToCreate"] = [];
      const attachmentsToCreate: SchedulePlan["attachmentsToCreate"] = [];
      let nextId = 900000000;

      for (let i = 0; i < params.rows.length; i++) {
        const row = params.rows[i];
        const rowPrefix = `Row ${i + 1}`;

        const startIso = normalizeDateTime(row.startDate, row.startTime, row.startsAt);
        const endIso = normalizeDateTime(row.endDate, row.endTime, row.endsAt);

        if (!startIso) errors.push(`${rowPrefix}: missing start time (provide startDate+startTime or startsAt)`);
        if (!endIso) errors.push(`${rowPrefix}: missing end time (provide endDate+endTime or endsAt)`);

        let locationId = row.locationId;
        if (row.locationName && !locationId) {
          const found = matchByName(existingLocations, row.locationName);
          if (found) {
            locationId = found.id;
          } else if (opts.createMissingLocations && !locationsToCreate.has(row.locationName.toLowerCase())) {
            const suggestedId = nextId++;
            locationsToCreate.set(row.locationName.toLowerCase(), { name: row.locationName, suggestedId });
          }
        }

        const tagIds = [...(row.tagIds || [])];
        if (row.tagNames) {
          for (const tagName of row.tagNames) {
            const found = matchByName(existingTags, tagName);
            if (found) {
              tagIds.push(found.id);
            } else if (opts.createMissingTags && !tagsToCreate.has(tagName.toLowerCase())) {
              const suggestedId = nextId++;
              tagsToCreate.set(tagName.toLowerCase(), { name: tagName, suggestedId });
            }
          }
        }

        const resolvedSpeakerIds = [...(row.speakerIds || [])];
        if (row.speakerNames || row.speakerEmails) {
          const names = row.speakerNames || [];
          const emails = row.speakerEmails || [];
          const maxLen = Math.max(names.length, emails.length);
          for (let s = 0; s < maxLen; s++) {
            const sName = names[s];
            const sEmail = emails[s];
            let resolved = false;
            if (sEmail) {
              const found = matchUserByEmail(existingSpeakers, sEmail);
              if (found) { resolvedSpeakerIds.push(found.id); resolved = true; }
            }
            if (!resolved && sName) {
              const found = existingSpeakers.find(sp => `${sp.firstName} ${sp.lastName}`.toLowerCase() === sName.toLowerCase());
              if (found) { resolvedSpeakerIds.push(found.id); resolved = true; }
            }
            speakersToResolve.push({ name: sName, email: sEmail, resolved });
            if (!resolved && opts.createMissingSpeakersAsUsers && sName) {
              const parts = sName.split(" ");
              const suggestedId = nextId++;
              speakersToCreateAsUsers.push({ firstName: parts[0] || sName, lastName: parts.slice(1).join(" ") || "Speaker", email: sEmail, suggestedId });
            } else if (!resolved) {
              warnings.push(`${rowPrefix}: speaker "${sName || sEmail}" not found and createMissingSpeakersAsUsers=false`);
            }
          }
        }

        const resolvedAclGroupIds = [...(row.aclGroupsIds || [])];
        if (row.aclGroupNames) {
          for (const gName of row.aclGroupNames) {
            const found = matchByName(existingAclGroups, gName);
            if (found) {
              resolvedAclGroupIds.push(found.id);
            } else if (opts.createMissingAclGroups && !aclGroupsToCreate.has(gName.toLowerCase())) {
              const suggestedId = nextId++;
              aclGroupsToCreate.set(gName.toLowerCase(), { name: gName, suggestedId });
            } else {
              warnings.push(`${rowPrefix}: ACL group "${gName}" not found and createMissingAclGroups=false — session will be visible to all`);
            }
          }
        }

        const sessionId = row.externalId ? parseInt(row.externalId, 10) || nextId++ : nextId++;

        const normalizedRow: NormalizedRow = {
          title: row.title,
          description: row.description,
          startTime: startIso || "",
          endTime: endIso || "",
          locationName: row.locationName,
          locationId,
          tagNames: row.tagNames,
          tagIds: [...new Set(tagIds)],
          speakerNames: row.speakerNames,
          speakerEmails: row.speakerEmails,
          speakerIds: [...new Set(resolvedSpeakerIds)],
          aclGroupNames: row.aclGroupNames,
          aclGroupsIds: [...new Set(resolvedAclGroupIds)],
          attachments: row.attachments,
          externalId: row.externalId,
          type: row.type,
        };

        normalizedRows.push(normalizedRow);
        encodingWarnings.push(...checkRowEncodingWarnings(normalizedRow, i));

        sessionsToCreate.push({
          id: sessionId,
          title: row.title,
          startTime: startIso || "",
          endTime: endIso || "",
          locationRef: row.locationName,
          tagRefs: row.tagNames,
          speakerRefs: row.speakerNames,
          aclGroupRefs: row.aclGroupNames,
        });

        if (row.attachments) {
          for (const att of row.attachments) {
            attachmentsToCreate.push({ sessionId, title: att.title, url: att.url });
          }
        }
      }

      const plan: SchedulePlan & { encodingWarnings: { field: string; message: string }[] } = {
        normalizedRows,
        locationsToCreate: Array.from(locationsToCreate.values()),
        tagsToCreate: Array.from(tagsToCreate.values()),
        speakersToResolve,
        speakersToCreateAsUsers,
        aclGroupsToResolve,
        aclGroupsToCreate: Array.from(aclGroupsToCreate.values()),
        sessionsToCreate,
        attachmentsToCreate,
        warnings,
        errors,
        encodingWarnings,
        recommendedExecutionOrder: [
          "1. Create locations (if createMissingLocations=true)",
          "2. Create tags (if createMissingTags=true)",
          "3. Create speakers as users (if createMissingSpeakersAsUsers=true)",
          "4. Create/resolve ACL groups (if createMissingAclGroups=true)",
          "5. Create sessions",
          "6. Create session attachments",
        ],
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(plan, null, 2) }],
      };
    }
  );

  server.tool(
    "eventicious_validate_schedule_plan",
    "Validates an import plan only. Does not write to Eventicious. Checks for conflicts, missing fields, and warnings. Pure helper — no Eventicious API calls. For Russian text use UTF-8.",
    {
      plan: z.any().describe("Output from eventicious_prepare_schedule_import"),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_validate_schedule_plan" });

      const plan = params.plan as SchedulePlan;
      const errors: string[] = [...(plan.errors || [])];
      const warnings: string[] = [...(plan.warnings || [])];

      const sessions = plan.sessionsToCreate || [];
      const attachments = plan.attachmentsToCreate || [];

      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        if (!s.title) errors.push(`Session ${i + 1}: missing title`);
        if (!s.startTime) errors.push(`Session "${s.title}": missing startTime`);
        if (!s.endTime) errors.push(`Session "${s.title}": missing endTime`);
        if (s.startTime && s.endTime && new Date(s.endTime) <= new Date(s.startTime)) {
          errors.push(`Session "${s.title}": endTime must be after startTime`);
        }
      }

      const externalIds = sessions.map(s => sessionsToCreateFindExternalId(plan, s)).filter(Boolean);
      const dupes = externalIds.filter((id, idx) => externalIds.indexOf(id) !== idx);
      if (dupes.length > 0) warnings.push(`Duplicate externalId detected: ${dupes.join(", ")}`);

      for (const s of sessions) {
        if (!s.locationRef && (!s.locationRef || s.locationRef === undefined)) {
          warnings.push(`Session "${s.title}": no location reference — may be visible in all locations`);
        }
        const missingTags = (s.tagRefs || []).filter(t => !(plan.tagsToCreate || []).some(tc => tc.name.toLowerCase() === t.toLowerCase()));
        if (missingTags.length > 0) warnings.push(`Session "${s.title}": tag(s) not resolved: ${missingTags.join(", ")}`);
      }

      const totalSessions = sessions.length;
      const locationsCount = (plan.locationsToCreate || []).length;
      const tagsCount = (plan.tagsToCreate || []).length;
      const speakersCount = (plan.speakersToResolve || []).length;
      const aclGroupsCount = (plan.aclGroupsToResolve || []).length + (plan.aclGroupsToCreate || []).length;
      const attachmentsCount = attachments.length;
      const conflictsCount = errors.filter(e => e.includes("overlap") || e.includes("conflict")).length;

      const valid = errors.length === 0;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            valid,
            errors,
            warnings,
            summary: { totalSessions, locationsCount, tagsCount, speakersCount, aclGroupsCount, attachmentsCount, conflictsCount },
          }, null, 2),
        }],
      };
    }
  );
}

function sessionsToCreateFindExternalId(plan: SchedulePlan, session: SchedulePlan["sessionsToCreate"][number]): string | undefined {
  const idx = plan.sessionsToCreate.indexOf(session);
  if (idx >= 0 && idx < plan.normalizedRows.length) {
    return plan.normalizedRows[idx].externalId;
  }
  return undefined;
}
