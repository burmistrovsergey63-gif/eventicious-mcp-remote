import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { config } from "../config";
import {
  extractEventiciousCredentials,
  validateEventiciousCredentials,
} from "../auth";
import { eventiciousRequest } from "../eventicious-client";
import { logger } from "../logger";
import { guardUserBatchSize, warnAutoPublishRateLimit } from "../rate-limit";
import { requireDangerConfirm } from "../utils/confirm";
import {
  createUserShape,
  updateUserShape,
  blockUsersShape,
  unblockUsersShape,
  deleteUsersShape,
  addMentorsShape,
  removeMentorsShape,
} from "../schemas/users";
import {
  createAclGroupShape,
  updateAclGroupShape,
  deleteAclGroupShape,
  moveUsersShape,
  addRolesShape,
  removeRolesShape,
} from "../schemas/groups";
import { registerLocationTools } from "../tools/locations";
import { registerTagTools } from "../tools/tags";
import { registerSessionTools } from "../tools/sessions";
import { registerSessionAttachmentTools } from "../tools/session-attachments";
import { registerScheduleImportTools } from "../tools/schedule-import";
import { registerCatalogTools } from "../tools/catalogs";
import { registerCatalogElementTools } from "../tools/catalog-elements";
import { registerGravityJsonTools } from "../tools/gravity-json";
import { registerCatalogImportTools } from "../tools/catalog-import";
import { registerCourseTools } from "../tools/courses";
import { registerPollTools } from "../tools/polls";
import { registerTaskContentTools } from "../tools/task-contents";
import { registerScormTools } from "../tools/scorm";
import { registerGamificationTools } from "../tools/gamification";
import { registerCourseImportTools } from "../tools/course-import";
import { registerExpoTools } from "../tools/expo";

export async function handleMcpRequest(request: Request): Promise<Response> {
  logger.info("mcp_request_start", { method: request.method });

  const credentials = extractEventiciousCredentials(request);
  const validation = validateEventiciousCredentials(credentials);
  if (!validation.ok) {
    logger.warn("mcp_credentials_invalid", { error: validation.error });
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const server = new McpServer({
    name: "eventicious-mcp-remote",
    version: "1.0.0",
  });

  const imgbbApiKey = request.headers.get("x-imgbb-api-key") || undefined;

  registerTools(server, credentials, imgbbApiKey);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

return await transport.handleRequest(request);
}

function toolError(message: string, context?: { tool?: string; endpoint?: string; checkedFields?: string[] }) {
  const structured: Record<string, unknown> = { error: message };
  if (context?.tool) structured.tool = context.tool;
  if (context?.endpoint) structured.endpoint = context.endpoint;
  if (context?.checkedFields) {
    structured.checkedRequiredFields = context.checkedFields;
    const fieldMatch = context.checkedFields.find(f => message.toLowerCase().includes(f.toLowerCase()));
    if (fieldMatch) {
      structured.field = fieldMatch;
      structured.suggestion = `Ensure "${fieldMatch}" is provided and non-empty. If the field is optional, set it to an empty string explicitly.`;
    }
    if (!fieldMatch && (message.includes("required") || message.includes("missing") || message.includes("invalid"))) {
      structured.checkedRequiredFields = context.checkedFields;
      structured.suggestion = "Check that all required fields are provided. Refer to the tool description for the required schema.";
    }
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structured) }],
    isError: true as const,
  };
}

function registerTools(
  server: McpServer,
  credentials: ReturnType<typeof extractEventiciousCredentials>,
  imgbbApiKey?: string
) {
  const maxUsers = config.maxUsersPerRequest;

  server.tool(
    "eventicious_auth_check",
    "Check that Eventicious credentials are valid and token can be obtained",
    {},
    async () => {
      logger.info("tool_call", { tool: "eventicious_auth_check" });
      try {
        await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/aclgroups",
          credentials,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: "Credentials valid",
                agentGuidance: {
                  toolsAvailable: 75,
                  useUtf8ForRussianText: true,
                  startWithReadOnlyTools: true,
                  useDryRunBeforeWrites: true,
                  directPowerShellHttpJsonMustUseUtf8Bytes: true,
                  toolsListEndpoint: "/mcp/tools",
                  onboardingInstructions: "Call eventicious_get_agent_instructions for full capability map and safety rules.",
                  firstSteps: [
                    "1. eventicious_auth_check — verify credentials",
                    "2. eventicious_get_agent_instructions — get full onboarding",
                    "3. Verify tool count matches expected (75)",
                  ],
                },
              }),
            },
          ],
        };
      } catch (e) {
        logger.error("auth_check_failed", {
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_get_agent_instructions",
    "Read-only helper: returns guidelines for AI agents working with Eventicious MCP. Use this tool first to understand safety rules, UTF-8 handling, and dry_run workflow.",
    {},
    async () => {
      logger.info("tool_call", { tool: "eventicious_get_agent_instructions" });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              mcpVersion: "1.0.0",
              expectedToolsCount: 75,
              safetyRules: {
                startWithReadOnlyChecks: true,
                useDryRunBeforeWrites: true,
                realChangesOnlyAfterDryRunFalseAndConfirmTrue: true,
                destructiveOperationsRequireDangerConfirm: true,
              },
              russianTextRules: {
                useUtf8: true,
                preserveCyrillic: true,
                neverProduceMojibake: true,
                doNotUsePowerShell51BodyAsStringForJsonWithCyrillic: true,
                forDirectHttpRequestsUseUtf8ByteArray: true,
                contentTypeHeader: "application/json; charset=utf-8",
              },
              markdownGravityJsonRules: {
                preserveRussianTextAsUnicodeUtf8: true,
                alwaysPreviewWithDryRunFirst: true,
              },
              safeReadOnlyCategories: [
                "auth/check",
                "get/list",
                "validate",
                "check",
              ],
              clarifyTools: {
                prepareToolsAreSafe:
                  "Prepare tools build a plan or structure without writing to Eventicious.",
                writeToolsNeedPreviewAndConfirmation:
                  "create/update/delete/import/upload/block/unblock tools must not run without preview (dry_run=true) and explicit confirmation.",
              },
              imageHandling: {
                courseCover:
                  "Обложка курса загружается в Eventicious, агент получает fileId/thumbnailFileId. Используйте coverImageFileId / coverImageThumbnailFileId.",
                inlineTextImage:
                  "Картинка внутри текста курса/каталога (Text 2.0 / GravityJson) требует публичный URL. " +
                  "Пользователь загружает изображение в любое публичное хранилище (Google Drive, Яндекс Диск, ImgBB, GitHub Pages, CDN) и передаёт ссылку как imageUrl. " +
                  "Ссылка должна быть доступна без авторизации. MCP вставит URL в GravityJson image.attrs.src.",
              },
              courseCreation: {
                rule: "Не использовать минимальный payload. Создание курса через полный course skeleton. Сначала dry_run, потом confirm=true.",
                requiredFields: [
                  "name",
                  "externalId",
                  "description",
                  "coverImageFileId + coverImageThumbnailFileId (загрузить отдельно через eventicious_upload_course_images)",
                  "settings.progress",
                  "settings.finalScreen",
                  "settings.deadline",
                  "settings.isFreeOrderAllowed",
                  "stages[]",
                ],
                settingsSafeDefaults: {
                  progress: { isEnabled: true, hintText: "Прогресс прохождения" },
                  finalScreen: { isEnabled: true, title: "Курс завершён", text: "Вы успешно завершили курс." },
                  deadline: {
                    isEnabled: true,
                    fixedDeadlineDate: "<YYYY-MM-DD>",
                    relativeDeadlineUnits: "Months",
                    relativeDeadlineValue: 5,
                    notificationSettings: {
                      isEnabled: true,
                      localizedText: {
                        "en-US": "The deadline for the course «{CourseName}» is approaching. Complete it by {DeadlineDate}.",
                        "ru-RU": "Приближается срок выполнения курса «{CourseName}». Успейте пройти его до {DeadlineDate}.",
                      },
                      duplicateInEmail: false,
                      sendingPeriods: [
                        { unit: "Months", value: 3 },
                        { unit: "Weeks", value: 2 },
                        { unit: "Days", value: 1 },
                      ],
                    },
                  },
                  isFreeOrderAllowed: true,
                },
                stageGuidance: {
                  commonStage: "type: \"Common\", settings.transition.conditionType: CheckInformation | PassTest | PassPoll, settings.finalMessage рекомендуется",
                  taskStage: "type: \"Task\", taskContent.title обязателен",
                  passTestPassPoll: "transition включает pollButtonNameOverride, pollPoints, poll.name",
                },
                enumGuidance: "MCP input schema использует PascalCase: type Common/Task/Scorm, conditionType CheckInformation/PassTest/PassPoll, deadline units Days/Weeks/Months. Нормализатор конвертирует в lowercase для API.",
                dryRunFirst: "Всегда делать dry_run=true перед real run. Eventicious create course endpoint отвечает HTTP 500 при неполном payload.",
                ifDataMissing: "Если данных не хватает, агент должен задать уточняющий вопрос или заполнить safe defaults, а не отправлять пустой payload.",
              },
              courseCreationTemplate: {
                userRequestExample: "Создай курс в Eventicious по следующему описанию. Сначала собери полный course skeleton и выполни dry_run. Не отправляй минимальный payload. Если не хватает данных, используй known-safe defaults или задай уточняющий вопрос.\n\nДанные курса:\n- Название:\n- Описание:\n- Обложка: файл / уже загруженные coverImageFileId и coverImageThumbnailFileId\n- ExternalId:\n- Дедлайн:\n- Можно ли проходить в свободном порядке:\n- Этапы:\n  1. Common / CheckInformation / название / длительность\n  2. Common / PassTest / название теста / pollPoints\n  3. Task / название задания / taskContent.title\n\nПосле dry_run покажи summary:\n- stages count\n- stage types\n- condition types\n- has deadline\n- has sendingPeriods\n- has taskContent\n- has poll/test fields\n- has finalMessage\n\nТолько после подтверждения запускай real creation.",
              },
              idLedger: {
                rule: "After every successful create/import/upload/write operation, extract all returned IDs and save them into a local markdown file EVENTICIOUS_MCP_IDS.md in your working directory.",
                why: "MCP server is stateless. IDs returned by Eventicious (courseId, stageId, stageCatalogId, pollId, taskContentId, scormId) are not persisted. Without saving them, content population is impossible.",
                filename: "EVENTICIOUS_MCP_IDS.md",
                securityRules: [
                  "Never store secrets in this file",
                  "Never store access tokens, client secrets, MCP tokens, encryption keys, or personal data",
                  "Only store technical IDs and safe object labels needed for follow-up MCP operations",
                ],
                whenToUpdate: [
                  "eventicious_upload_course_images",
                  "eventicious_import_course_structure",
                  "eventicious_map_course_import_response",
                  "eventicious_create_text2",
                  "eventicious_import_poll_content",
                  "eventicious_import_task_content",
                  "eventicious_upload_task_attachments",
                  "eventicious_upload_scorm_to_stage",
                  "eventicious_create_catalog, eventicious_update_catalog",
                  "eventicious_create_text2, eventicious_create_link, eventicious_add_file_to_catalog, eventicious_add_video_to_catalog",
                  "eventicious_create_users, eventicious_create_acl_group",
                  "eventicious_create_location, eventicious_create_tag, eventicious_create_session",
                  "eventicious_create_exhibitor",
                ],
                whatToSave: {
                  perTool: "tool name, returned ID, safe human-readable label, parent object (if any), next required action",
                  courseWorkflow: [
                    "courseId",
                    "courseCatalogId (if present)",
                    "all stageId",
                    "all stageCatalogId",
                    "all pollId",
                    "all taskContentId",
                    "all scormId (if present)",
                  ],
                },
                courseWorkflow: {
                  afterImportCourseStructure: [
                    "1. Save full raw response in working context",
                    "2. Call eventicious_map_course_import_response if tool is available",
                    "3. Extract and write to EVENTICIOUS_MCP_IDS.md: courseId, courseCatalogId, all stageId, all stageCatalogId, all pollId, all taskContentId, all scormId",
                    "4. For each stage record: stage index, stage title, stage type, transition condition, related technical ID",
                  ],
                  beforeContentPopulation: "Check ledger before content population. Text 2.0 requires stageCatalogId. PassTest/PassPoll require pollId. Task requires taskContentId. If required ID is missing in ledger, do NOT execute write call and report blocker.",
                },
              },
              idLedgerTemplate: {
                filename: "EVENTICIOUS_MCP_IDS.md",
                content:
                  "# Eventicious MCP ID Ledger\n\n" +
                  "> Created by AI agent. Do not store secrets here.\n" +
                  "> This file stores technical IDs returned by Eventicious MCP tools.\n\n" +
                  "## Session\n\n" +
                  "- Date:\n- Event ID:\n- Base URL:\n- Operator / context:\n- Notes:\n\n" +
                  "## Files\n\n" +
                  "| Purpose | fileId | thumbnailFileId | Source | Notes |\n" +
                  "|---|---:|---:|---|---|\n" +
                  "| Course cover |  |  |  |  |\n\n" +
                  "## Courses\n\n" +
                  "| Course title | courseId | externalId | status | Mapping status | Notes |\n" +
                  "|---|---:|---|---|---|---|\n" +
                  "|  |  |  |  | mapped / partial / missing |  |\n\n" +
                  "## Course Stages\n\n" +
                  "| Course ID | Stage index | Stage title | Stage type | stageId | stageCatalogId | transition | pollId | taskContentId | scormId | Notes |\n" +
                  "|---:|---:|---|---|---:|---:|---|---:|---:|---:|---|\n" +
                  "|  |  |  |  |  |  |  |  |  |  |  |\n\n" +
                  "## Catalogs and Elements\n\n" +
                  "| Purpose | catalogId | elementId | Type | Title | Parent / Course | Notes |\n" +
                  "|---|---:|---:|---|---|---|---|\n" +
                  "|  |  |  | Text 2.0 / File / Link / Video |  |  |  |\n\n" +
                  "## Polls and Tests\n\n" +
                  "| Course ID | Stage title | pollId | Poll/Test name | Type | Status | Notes |\n" +
                  "|---:|---|---:|---|---|---|---|\n" +
                  "|  |  |  |  | PassPoll / PassTest | created / populated / checked |  |\n\n" +
                  "## Tasks\n\n" +
                  "| Course ID | Stage title | taskContentId | Task title | Status | Notes |\n" +
                  "|---:|---|---:|---|---|---|\n" +
                  "|  |  |  |  | created / populated / checked |  |\n\n" +
                  "## Action Log\n\n" +
                  "| Time | Tool | Object | Returned IDs | Next required action |\n" +
                  "|---|---|---|---|---|\n" +
                  "|  |  |  |  |  |",
              },
              courseContentPopulation: {
                title: "Course Content Population Rules",
                requiredIdMapping: {
                  rule: "After eventicious_import_course_structure, immediately save the raw response and map all returned IDs into EVENTICIOUS_MCP_IDS.md.",
                  requiredIds: {
                    text2: "stageCatalogId — stages[].catalogId — needed for Text 2.0 / GravityJson content in stage catalog",
                    pollTest: "pollId — stages[].pollId — needed for PassTest / PassPoll stages",
                    task: "taskContentId — stages[].taskContentId — needed for Task stages",
                  },
                  doNotContinue: "Do not continue content population if the required ID is missing.",
                },
                correctOperationOrder: {
                  rule: "Follow this recommended order for course creation and content population:",
                  steps: [
                    "1. Upload course images via eventicious_upload_course_images.",
                    "2. Import full course structure via eventicious_import_course_structure.",
                    "3. Save raw response and update EVENTICIOUS_MCP_IDS.md with all IDs.",
                    "4. Import Task content via eventicious_import_task_content while the course is still draft.",
                    "5. Import Poll/Test content via eventicious_import_poll_content using pollId.",
                    "6. Add Text 2.0 materials via eventicious_create_text2 using stageCatalogId.",
                    "7. Run course readiness check via eventicious_check_course_ready_to_finalize.",
                    "8. Finalize the course via eventicious_finalize_course.",
                  ],
                },
                taskContentBeforeFinalization: {
                  rule: "Task content must be imported before course finalization.",
                  blockerBehavior: "If the course is already finalized and Task content was not imported, report a blocker. Do not retry eventicious_import_task_content blindly.",
                  apiError: "Task content with Id X is associated with a course that is not in draft status. Only task contents associated with courses in draft status can be imported.",
                },
                text2UpdateLimitation: {
                  rule: "Current MCP tools can create, delete, and reorder Text 2.0 elements, but there is no update Text 2.0 tool.",
                  workaround: "To change existing Text 2.0 content, delete the old element and create a new one. This changes catalogElementId.",
                  futureGap: "eventicious_update_text2 is a known dev gap.",
                },
                pollTestContent: {
                  rule: "Use eventicious_import_poll_content with pollId.",
                  formatNote: "For answer options, always include options[].optionData.text.",
                  behavior: "Can fill empty poll or re-import over existing poll content.",
                },
                stageStructureIsCreationTimeCritical: {
                  rule: "Current MCP tools do not update stage type, conditionType, stage order, or add/remove stages after creation.",
                  implication: "Define stage types (Common/Task/Scorm), conditionType (CheckInformation/PassTest/PassPoll), and stage order correctly in the full course skeleton before eventicious_import_course_structure.",
                },
                courseSettingsAreCreationTimeCritical: {
                  rule: "Current MCP tools do not update course name, description, progress settings, finalScreen, deadline, or unfinalize a course after creation.",
                  implication: "Define all course settings correctly in the full course skeleton before eventicious_import_course_structure.",
                  futureGaps: [
                    "No eventicious_update_course tool",
                    "No eventicious_unfinalize_course tool",
                  ],
                  doNotCreate: "Do not invent update/unfinalize tools if MCP does not have them.",
                },
              },
              idLedgerFallback: {
                rule: "If the MCP client cannot write local files, output the updated EVENTICIOUS_MCP_IDS.md content in the chat and ask the user to save it before continuing.",
                note: "Do not ask the user to save the file every time if the agent can write to the workspace directly.",
              },
              capabilityMap: {
                purpose: "Explain Eventicious MCP capabilities to an AI agent and manager.",
                domains: [
                  {
                    name: "Users and groups",
                    capabilities: [
                      "check credentials (auth_check)",
                      "list/get users via ACL groups",
                      "create users with dry-run first",
                      "update users with dry-run first",
                      "block/unblock users",
                      "permanently delete users (requires danger_confirm)",
                      "create/update/delete ACL groups",
                      "move users between groups",
                      "add/remove Curator(1)/Supervisor(2) roles per group",
                      "assign/remove mentors to mentees",
                    ],
                    safety: [
                      "All write operations default to dry_run=true",
                      "Deletion requires danger_confirm matching exact string",
                      "Max 200 users per batch request",
                      "PII rules: do not store personal data in ID ledger",
                    ],
                  },
                  {
                    name: "Catalogs and content",
                    capabilities: [
                      "list/get root catalogs and folders",
                      "create/update/delete root catalogs",
                      "create/update/delete folders with ACL visibility",
                      "create links, add files, add videos to catalogs",
                      "create/delete Text 2.0 / GravityJson elements (no update tool — delete+recreate)",
                      "reorder root catalogs and elements within catalogs",
                      "add/remove catalogs from menu",
                      "bulk delete folders and elements",
                      "add/remove ACL groups to/from catalogs",
                      "build and validate catalog import plans via prepare/validate tools",
                    ],
                    safety: [
                      "dry_run=true default for all writes",
                      "Deletion requires danger_confirm",
                      "Catalog import helpers never perform real writes",
                    ],
                  },
                  {
                    name: "Courses",
                    capabilities: [
                      "upload course cover images (imageUrl, fileBase64, dataUri)",
                      "import full course skeleton with stages, settings, polls, tasks",
                      "map course import response IDs for content population",
                      "check course readiness before finalization",
                      "finalize draft courses (requires danger_confirm)",
                      "import poll/test content into course stages",
                      "import task content into Task stages",
                      "upload SCORM zip to Scorm stages",
                      "upload task attachments",
                      "prepare and validate course import plans",
                    ],
                    safety: [
                      "Always dry_run first — Eventicious returns HTTP 500 on incomplete payload",
                      "Full course skeleton required (name, description, settings, stages)",
                      "Use eventicious_check_course_ready_to_finalize before finalization",
                      "Save returned IDs to EVENTICIOUS_MCP_IDS.md immediately",
                      "Task content must be imported before course finalization",
                      "Course settings and stage structure are creation-time critical (no update tools)",
                    ],
                  },
                  {
                    name: "Schedule",
                    capabilities: [
                      "create/update/delete locations",
                      "create/update/delete tags/topics",
                      "create/update/delete sessions with tags, speakers, locations",
                      "create/update/delete session attachments",
                      "build safe schedule import plans from Excel/JSON rows",
                      "validate schedule import plans",
                    ],
                    safety: [
                      "dry_run=true default",
                      "Deletion requires danger_confirm",
                      "Schedule import helpers never perform real writes",
                    ],
                  },
                  {
                    name: "Exhibitors",
                    capabilities: [
                      "create/update/delete exhibitors",
                      "build and validate exhibitor import plans",
                      "handle company details, logo URLs, representatives",
                    ],
                    safety: [
                      "dry_run=true default",
                      "Deletion requires danger_confirm",
                      "Update: null/empty fields may reset values in admin UI",
                    ],
                  },
                  {
                    name: "Gamification",
                    capabilities: [
                      "manually add or write-off points to users",
                      "validate gamification charge parameters",
                    ],
                    safety: [
                      "Positive scores = charge, negative scores = write-off",
                      "Score must not be zero",
                      "Max absolute value: 10000 (soft limit with warning)",
                    ],
                  },
                ],
                managerExplanationTemplate: [
                  "Я подключён к Eventicious MCP. Я могу безопасно проверять доступ, получать списки, готовить dry-run изменений, помогать с каталогами, курсами, расписанием, пользователями, группами, экспонентами и геймификацией. Реальные изменения я буду делать только после dry-run и вашего подтверждения. Персональные данные без согласованного контура обработки использовать нельзя.",
                ],
                firstResponseChecklist: [
                  "1. Вызвать eventicious_auth_check для проверки credentials.",
                  "2. Вызвать eventicious_get_agent_instructions для получения полных инструкций.",
                  "3. Проверить tool count (ожидается 75).",
                  "4. Объяснить пользователю: что доступно, что нельзя делать без подтверждения, как вести EVENTICIOUS_MCP_IDS.md, какие данные нельзя отправлять.",
                  "5. Уточнить eventId, applicationId, languageId, appLanguageId для контекста запросов.",
                  "6. Если есть EventiciousRequestInfo — передавать его во все запросы к API.",
                ],
                piiWarning: {
                  rule: "Персональные данные (ПДн) не должны передаваться без согласованного контура обработки.",
                  details: [
                    "Не запрашивать у пользователя ФИО, email, телефон без явной необходимости для операции.",
                    "Не сохранять ПДн в EVENTICIOUS_MCP_IDS.md.",
                    "Для тестовых/демо-сред использовать обезличенные данные.",
                    "При создании пользователей: минимально необходимый набор полей.",
                  ],
                },
              },
            }),
          },
        ],
      };
    }
  );

  server.tool(
    "eventicious_create_users",
    "Create users in Eventicious. dry_run=true by default. Max 200 users per request.",
    {
      ...createUserShape,
      users: createUserShape.users.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_create_users",
        dry_run: params.dry_run,
        user_count: params.users.length,
      });

      guardUserBatchSize(params.users);

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required for real execution");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/create",
                payload: { users: params.users },
              }),
            },
          ],
        };
      }

      warnAutoPublishRateLimit("eventicious_create_users");

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/create",
          body: { users: params.users },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_create_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_update_users",
    "Update existing users in Eventicious. dry_run=true by default. Max 200 users per request.",
    {
      ...updateUserShape,
      users: updateUserShape.users.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_update_users",
        dry_run: params.dry_run,
        user_count: params.users.length,
      });

      guardUserBatchSize(params.users);

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "PATCH /api/external/v2/users/update",
                payload: { users: params.users },
              }),
            },
          ],
        };
      }

      warnAutoPublishRateLimit("eventicious_update_users");

      try {
        const res = await eventiciousRequest({
          method: "PATCH",
          endpoint: "/api/external/v2/users/update",
          body: { users: params.users },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_update_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_block_users",
    "Block users in Eventicious. dry_run=true by default. Max 200 users.",
    {
      ...blockUsersShape,
      userIds: blockUsersShape.userIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_block_users",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/block",
                payload: { userIds: params.userIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/block",
          body: { userIds: params.userIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_block_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_unblock_users",
    "Unblock users in Eventicious. dry_run=true by default. Max 200 users.",
    {
      ...unblockUsersShape,
      userIds: unblockUsersShape.userIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_unblock_users",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/unblock",
                payload: { userIds: params.userIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/unblock",
          body: { userIds: params.userIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_unblock_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_get_acl_groups",
    "Get list of all non-system ACL groups from Eventicious. Read-only.",
    {},
    async () => {
      logger.info("tool_call", { tool: "eventicious_get_acl_groups" });
      try {
        const res = await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/aclgroups",
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_get_acl_groups",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_create_acl_group",
    "Create an ACL group in Eventicious. dry_run=true by default.",
    createAclGroupShape,
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_create_acl_group",
        dry_run: params.dry_run,
        group_id: params.id,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/aclgroups/create",
                payload: { id: params.id, name: params.name },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/create",
          body: { id: params.id, name: params.name },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_create_acl_group",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_move_users_to_groups",
    "Move users between ACL groups. All three arrays are required even if empty. dry_run=true by default.",
    {
      ...moveUsersShape,
      userIds: moveUsersShape.userIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_move_users_to_groups",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      const payload = {
        userIds: params.userIds,
        groupIdsAddTo: params.groupIdsAddTo,
        groupIdsRemoveFrom: params.groupIdsRemoveFrom,
      };

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/aclgroups/users/move",
                payload,
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/users/move",
          body: payload,
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_move_users_to_groups",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  // ── v0.2 tools ──────────────────────────────────────────────

  server.tool(
    "eventicious_delete_users",
    "Permanently delete users from Eventicious. Requires danger_confirm='DELETE_EVENTICIOUS_USERS' and confirm=true. dry_run=true by default.",
    {
      ...deleteUsersShape,
      userIds: deleteUsersShape.userIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_delete_users",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run) {
        if (!params.confirm) {
          return toolError("confirm=true required for real deletion");
        }
        if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_USERS")) {
          return toolError("danger_confirm='DELETE_EVENTICIOUS_USERS' required");
        }
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "DELETE /api/external/v2/users/delete",
                payload: { userIds: params.userIds },
              }),
            },
          ],
        };
      }

      warnAutoPublishRateLimit("eventicious_delete_users");

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: "/api/external/v2/users/delete",
          body: { userIds: params.userIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_delete_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_update_acl_group",
    "Rename an ACL group in Eventicious. dry_run=true by default.",
    updateAclGroupShape,
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_update_acl_group",
        dry_run: params.dry_run,
        group_id: params.id,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: `PUT /api/external/v2/aclgroups/update/${params.id}`,
                payload: { name: params.name },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "PUT",
          endpoint: `/api/external/v2/aclgroups/update/${params.id}`,
          body: { name: params.name },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_update_acl_group",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_delete_acl_group",
    "Permanently delete an ACL group from Eventicious. Requires danger_confirm='DELETE_EVENTICIOUS_ACL_GROUP' and confirm=true. dry_run=true by default.",
    deleteAclGroupShape,
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_delete_acl_group",
        dry_run: params.dry_run,
        group_id: params.id,
      });

      if (!params.dry_run) {
        if (!params.confirm) {
          return toolError("confirm=true required for real deletion");
        }
        if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_ACL_GROUP")) {
          return toolError("danger_confirm='DELETE_EVENTICIOUS_ACL_GROUP' required");
        }
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: `DELETE /api/external/v2/aclgroups/delete/${params.id}`,
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: `/api/external/v2/aclgroups/delete/${params.id}`,
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_delete_acl_group",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_add_user_roles",
    "Assign roles (Curator=1, Supervisor=2) to users within ACL groups. dry_run=true by default.",
    {
      ...addRolesShape,
      roleInfo: addRolesShape.roleInfo.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_add_user_roles",
        dry_run: params.dry_run,
        role_count: params.roleInfo.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/aclgroups/roles/add",
                payload: { roleInfo: params.roleInfo },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/roles/add",
          body: { roleInfo: params.roleInfo },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_add_user_roles",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_remove_user_roles",
    "Remove roles from users within ACL groups. dry_run=true by default.",
    {
      ...removeRolesShape,
      roleInfo: removeRolesShape.roleInfo.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_remove_user_roles",
        dry_run: params.dry_run,
        role_count: params.roleInfo.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/aclgroups/roles/remove",
                payload: { roleInfo: params.roleInfo },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/roles/remove",
          body: { roleInfo: params.roleInfo },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_remove_user_roles",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_add_user_mentors",
    "Assign a mentor to mentees in Eventicious. dry_run=true by default.",
    {
      ...addMentorsShape,
      menteeIds: addMentorsShape.menteeIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_add_user_mentors",
        dry_run: params.dry_run,
        mentor_id: params.mentorId,
        mentee_count: params.menteeIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/mentor",
                payload: { mentorId: params.mentorId, menteeIds: params.menteeIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/mentor",
          body: { mentorId: params.mentorId, menteeIds: params.menteeIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_add_user_mentors",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_remove_user_mentors",
    "Remove a mentor from mentees in Eventicious. dry_run=true by default.",
    {
      ...removeMentorsShape,
      menteeIds: removeMentorsShape.menteeIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_remove_user_mentors",
        dry_run: params.dry_run,
        mentor_id: params.mentorId,
        mentee_count: params.menteeIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "DELETE /api/external/v2/users/mentor",
                payload: { mentorId: params.mentorId, menteeIds: params.menteeIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: "/api/external/v2/users/mentor",
          body: { mentorId: params.mentorId, menteeIds: params.menteeIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_remove_user_mentors",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  registerLocationTools(server, credentials);
  registerTagTools(server, credentials);
  registerSessionTools(server, credentials);
  registerSessionAttachmentTools(server, credentials);
  registerScheduleImportTools(server, credentials);
  registerCatalogTools(server, credentials, toolError);
  registerCatalogElementTools(server, credentials, toolError, imgbbApiKey);
  registerGravityJsonTools(server, toolError);
  registerCatalogImportTools(server, toolError);
  registerCourseTools(server, credentials, toolError);
  registerPollTools(server, credentials, toolError);
  registerTaskContentTools(server, credentials, toolError);
  registerScormTools(server, credentials, toolError);
  registerGamificationTools(server, credentials, toolError);
  registerCourseImportTools(server, toolError);
  registerExpoTools(server, credentials, toolError);
}
