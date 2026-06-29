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

## Migration Attempt Notes

**2026-06-29** - Migration completed successfully with raw shape approach:

### Why raw shape approach was chosen
- MCP SDK `server.tool()` expects `ZodRawShape` (inline object), not pre-built `ZodObject`
- `.shape` property extraction was not viable due to Zod API differences
- Raw shapes exported from `src/schemas/*.ts` become source of truth
- `z.object(shape)` wrapper used in tests validates shape compatibility

### Users shapes added
- `createUserShape` - for eventicious_create_users tool
- `updateUserShape` - for eventicious_update_users tool  
- `blockUsersShape` - for eventicious_block_users tool
- `unblockUsersShape` - for eventicious_unblock_users tool
- `deleteUsersShape` - for eventicious_delete_users tool
- `addMentorsShape` - for eventicious_add_user_mentors tool
- `removeMentorsShape` - for eventicious_remove_user_mentors tool

### Groups shapes added
- `createAclGroupShape` - for eventicious_create_acl_group tool
- `updateAclGroupShape` - for eventicious_update_acl_group tool
- `deleteAclGroupShape` - for eventicious_delete_acl_group tool
- `moveUsersShape` - for eventicious_move_users_to_groups tool
- `addRolesShape` - for eventicious_add_user_roles tool
- `removeRolesShape` - for eventicious_remove_user_roles tool
- `roleInfoShape` - shared by addRolesShape/removeRolesShape

### Implementation notes
- Shapes in transport.ts use `.max(maxUsers)` for dynamic limit (config-driven)
- Spread syntax `{...shape, users: shape.users.max(maxUsers)}` overrides array max dynamically
- Legacy ZodObject schemas (`userInputSchema`, `aclGroupSchema`, etc.) preserved for backward compatibility
- All tests passing with both shape and schema validation

### Next scope
- locations/sessions/session-attachments remain inline in their tool files
- Consider migrating after validating this pattern