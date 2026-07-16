import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function countToolCallsInFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const matches = content.matchAll(/server\.tool\(\s*["']([^"']+)["']/g);
  return Array.from(matches).map((m) => m[1]);
}

function getAllToolNames(): string[] {
  const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
  const toolsDir = path.join(__dirname, "..", "tools");

  const names: string[] = [];

  const transportNames = countToolCallsInFile(transportPath);
  names.push(...transportNames);

  const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith(".ts"));
  for (const file of toolFiles) {
    const filePath = path.join(toolsDir, file);
    names.push(...countToolCallsInFile(filePath));
  }

  return names;
}

describe("MCP tools count", () => {
  it("registers exactly 75 tools", () => {
    const toolNames = getAllToolNames();
    expect(toolNames.length).toBe(75);
  });

  it("includes eventicious_get_agent_instructions", () => {
    const toolNames = getAllToolNames();
    expect(toolNames).toContain("eventicious_get_agent_instructions");
  });
});

describe("eventicious_get_agent_instructions", () => {
  it("transport.ts contains tool definition with expected content", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("eventicious_get_agent_instructions");
    expect(content).toContain("mcpVersion");
    expect(content).toContain("1.0.0");
    expect(content).toContain("expectedToolsCount");
    expect(content).toContain("75");
    expect(content).toContain("useUtf8ForRussianText");
    expect(content).toContain("useDryRunBeforeWrites");
    expect(content).toContain("doNotUsePowerShell51BodyAsStringForJsonWithCyrillic");
    expect(content).toContain("destructiveOperationsRequireDangerConfirm");
    expect(content).toContain("safeReadOnlyCategories");
    expect(content).toContain("prepareToolsAreSafe");
  });
});

describe("auth_check agentGuidance", () => {
  it("transport.ts contains agentGuidance in auth_check success response", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("agentGuidance");
    expect(content).toContain("toolsAvailable");
    expect(content).toContain("directPowerShellHttpJsonMustUseUtf8Bytes");
  });

  it("auth_check success response has backward-compatible fields", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("success: true");
    expect(content).toContain('"Credentials valid"');
    expect(content).toContain("toolsAvailable: 75");
    expect(content).toContain("toolsListEndpoint");
    expect(content).toContain("/mcp/tools");
  });

  it("auth_check returns toolError on failure", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("auth_check_failed");
    expect(content).toContain("toolError");
  });
});

describe("eventicious_get_agent_instructions content", () => {
  it("contains UTF-8 and PowerShell warnings", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("useUtf8: true");
    expect(content).toContain("doNotUsePowerShell51BodyAsStringForJsonWithCyrillic");
    expect(content).toContain("forDirectHttpRequestsUseUtf8ByteArray");
    expect(content).toContain("contentTypeHeader");
  });

  it("contains dry_run and confirm rules", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("useDryRunBeforeWrites: true");
    expect(content).toContain("realChangesOnlyAfterDryRunFalseAndConfirmTrue");
    expect(content).toContain("destructiveOperationsRequireDangerConfirm: true");
  });

  it("clarifies prepare tools are safe", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("prepareToolsAreSafe");
    expect(content).toContain("Prepare tools build a plan or structure without writing to Eventicious");
  });

  it("is read-only (no parameters)", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    const match = content.match(
      /server\.tool\(\s*"eventicious_get_agent_instructions"[\s\S]*?\{\},\s*async/
    );
    expect(match).toBeTruthy();
  });

  it("contains image handling instructions in Russian", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("imageHandling");
    expect(content).toContain("courseCover");
    expect(content).toContain("inlineTextImage");
    expect(content).toContain("Обложка курса");
    expect(content).toContain("Картинка внутри текста");
    expect(content).toContain("публичный URL");
  });
});

describe("x-imgbb-api-key header extraction", () => {
  it("transport.ts reads x-imgbb-api-key from request headers", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("x-imgbb-api-key");
    expect(content).toContain('request.headers.get("x-imgbb-api-key")');
  });

  it("transport.ts passes imgbbApiKey to registerCatalogElementTools", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("registerCatalogElementTools(server, credentials, toolError, apiRequestContext, acceptLanguage, imgbbApiKey)");
  });

  it("catalog-elements.ts accepts requestScopedImgbbKey parameter", () => {
    const catalogPath = path.join(__dirname, "..", "tools", "catalog-elements.ts");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("requestScopedImgbbKey");
    expect(content).toContain("resolveStorageOptions");
    expect(content).toContain("requestScopedImgbbKey || envImgbbApiKey");
  });

  it("catalog-elements.ts has improved missing key error mentioning public URL", () => {
    const catalogPath = path.join(__dirname, "..", "tools", "catalog-elements.ts");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("MISSING_INLINE_IMAGE_KEY_ERROR");
    expect(content).toContain("публичный URL");
    expect(content).toContain("Google Drive");
    expect(content).toContain("Яндекс Диск");
  });

  it("catalog-elements.ts has improved fileId error", () => {
    const catalogPath = path.join(__dirname, "..", "tools", "catalog-elements.ts");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("FILE_ID_INLINE_ERROR");
    expect(content).toContain("обложки курса");
  });
});

describe("eventicious_get_agent_instructions course creation section", () => {
  it("contains courseCreation section with skeleton guidance", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("courseCreation");
    expect(content).toContain("requiredFields");
    expect(content).toContain("settingsSafeDefaults");
    expect(content).toContain("stageGuidance");
    expect(content).toContain("enumGuidance");
    expect(content).toContain("dryRunFirst");
    expect(content).toContain("ifDataMissing");
  });

  it("instructs not to use minimal payload", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("Не использовать минимальный payload");
    expect(content).toContain("полный course skeleton");
  });

  it("mentions PascalCase enums for MCP input", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("PascalCase");
    expect(content).toContain("Common");
    expect(content).toContain("CheckInformation");
    expect(content).toContain("PassTest");
  });

  it("contains LLM request template", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("courseCreationTemplate");
    expect(content).toContain("userRequestExample");
    expect(content).toContain("dry_run");
    expect(content).toContain("summary");
  });

  it("mentions HTTP 500 risk for incomplete payload", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("HTTP 500");
  });
});

describe("eventicious_get_agent_instructions ID Ledger section", () => {
  it("contains idLedger section with core rule", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("idLedger");
    expect(content).toContain("EVENTICIOUS_MCP_IDS.md");
    expect(content).toContain("After every successful create/import/upload/write operation");
    expect(content).toContain("MCP server is stateless");
  });

  it("contains security rules forbidding secrets", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("Never store secrets in this file");
    expect(content).toContain("Never store access tokens, client secrets, MCP tokens, encryption keys");
    expect(content).toContain("Only store technical IDs");
  });

  it("contains list of tools that should trigger ledger update", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("eventicious_import_course_structure");
    expect(content).toContain("eventicious_map_course_import_response");
    expect(content).toContain("eventicious_create_text2");
    expect(content).toContain("eventicious_import_poll_content");
    expect(content).toContain("eventicious_import_task_content");
    expect(content).toContain("eventicious_upload_task_attachments");
    expect(content).toContain("eventicious_upload_scorm_to_stage");
  });

  it("contains course workflow with stageCatalogId, pollId, taskContentId", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("stageCatalogId");
    expect(content).toContain("pollId");
    expect(content).toContain("taskContentId");
    expect(content).toContain("scormId");
    expect(content).toContain("courseCatalogId");
  });

  it("contains course workflow rules for after import", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("afterImportCourseStructure");
    expect(content).toContain("Save full raw response");
    expect(content).toContain("Call eventicious_map_course_import_response");
    expect(content).toContain("Extract and write to EVENTICIOUS_MCP_IDS.md");
  });

  it("contains before content population check", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("beforeContentPopulation");
    expect(content).toContain("Text 2.0 requires stageCatalogId");
    expect(content).toContain("PassTest/PassPoll require pollId");
    expect(content).toContain("Task requires taskContentId");
    expect(content).toContain("do NOT execute write call and report blocker");
  });

  it("contains idLedgerTemplate with full markdown template", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("idLedgerTemplate");
    expect(content).toContain("# Eventicious MCP ID Ledger");
    expect(content).toContain("Do not store secrets here");
    expect(content).toContain("## Session");
    expect(content).toContain("## Files");
    expect(content).toContain("## Courses");
    expect(content).toContain("## Course Stages");
    expect(content).toContain("## Catalogs and Elements");
    expect(content).toContain("## Polls and Tests");
    expect(content).toContain("## Tasks");
    expect(content).toContain("## Action Log");
  });

  it("contains idLedgerFallback for clients that cannot write files", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("idLedgerFallback");
    expect(content).toContain("MCP client cannot write local files");
    expect(content).toContain("output the updated EVENTICIOUS_MCP_IDS.md content in the chat");
    expect(content).toContain("ask the user to save it before continuing");
  });
});

describe("eventicious_get_agent_instructions courseContentPopulation section", () => {
  it("contains courseContentPopulation section title", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("courseContentPopulation");
    expect(content).toContain("Course Content Population Rules");
  });

  it("contains required ID mapping rules", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("requiredIdMapping");
    expect(content).toContain("stageCatalogId");
    expect(content).toContain("pollId");
    expect(content).toContain("taskContentId");
  });

  it("contains correct operation order", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("correctOperationOrder");
    expect(content).toContain("eventicious_upload_course_images");
    expect(content).toContain("eventicious_import_course_structure");
    expect(content).toContain("eventicious_import_task_content");
    expect(content).toContain("eventicious_import_poll_content");
    expect(content).toContain("eventicious_create_text2");
    expect(content).toContain("eventicious_check_course_ready_to_finalize");
    expect(content).toContain("eventicious_finalize_course");
  });

  it("contains task content before finalization rule", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("taskContentBeforeFinalization");
    expect(content).toContain("Task content must be imported before course finalization");
    expect(content).toContain("report a blocker");
  });

  it("contains Text 2.0 update limitation", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("text2UpdateLimitation");
    expect(content).toContain("no update Text 2.0 tool");
    expect(content).toContain("delete the old element and create a new one");
    expect(content).toContain("changes catalogElementId");
  });

  it("contains poll/test content rules with options format", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("pollTestContent");
    expect(content).toContain("options[].optionData.text");
  });

  it("contains stage structure is creation-time critical", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("stageStructureIsCreationTimeCritical");
    expect(content).toContain("conditionType");
  });

  it("contains course settings limitations and future gaps", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("courseSettingsAreCreationTimeCritical");
    expect(content).toContain("eventicious_update_course");
    expect(content).toContain("eventicious_unfinalize_course");
    expect(content).toContain("Do not invent update/unfinalize tools");
  });
});

describe("eventicious_get_agent_instructions capability map", () => {
  it("contains capabilityMap section", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("capabilityMap");
    expect(content).toContain("Explain Eventicious MCP capabilities to an AI agent and manager");
  });

  it("contains all domain sections", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("Users and groups");
    expect(content).toContain("Catalogs and content");
    expect(content).toContain("Courses");
    expect(content).toContain("Schedule");
    expect(content).toContain("Exhibitors");
    expect(content).toContain("Gamification");
  });

  it("contains manager explanation template", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("managerExplanationTemplate");
    expect(content).toContain("Я подключён к Eventicious MCP");
    expect(content).toContain("только после dry-run и вашего подтверждения");
  });

  it("contains first-connect checklist", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("firstResponseChecklist");
    expect(content).toContain("eventicious_auth_check");
    expect(content).toContain("eventicious_get_agent_instructions");
    expect(content).toContain("Проверить tool count");
  });

  it("contains PII/PD warning", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("piiWarning");
    expect(content).toContain("Персональные данные");
    expect(content).toContain("Не сохранять ПДн");
  });

  it("contains safety rules in each domain", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("dry_run=true default for all writes");
    expect(content).toContain("Deletion requires danger_confirm");
  });

  it("contains dry_run first and danger_confirm references", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");
    expect(content).toContain("dry_run first");
    expect(content).toContain("danger_confirm");
  });
});

describe("course tool descriptions", () => {
  it("eventicious_import_course_structure warns about full skeleton", () => {
    const coursesPath = path.join(__dirname, "..", "tools", "courses.ts");
    const content = fs.readFileSync(coursesPath, "utf-8");

    expect(content).toContain("full skeleton");
    expect(content).toContain("dry_run first");
    expect(content).toContain("HTTP 500");
    expect(content).toContain("PascalCase");
  });

  it("eventicious_prepare_course_import mentions skeleton verification", () => {
    const courseImportPath = path.join(__dirname, "..", "tools", "course-import.ts");
    const content = fs.readFileSync(courseImportPath, "utf-8");

    expect(content).toContain("full course skeleton");
  });

  it("eventicious_validate_course_plan checks stage structure", () => {
    const courseImportPath = path.join(__dirname, "..", "tools", "course-import.ts");
    const content = fs.readFileSync(courseImportPath, "utf-8");

    expect(content).toContain("taskContent.title");
    expect(content).toContain("poll metadata");
  });
});

describe("course-create.reference.example.json", () => {
  it("is valid JSON with required fields", () => {
    const examplePath = path.join(__dirname, "..", "..", "examples", "course-create.reference.example.json");
    const content = fs.readFileSync(examplePath, "utf-8");
    const example = JSON.parse(content);

    expect(example.name).toBeDefined();
    expect(example.description).toBeDefined();
    expect(example.externalId).toBeDefined();
    expect(example.coverImageFileId).toBeDefined();
    expect(example.coverImageThumbnailFileId).toBeDefined();
    expect(example.settings).toBeDefined();
    expect(example.settings.progress).toBeDefined();
    expect(example.settings.finalScreen).toBeDefined();
    expect(example.settings.deadline).toBeDefined();
    expect(example.settings.isFreeOrderAllowed).toBeDefined();
    expect(example.stages.length).toBeGreaterThanOrEqual(1);
  });

  it("uses PascalCase enums", () => {
    const examplePath = path.join(__dirname, "..", "..", "examples", "course-create.reference.example.json");
    const content = fs.readFileSync(examplePath, "utf-8");
    const example = JSON.parse(content);

    for (const stage of example.stages) {
      expect(["Common", "Task", "Scorm"]).toContain(stage.type);
    }
  });

  it("stages have required structure", () => {
    const examplePath = path.join(__dirname, "..", "..", "examples", "course-create.reference.example.json");
    const content = fs.readFileSync(examplePath, "utf-8");
    const example = JSON.parse(content);

    const taskStage = example.stages.find((s: any) => s.type === "Task");
    expect(taskStage).toBeDefined();
    expect(taskStage.taskContent).toBeDefined();
    expect(taskStage.taskContent.title).toBeDefined();

    const commonStages = example.stages.filter((s: any) => s.type === "Common");
    expect(commonStages.length).toBeGreaterThanOrEqual(1);
    for (const cs of commonStages) {
      expect(cs.settings).toBeDefined();
      expect(cs.settings.transition).toBeDefined();
      expect(cs.settings.transition.conditionType).toBeDefined();
    }
  });
});
