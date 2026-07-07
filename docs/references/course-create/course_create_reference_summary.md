# Eventicious course create reference summary

- Stages count: 13
- Stage types list: common, task
- Condition types list: passpoll, passtest, checkinformation
- Has deadline: yes
- Has sendingPeriods: yes
- Has taskContent: yes
- Has poll/test fields: yes
- Has finalMessage: yes
- coverImageFileId: 3317284
- coverImageThumbnailFileId: 3317285
- externalId: `mcp_reference_course_20260706_181304`
- name: `MCP reference course 20260706_181304`

This payload differs from a minimal payload by preserving the full working course skeleton: global settings, final screen, progress settings, enabled deadline, notification localized text, sending periods, all 13 stages, common-stage transition settings, final messages, poll/test transition metadata, and task-stage `taskContent.title`. A minimal body that only sends `name`, `externalId`, cover IDs, or simplified stages may miss fields the Eventicious API appears to expect and can surface as HTTP 500.
