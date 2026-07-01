# Schedule Import Hardening

## Current Behavior

### Tools

- `eventicious_prepare_schedule_import` — builds an import plan from schedule rows
- `eventicious_validate_schedule_plan` — validates a plan before execution

Both are pure helpers: no Eventicious API calls, no write operations.

### Input Fields (schedule row)

| Field | Required | Description |
|-------|----------|-------------|
| `title` | **yes** | Session title |
| `description` | no | Session description |
| `startDate` | no* | `YYYY-MM-DD` |
| `startTime` | no* | `HH:mm` |
| `startsAt` | no* | ISO 8601 datetime alternative |
| `endDate` | no* | `YYYY-MM-DD` |
| `endTime` | no* | `HH:mm` |
| `endsAt` | no* | ISO 8601 datetime alternative |
| `locationName` | no | Match by name or create |
| `locationId` | no | Direct ID reference |
| `tagNames` | no | Array of tag names |
| `tagIds` | no | Array of tag IDs |
| `speakerNames` | no | Array of speaker full names |
| `speakerEmails` | no | Array of speaker emails |
| `speakerIds` | no | Array of speaker user IDs |
| `aclGroupNames` | no | Array of ACL group names |
| `aclGroupsIds` | no | Array of ACL group IDs |
| `attachments` | no | Array of `{ title, url }` |
| `externalId` | no | External session ID |
| `type` | no | 0=speech, 1=coffee-break, 2=filler |

\* Start/end time can be provided as `startDate+startTime` or `startsAt`. At least one format required.

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `createMissingLocations` | `true` | Auto-create unknown locations |
| `createMissingTags` | `true` | Auto-create unknown tags |
| `createMissingAclGroups` | `false` | Auto-create unknown ACL groups |
| `createMissingSpeakersAsUsers` | `false` | Auto-create unknown speakers as users |
| `timezone` | — | Not currently used in normalization |
| `defaultLanguage` | — | Not currently used |

### Existing Data Parameters

- `existingLocations: { id, name }[]`
- `existingTags: { id, name }[]`
- `existingAclGroups: { id, name }[]`
- `existingUsersOrSpeakers: { id, firstName, lastName, email? }[]`

## Current Behavior Details

### Date/Time Normalization

`normalizeDateTime(dateStr?, timeStr?, isoStr?)`:
- If `isoStr` provided → return as-is
- If `dateStr + timeStr` → `YYYY-MM-DDTHH:mm`
- If only `dateStr` → `YYYY-MM-DDT00:00`
- If none → `undefined` → error

**No timezone conversion** is performed despite `timezone` option being available.

### Speaker Resolution

1. Match by email (exact, case-insensitive)
2. Match by full name `firstName lastName` (exact, case-insensitive)
3. If not found and `createMissingSpeakersAsUsers=true` → split name into firstName/lastName, queue for creation
4. If not found and `createMissingSpeakersAsUsers=false` → warning

**Risk**: Speaker name split assumes `"FirstName LastName"` format. Names with more than 2 parts lose middle parts.

### ACL Group Resolution

1. Match by name (exact, case-insensitive)
2. If not found and `createMissingAclGroups=true` → queue for creation
3. If not found and `createMissingAclGroups=false` → warning: "session will be visible to all"

### Duplicate Handling

- Locations/tags/ACL groups deduplicated by lowercase name in Maps
- Speaker/tag/ACL IDs deduplicated via `Set`
- **No duplicate session detection** in prepare (only in validate)

### Error Format (Current)

Errors are plain strings:
```
"Row 1: missing start time (provide startDate+startTime or startsAt)"
```

Warnings are plain strings:
```
"Row 2: speaker \"John\" not found and createMissingSpeakersAsUsers=false"
```

**No structured error codes**. No field-level granularity beyond row prefix.

## Known Risks

1. **No date format validation** — any string passes for startDate/startTime
2. **No time format validation** — "25:99" would be accepted
3. **No end > start validation in prepare** — only caught in validate
4. **No timezone handling** — timezone option is accepted but ignored
5. **Speaker name splitting** is naive (space-based)
6. **No mojibake detection** — Russian text not checked for encoding issues
7. **Error messages are not structured** — no field/code/suggestion format
8. **Empty rows array** rejected by Zod `.min(1)` but row with empty title passes
9. **No session overlap detection** in prepare (only basic conflict check in validate)
10. **validate_schedule_plan uses `z.any()`** — no schema validation of plan input

## Test Coverage

**34 tests** in `src/tools/schedule-import.test.ts` (up from 0):

- Valid rows (minimal, split date+time, multiple days)
- Speaker/tag/acl resolution (names, IDs, mixed)
- Missing fields (empty rows, missing start/end time)
- Time validation (end before start, same start/end)
- Invalid formats (bad dates, bad times)
- Duplicates (externalId collision)
- Mojibake detection (Cyrillic encoding warnings, no false-positives)
- Safety (prepare returns plan not execution, validate returns report)
- Attachments, deduplication, execution order

## Hardening Status

### Phase 1: Golden Tests ✓

- `src/tools/schedule-import.test.ts` — 34 test cases
- Zero → 34 tests

### Phase 2: Error Quality ✓

- Structured error format with row/field/code/message/suggestion
- End > start validated in prepare (not just validate)

### Phase 3: Mojibake Integration ✓

- `detectLikelyMojibake` from `src/utils/text-encoding.ts` integrated
- Text fields checked: title, locationName, speakerNames, tagNames, aclGroupNames
- `encodingWarnings` in plan result (warnings only, no blocking)

### Phase 4: Description Updates ✓

- "Builds an import plan only. Does not write to Eventicious."
- "Validates an import plan only. Does not write to Eventicious."

### Phase 5: Documentation ✓

- `docs/README_FOR_MANAGERS.md` — schedule-import workflow added
- `docs/MCP_CLIENTS.md` — schedule-import note added

## Agent Usage Workflow

1. **prepare** — `eventicious_prepare_schedule_import` with rows + existing data
2. **validate** — `eventicious_validate_schedule_plan` with the plan
3. **review** — check errors/warnings, fix data if needed
4. **create/update** — use `eventicious_create_session` / `eventicious_update_session` with `dry_run=true`
5. **approve** — after preview looks correct, run with `dry_run=false` + `confirm=true`
