# Eventicious course create reference request

## Source

Working payload source: `C:/Users/burmi/Desktop/course_factory/data/projects/iventishes_api_za_dengi_2026-04-09/03_exports/platform_bundle/eventicious/course_skeleton_payload_prepared.json`.

Successful create response source: `C:/Users/burmi/Desktop/course_factory/data/projects/iventishes_api_za_dengi_2026-04-09/03_exports/platform_bundle/eventicious/eventicious_course_create_raw_response.json`; the saved response has HTTP 200 and course id 14864.

The payload was produced by `build_payloads.py` (`build_from_project()` -> `build_course_payload()`) and then used by `upload_course_to_eventicious.py` (`create_course()`). `upload_course_to_eventicious.py` reads `course_skeleton_payload.json`, uploads/sets cover IDs, writes `course_skeleton_payload_prepared.json`, and posts it to Eventicious.

## Endpoint

`POST https://api-integration.eventicious.ru/api/external/v2/courses`

In code this is assembled as `normalize_base_url(EVENTICIOUS_BASE_URL) + "/courses"`, where `EVENTICIOUS_BASE_URL` was `https://api-integration.eventicious.ru/api/external/v2`.

## Required headers/context

Do not put `Accept-Language` inside `EventiciousRequestInfo`.

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
Accept-Language: ru
EventiciousRequestInfo: {"eventId":"1187","applicationId":"0","languageId":"1","appLanguageId":"0"}
```

EventiciousRequestInfo:

```json
{
  "eventId": "1187",
  "applicationId": "0",
  "languageId": "1",
  "appLanguageId": "0"
}
```

Accept-Language: ru

## Body fields preserved from the working payload

- Top-level `description`, `settings`, `deadline`, and full `stages` array structure.
- `settings.progress`, `settings.finalScreen`, `settings.deadline`, `settings.isFreeOrderAllowed`.
- Deadline `notificationSettings.localizedText`, `duplicateInEmail`, and `sendingPeriods`.
- Stage `name`, `comment`, lowercase `type` values, `settings.transition`, and `settings.finalMessage`.
- Transition fields: `conditionType`, `pollButtonNameOverride`, `pollPoints`, and `poll.name`.
- Task stage `taskContent.title`.

## Fields treated as important/required for replay

- `name`
- `description`
- `externalId`
- `coverImageFileId`
- `coverImageThumbnailFileId`
- `settings.progress`
- `settings.finalScreen`
- `settings.deadline`
- `settings.isFreeOrderAllowed`
- `stages[]`
- `stages[].type` as lowercase: `common`, `task`, `scorm` when present
- `stages[].settings.transition.conditionType` as lowercase: `checkinformation`, `passtest`, `passpoll`
- `stages[].settings.finalMessage` for common stages
- `stages[].taskContent.title` for task stages
- Poll/test transition fields when condition type is `passtest` or `passpoll`: `pollButtonNameOverride`, `pollPoints`, `poll.name`

## Replacements made

- `name`: `MCP reference course 20260706_181304`
- `externalId`: `mcp_reference_course_20260706_181304`
- `coverImageFileId`: `3317284`
- `coverImageThumbnailFileId`: `3317285`

No secrets, token values, client secret, or Authorization value are included in the JSON payload file.
