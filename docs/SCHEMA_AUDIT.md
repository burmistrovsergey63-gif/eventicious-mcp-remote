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
- `schedule-import.ts` - helper tool, keep as is (high risk)
- `tags.ts` - inline, ready for migration (low risk)
- `catalog-import.ts` - helper tool, keep as is
- `gravity-json.ts` - helper tool, keep as is

## Schema Audit Checkpoint (Pass 4)

See `docs/SCHEMA_AUDIT_CHECKPOINT.md` for the full migration status and recommendations.

## Course Structure Normalization (2026-07-06)

The `eventicious_import_course_structure` tool now normalizes the payload before sending to the Eventicious API.

### Behavior
- MCP tool accepts PascalCase enums for user-friendly input: `Common`, `Task`, `Scorm`, `CheckInformation`, `PassTest`, `PassPoll`
- Mapper normalizes to lowercase API values: `common`, `task`, `scorm`, `checkinformation`, `passtest`, `passpoll`
- Top-level `conditionType` is moved to `settings.transition.conditionType`
- Unknown enum values produce validation warnings (not errors)
- Common stages without `conditionType` default to `checkinformation`

### Implementation
- `src/utils/course-structure-normalizer.ts` — `normalizeCourseStructureForEventiciousApi()` function
- `src/tools/courses.ts` — calls mapper before API request
- `src/utils/course-structure-normalizer.test.ts` — 25 tests covering all mapping scenarios

## Inline Image Storage (2026-07-06)

The `eventicious_create_text2` tool now supports inline images in GravityJson via ImgBB storage.

### Behavior
- Image nodes in GravityJson can use `imageUrl`, `fileBase64`, or `dataUri`
- Images are uploaded to ImgBB and replaced with public HTTPS URLs
- Public HTTPS URLs (https://) are passed through without upload
- SVG images are rejected
- Images larger than 32 MB are rejected
- Dry run returns placeholder URLs without calling ImgBB

### Environment Variables
```
INLINE_IMAGE_STORAGE_DRIVER=imgbb
IMGBB_API_KEY=<secret>                    # fallback, read at request time
IMGBB_EXPIRATION_SECONDS=<optional>
INLINE_IMAGE_MAX_BYTES=33554432
```

### Architecture: Inline Images via Public URL

Inline images in Text 2.0 require a **public URL** (accessible without authorization).
User uploads the image to any public storage (Google Drive, Яндекс Диск, ImgBB, GitHub Pages, CDN) and passes the link as `imageUrl`.
MCP inserts the URL into GravityJson `image.attrs.src`.

ImgBB storage adapter remains in code but is not the default flow. Inline images use `imageUrl` directly.

Course covers are NOT affected — they use Eventicious `coverImageFileId` / `coverImageThumbnailFileId`.

### Implementation
- `src/storage/inline-image-storage.ts` — ImgBB upload adapter
- `src/storage/inline-image-storage.test.ts` — 21 tests
- `src/tools/gravity-json.ts` — `buildInlineImagePlan()` function
- `src/tools/catalog-elements.ts` — integrated into `eventicious_create_text2` tool
- `src/mcp/transport.ts` — extracts `x-imgbb-api-key` header per request

## Course Creation: Full Skeleton Required

Eventicious create course endpoint returns HTTP 500 on incomplete payloads. MCP enforces full course skeleton via normalization warnings.

### Required Structure
- `name`, `description`, `externalId`
- `coverImageFileId` + `coverImageThumbnailFileId` (pre-uploaded)
- `settings.progress`, `settings.finalScreen`, `settings.deadline`, `settings.isFreeOrderAllowed`
- `stages[]` with complete stage objects

### Stage Requirements
- **Common**: `settings.transition.conditionType` (CheckInformation/PassTest/PassPoll), `settings.finalMessage` recommended
- **Task**: `taskContent.title` required
- **PassTest/PassPoll**: `transition.poll`, `transition.pollPoints`, `transition.pollButtonNameOverride`

### Normalization
- PascalCase enums in MCP input → lowercase for API
- Stage type: Common→common, Task→task, Scorm→scorm
- ConditionType: CheckInformation→checkinformation, PassTest→passtest, PassPoll→passpoll
- Common stage without conditionType defaults to checkinformation

### Dry Run Warnings
The normalizer emits warnings for:
- Missing description, externalId, settings fields
- Deadline enabled without dates
- No stages
- Task stage without taskContent.title
- PassTest/PassPoll without poll metadata
- Common stage without finalMessage

### Implementation
- `src/utils/course-structure-normalizer.ts` — normalization + warnings
- `src/utils/course-structure-normalizer.test.ts` — 25 tests
- `src/tools/courses.ts` — `eventicious_import_course_structure` tool
- `src/tools/course-import.ts` — prepare/validate tools
- `examples/course-create.reference.example.json` — reference skeleton