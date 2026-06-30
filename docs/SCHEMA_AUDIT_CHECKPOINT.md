# Schema Audit Checkpoint

## Migrated to raw shape exports

| Area | Tool file | Schema file | Tests | Status |
|---|---|---|---|---|
| users/groups | src/mcp/transport.ts | src/schemas/users.ts | src/schemas/users.test.ts | migrated (7 shapes) |
| | | src/schemas/groups.ts | src/schemas/groups.test.ts | migrated (7 shapes) |
| locations | src/tools/locations.ts | src/schemas/locations.ts | src/schemas/locations.test.ts | migrated (3 shapes) |
| sessions | src/tools/sessions.ts | src/schemas/sessions.ts | src/schemas/sessions.test.ts | migrated (3 shapes) |
| session-attachments | src/tools/session-attachments.ts | src/schemas/session-attachments.ts | src/schemas/session-attachments.test.ts | migrated (3 shapes) |
| tags | src/tools/tags.ts | src/schemas/tags.ts | src/schemas/tags.test.ts | migrated (3 shapes) |

## Already using imported shapes (no action needed)

| Area | Tool file | Schema file | Tests | Status |
|---|---|---|---|---|
| catalogs | src/tools/catalogs.ts | src/schemas/catalogs.ts | - | already using shapes |
| catalog-elements | src/tools/catalog-elements.ts | src/schemas/catalog-elements.ts | src/schemas/catalog-elements.test.ts | already using shapes |
| courses | src/tools/courses.ts | src/schemas/courses.ts | - | already using shapes |
| expo | src/tools/expo.ts | src/schemas/expo.ts | - | already using shapes |
| polls | src/tools/polls.ts | src/schemas/polls.ts | - | already using shapes |
| scorm | src/tools/scorm.ts | src/schemas/scorm.ts | - | already using shapes |
| gamification | src/tools/gamification.ts | src/schemas/gamification.ts | - | already using shapes |
| course-import | src/tools/course-import.ts | src/schemas/course-import.ts | - | already using shapes |

## Remaining inline schemas (do not migrate together)

| Area | Tool file | Inline schema count/notes | Risk | Recommended action |
|---|---|---|---|---|
| schedule-import | src/tools/schedule-import.ts | 2 tools, complex nested row schemas | high | keep as is (helper tool). Next hardening candidate. |
| catalog-import | src/tools/catalog-import.ts | helper tool for plan building | low | keep as is (helper tool) |
| gravity-json | src/tools/gravity-json.ts | helper tool | low | keep as is (helper tool) |

## Risk classification

**Low risk:**
- Simple CRUD tools with few fields
- No batch operations
- No danger_confirm required (except delete patterns already established)
- Examples: tags, simple updates

**Medium risk:**
- Complex nested structures
- Order/reorder operations
- Bulk group operations
- Examples: catalog menu, catalog order, catalog bulk delete

**High risk (do not migrate):**
- Import/plan-building tools
- Courses finalize/upload
- SCORM
- Gamification
- Schedule import tools (helper tools, already inline intentionally)

## Recommended next migration order

**Schema migration complete.** All simple CRUD tools have been migrated and hardened.

### Hardening Release 0.6.1

This release adds:
- Tool-count smoke check (`npm run smoke:tools`) verifying 74 tools registered
- Tests for catalog-elements.ts schema shapes (29 tests)
- Remote smoke check (`npm run smoke:remote`) for Layero preview

Remaining inline tools are intentional helpers (schedule-import, catalog-import, gravity-json)
or already using imported shapes (catalogs, catalog-elements, courses, expo, polls, scorm, gamification, course-import).

### Next Hardening Candidate

`schedule-import` is the next high-risk candidate for separate hardening. It contains complex nested row schemas
for schedule import plan building and should be migrated in isolation.

## Do not migrate together

- Do not mix schedule-import + any other migration (complex plan tool)
- Do not mix catalog bulk operations + order operations (interdependent)
- Do not mix courses/expo/gamification/SCORM in same pass (complex APIs)
- Helper tools (catalog-import, gravity-json) should remain inline