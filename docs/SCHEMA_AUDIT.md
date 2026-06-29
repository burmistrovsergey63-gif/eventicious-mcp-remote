# Schema Audit

## Tool Schema Source Analysis

| Tool file | Current schema source | Existing src/schemas match | Risk | Recommendation |
|---|---|---|---|---|
| `src/mcp/transport.ts` | inline | partial (schedule-import) | low | users/groups migrated |
| `src/tools/catalog-elements.ts` | imported from schemas/catalog-elements | yes | low | keep as is |
| `src/tools/catalogs.ts` | imported from schemas/catalogs | yes | low | keep as is |
| `src/tools/courses.ts` | imported from schemas/courses | yes | low | keep as is |
| `src/tools/expo.ts` | imported from schemas/expo | yes | low | keep as is |
| `src/tools/task-contents.ts` | imported from schemas/task-contents | yes | low | keep as is |
| `src/tools/polls.ts` | imported from schemas/polls | yes | low | keep as is |
| `src/tools/scorm.ts` | imported from schemas/scorm | yes | low | keep as is |
| `src/tools/gamification.ts` | imported from schemas/gamification | yes | low | keep as is |
| `src/tools/course-import.ts` | imported from schemas/course-import | yes | low | keep as is |
| `src/tools/schedule-import.ts` | inline | partial (schedule-import schema exists but different) | medium | keep as is (helper tool) |
| `src/tools/locations.ts` | imported from schemas/locations | yes | low | migrated |
| `src/tools/sessions.ts` | imported from schemas/sessions | yes | low | migrated |
| `src/tools/session-attachments.ts` | imported from schemas/session-attachments | yes | low | migrated |
| `src/tools/tags.ts` | inline | partial (tags schema exists) | medium | keep as is |
| `src/tools/catalog-import.ts` | inline (helper tool for plan building) | N/A | low | keep as is (helper tool) |
| `src/tools/gravity-json.ts` | inline (helper tool) | N/A | low | keep as is (helper tool) |

## Schemas Available in src/schemas/

| Schema file | Exports | Used by |
|---|---|---|
| `users.ts` | raw shapes + ZodObject schemas | transport.ts |
| `groups.ts` | raw shapes + ZodObject schemas | transport.ts |
| `locations.ts` | locationCreateSchema, locationUpdateSchema, locationDeleteSchema, plus raw shapes | locations (used) |
| `sessions.ts` | raw shapes + ZodObject schemas | sessions (used) |
| `session-attachments.ts` | raw shapes + ZodObject schemas | session-attachments (used) |

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

### Locations shapes added (Pass 2)
- `createLocationShape` - for eventicious_create_location tool
- `updateLocationShape` - for eventicious_update_location tool
- `deleteLocationShape` - for eventicious_delete_location tool

### Sessions shapes added (Pass 3)
- `createSessionShape` - for eventicious_create_session tool
- `updateSessionShape` - for eventicious_update_session tool
- `deleteSessionShape` - for eventicious_delete_session tool

### Session Attachments shapes added (Pass 4)
- `createSessionAttachmentShape` - for eventicious_create_session_attachment tool
- `updateSessionAttachmentShape` - for eventicious_update_session_attachment tool
- `deleteSessionAttachmentShape` - for eventicious_delete_session_attachment tool

### Remaining inline/special schemas
- `schedule-import.ts` - helper tool, keep as is
- `tags.ts` - inline, not critical for migration