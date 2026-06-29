# Schema Audit

## Tool Schema Source Analysis

| Tool file | Current schema source | Existing src/schemas match | Risk | Recommendation |
|---|---|---|---|---|
| `src/mcp/transport.ts` | inline | partial (users, groups, sessions, locations, schedule-import) | low | migrate after tests |
| `src/tools/catalog-elements.ts` | imported from schemas/catalog-elements | yes | low | keep as is |
| `src/tools/catalogs.ts` | imported from schemas/catalogs | yes | low | keep as is |
| `src/tools/courses.ts` | imported from schemas/courses | yes | low | keep as is |
| `src/tools/expo.ts` | imported from schemas/expo | yes | low | keep as is |
| `src/tools/task-contents.ts` | imported from schemas/task-contents | yes | low | keep as is |
| `src/tools/polls.ts` | imported from schemas/polls | yes | low | keep as is |
| `src/tools/scorm.ts` | imported from schemas/scorm | yes | low | keep as is |
| `src/tools/gamification.ts` | imported from schemas/gamification | yes | low | keep as is |
| `src/tools/course-import.ts` | imported from schemas/course-import | yes | low | keep as is |
| `src/tools/schedule-import.ts` | inline | partial (schedule-import schema exists but different) | medium | migrate after tests |
| `src/tools/locations.ts` | inline | partial (locations schema exists but different) | medium | migrate after tests |
| `src/tools/sessions.ts` | inline | partial (sessions schema exists) | medium | migrate after tests |
| `src/tools/session-attachments.ts` | inline | partial (session-attachments schema exists) | medium | migrate after tests |
| `src/tools/tags.ts` | inline | partial (tags schema exists) | medium | migrate after tests |
| `src/tools/catalog-import.ts` | inline (helper tool for plan building) | N/A | low | keep as is (helper tool) |
| `src/tools/gravity-json.ts` | inline (helper tool) | N/A | low | keep as is (helper tool) |

## Schemas Available in src/schemas/

| Schema file | Exports | Used by |
|---|---|---|
| `users.ts` | userInputSchema, userIdsSchema, deleteUsersSchema, mentorSchema | transport.ts (should use) |
| `groups.ts` | aclGroupSchema, moveUsersSchema, updateAclGroupSchema, deleteAclGroupSchema, rolesSchema | transport.ts (should use) |
| `common.ts` | dryRunParams | not used |
| `catalogs.ts` | catalogCreateSchema, catalogUpdateSchema, catalogDeleteSchema | catalog-tools (used) |
| `catalog-elements.ts` | folderCreateSchema, folderUpdateSchema, folderDeleteSchema, etc. | catalog-elements (used) |
| `courses.ts` | courseImportSchema, courseFinalizeSchema, courseImageUploadSchema | courses (used) |
| `expo.ts` | exhibitorCreateSchema, exhibitorUpdateSchema, exhibitorDeleteSchema, etc. | expo (used) |
| `task-contents.ts` | taskContentImportSchema, taskAttachmentUploadSchema | task-contents (used) |
| `polls.ts` | pollImportSchema | polls (used) |
| `scorm.ts` | scormUploadSchema | scorm (used) |
| `gamification.ts` | gamificationManualChargeSchema, gamificationValidateChargeSchema | gamification (used) |
| `course-import.ts` | courseImportPlanInputSchema, coursePlanValidationSchema, etc. | course-import (used) |
| `schedule-import.ts` | scheduleImportInputSchema, schedulePlanSchema | schedule-import (not used) |
| `locations.ts` | locationCreateSchema, locationUpdateSchema, locationDeleteSchema | locations (not used) |
| `sessions.ts` | sessionCreateSchema, sessionUpdateSchema, sessionDeleteSchema | sessions (not used) |
| `tags.ts` | tagCreateSchema, tagUpdateSchema, tagDeleteSchema | tags (not used) |
| `session-attachments.ts` | sessionAttachmentCreateSchema, etc. | session-attachments (not used) |

## Safe Migration Candidates

1. **transport.ts** - users and groups tools can use schemas/users.ts and schemas/groups.ts
2. **locations.ts** - has inline schemas, schemas/locations.ts exists with partial overlap

## Higher Risk (not migrating now)

- `schedule-import.ts`, `catalog-import.ts` - helper tools for plan building
- `session-attachments.ts` - complex dry_run/confirm logic
- `gravity-json.ts` - helper tool without MCP tools