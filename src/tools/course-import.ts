import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../logger";
import { courseImportPlanInputSchema, coursePlanValidationSchema, courseImportResponseMapSchema, courseReadyToFinalizeSchema } from "../schemas/course-import";

export function registerCourseImportTools(
  server: McpServer,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_prepare_course_import",
    "Normalize a course plan into Eventicious import payload with execution plan. Builds full course skeleton with settings, stages, and content plans. No Eventicious writes. Always use before eventicious_import_course_structure to verify payload completeness. For Russian text use UTF-8.",
    courseImportPlanInputSchema.shape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_prepare_course_import", name: params.name });
      const stages = params.stages ?? [];
      const polls = params.polls ?? [];
      const tasks = params.tasks ?? [];
      const scormArchives = params.scormArchives ?? [];

      const requiredUploads: string[] = [];
      if (!params.coverImageFileId) requiredUploads.push("cover image + thumbnail");
      if (scormArchives.length > 0) requiredUploads.push(`${scormArchives.length} SCORM archive(s)`);

      const courseStructurePayload = {
        name: params.name,
        description: params.description,
        coverImageFileId: params.coverImageFileId ?? "<REQUIRED>",
        coverImageThumbnailFileId: params.coverImageThumbnailFileId ?? "<REQUIRED>",
        settings: params.settings ?? { progress: {}, finalScreen: {}, deadline: {} },
        stages: stages.map((s: { name: string; type: string; comment?: string }) => ({ name: s.name, type: s.type, comment: s.comment })),
        externalId: params.externalId,
      };

      const stageContentPlan = stages.map((s: { name: string; type: string }, i: number) => ({
        stageIndex: i,
        name: s.name,
        type: s.type,
        action: s.type === "Common" ? "fill_catalog_content" : s.type === "Task" ? "import_task_content" : s.type === "Scorm" ? "upload_scorm" : "unknown",
      }));

      const pollContentPlan = polls.map((p: { name?: string }, i: number) => ({ pollIndex: i, name: p.name ?? `Poll ${i + 1}` }));
      const taskContentPlan = tasks.map((t: { title?: string }, i: number) => ({ taskIndex: i, title: t.title ?? `Task ${i + 1}` }));
      const scormUploadPlan = scormArchives.map((fp: string, i: number) => ({ scormIndex: i, filePath: fp }));
      const catalogContentPlan = stages.filter((s: { type: string }) => s.type === "Common").map((s: { name: string }, i: number) => ({ stageIndex: i, name: s.name }));

      const warnings: string[] = [];
      if (!params.coverImageFileId) warnings.push("coverImageFileId missing - must upload cover image first");
      if (!params.coverImageThumbnailFileId) warnings.push("coverImageThumbnailFileId missing - must upload thumbnail first");
      if (stages.length === 0) warnings.push("no stages defined");

      const imageUploadGuidance = !params.coverImageFileId
        ? {
            required: true,
            remoteMcpNote: "Remote MCP cannot use local file paths. Use imageUrl (public URL), fileBase64 (base64 string), dataUri (data:image/...), or provide existing coverImageFileId+coverImageThumbnailFileId.",
            acceptedModes: ["imageUrl", "fileBase64", "dataUri", "existing coverImageFileId+coverImageThumbnailFileId"],
            localOnly: ["filePaths (only works if server has access to local files)"],
          }
        : { required: false, note: "Image IDs provided. No upload needed." };

      const recommendedExecutionOrder = [
        "1. Upload cover image / thumbnail (if not provided)",
        "2. Import course structure via eventicious_import_course_structure",
        "3. Map returned IDs via eventicious_map_course_import_response",
        "4. Fill course/stage catalogs via catalog tools",
        "5. Import poll/test content via eventicious_import_poll_content",
        "6. Upload task attachments via eventicious_upload_task_attachments",
        "7. Import task content via eventicious_import_task_content",
        "8. Upload SCORM zip via eventicious_upload_scorm_to_stage",
        "9. Check ready via eventicious_check_course_ready_to_finalize",
        "10. Finalize course via eventicious_finalize_course",
      ];

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            normalizedCourse: courseStructurePayload,
            requiredUploads,
            courseStructurePayloadPreview: courseStructurePayload,
            stageContentPlan,
            pollContentPlan,
            taskContentPlan,
            scormUploadPlan,
            catalogContentPlan,
            warnings,
            errors: [],
            imageUploadGuidance,
            recommendedExecutionOrder,
          }),
        }],
      };
    }
  );

  server.tool(
    "eventicious_validate_course_plan",
    "Validate a course plan before import. Checks required fields (name, cover, stages), settings completeness (progress, finalScreen, deadline, sendingPeriods), stage structure (taskContent.title for Task, poll metadata for PassTest/PassPoll), and readiness. For Russian text use UTF-8.",
    coursePlanValidationSchema.shape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_validate_course_plan" });
      const plan = params.coursePlan;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!plan.name) errors.push("name is required");
      if (!plan.coverImageFileId) errors.push("coverImageFileId is required. Use eventicious_upload_course_images with imageUrl, fileBase64, dataUri, or provide existing IDs.");
      if (!plan.coverImageThumbnailFileId) errors.push("coverImageThumbnailFileId is required. Use eventicious_upload_course_images with imageUrl, fileBase64, dataUri, or provide existing IDs.");
      if (!plan.stages || plan.stages.length === 0) errors.push("at least 1 stage is required");

      if (plan.settings) {
        const s = plan.settings;
        if (s.progress?.isEnabled && !s.progress.hintText) warnings.push("progress.hintText recommended when progress.isEnabled=true");
        if (s.finalScreen?.isEnabled && !s.finalScreen.title) warnings.push("finalScreen.title required when finalScreen.isEnabled=true");
        if (s.deadline?.isEnabled) {
          if (!s.deadline.fixedDeadlineDate && !s.deadline.relativeDeadlineUnits) errors.push("deadline requires either fixedDeadlineDate or relativeDeadlineUnits+relativeDeadlineValue");
          if (s.deadline.relativeDeadlineUnits && !s.deadline.relativeDeadlineValue) errors.push("deadline.relativeDeadlineValue required when relativeDeadlineUnits is set");
        }
      }

      const stages = plan.stages ?? [];
      const commonStages = stages.filter((s: { type: string }) => s.type === "Common");
      const taskStages = stages.filter((s: { type: string }) => s.type === "Task");
      const scormStages = stages.filter((s: { type: string }) => s.type === "Scorm");

      const pollStages = stages.filter((s: { type: string; settings?: { transition?: { conditionType?: string } } }) =>
        s.settings?.transition?.conditionType === "PassPoll" || s.settings?.transition?.conditionType === "PassTest"
      );

      if (taskStages.length > 0 && !plan.tasks) warnings.push(`${taskStages.length} task stage(s) but no task content plan`);
      if (scormStages.length > 0 && !plan.scormArchives) warnings.push(`${scormStages.length} SCORM stage(s) but no scorm archives`);

      const canImportStructure = errors.length === 0;
      const canFinalize = canImportStructure && warnings.length === 0;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            valid: errors.length === 0,
            errors,
            warnings,
            summary: {
              stagesCount: stages.length,
              commonStagesCount: commonStages.length,
              pollStagesCount: pollStages.length,
              taskStagesCount: taskStages.length,
              scormStagesCount: scormStages.length,
              requiredUploadsCount: (!plan.coverImageFileId ? 1 : 0) + (plan.scormArchives?.length ?? 0),
              catalogContentItemsCount: commonStages.length,
              canImportStructure,
              canFinalize,
            },
          }),
        }],
      };
    }
  );

  server.tool(
    "eventicious_map_course_import_response",
    "Map IDs from course import response for next steps (pollIds, taskContentIds, scormIds, catalogIds).",
    courseImportResponseMapSchema.shape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_map_course_import_response" });
      const resp = params.importResponse;
      const courseId = resp.id;
      const courseCatalogId = resp.courseCatalog?.id;
      const stages = (resp.stages ?? []).map((s: { id: number; name: string; type: string; catalog?: { id: number }; taskContent?: { id: number }; poll?: { id: number }; scormId?: number }) => ({
        stageId: s.id,
        stageName: s.name,
        stageType: s.type,
        stageCatalogId: s.catalog?.id,
        pollId: s.poll?.id,
        taskContentId: s.taskContent?.id,
        scormId: s.scormId,
      }));

      const missingIds: string[] = [];
      if (!courseId) missingIds.push("courseId");
      if (!courseCatalogId) missingIds.push("courseCatalogId");
      stages.forEach((s: { stageId?: number; stageCatalogId?: number }) => {
        if (!s.stageId) missingIds.push(`stageId for ${s}`);
        if (!s.stageCatalogId) missingIds.push(`stageCatalogId for stage ${s.stageId}`);
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            courseId,
            courseCatalogId,
            stages,
            missingIds,
            warnings: missingIds.length > 0 ? [`Missing IDs: ${missingIds.join(", ")}`] : [],
          }),
        }],
      };
    }
  );

  server.tool(
    "eventicious_check_course_ready_to_finalize",
    "Check if a course can be finalized. Returns blockers if content is missing.",
    courseReadyToFinalizeSchema.shape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_check_course_ready_to_finalize", courseId: params.courseId });
      const status = params.filledContentStatus;
      const blockers: string[] = [];
      const warnings: string[] = [];

      if (!status.coverUploaded) blockers.push("Cover image not uploaded");
      if (!status.pollsFilled) warnings.push("Poll/test content not imported yet");
      if (!status.tasksFilled) warnings.push("Task content not imported yet");
      if (!status.scormUploaded) warnings.push("SCORM archives not uploaded yet");
      if (!status.attachmentsUploaded) warnings.push("Task attachments not uploaded yet");
      if (!status.catalogsFilled) warnings.push("Stage catalogs not filled yet");

      const ready = blockers.length === 0;

      const finalizePreview = ready
        ? { courseId: params.courseId, message: "Course is ready to finalize. Use eventicious_finalize_course with danger_confirm='FINALIZE_EVENTICIOUS_COURSE'" }
        : { courseId: params.courseId, message: "Course cannot be finalized yet", blockers };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ ready, blockers, warnings, finalizePreview }),
        }],
      };
    }
  );
}
