import { logger } from "../logger";

const STAGE_TYPE_MAP: Record<string, string> = {
  common: "common",
  task: "task",
  scorm: "scorm",
};

const CONDITION_TYPE_MAP: Record<string, string> = {
  checkinformation: "checkinformation",
  passtest: "passtest",
  passpoll: "passpoll",
};

export interface NormalizationWarning {
  message: string;
}

export interface NormalizationResult {
  payload: Record<string, unknown>;
  warnings: NormalizationWarning[];
}

function normalizeStageType(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.toLowerCase();
  return STAGE_TYPE_MAP[lower] ?? undefined;
}

function normalizeConditionType(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.toLowerCase();
  return CONDITION_TYPE_MAP[lower] ?? undefined;
}

function normalizeStageSettings(settings: Record<string, unknown> | undefined, stageType: string): Record<string, unknown> | undefined {
  if (!settings) return undefined;

  const result: Record<string, unknown> = {};

  if (settings.finalMessage !== undefined) result.finalMessage = settings.finalMessage;
  if (settings.scormSettings !== undefined) result.scormSettings = settings.scormSettings;

  if (settings.transition) {
    const transition = settings.transition as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    if (transition.conditionType !== undefined) {
      const normalizedType = normalizeConditionType(transition.conditionType);
      if (normalizedType) normalized.conditionType = normalizedType;
    }
    if (transition.pollButtonNameOverride !== undefined) normalized.pollButtonNameOverride = transition.pollButtonNameOverride;
    if (transition.pollPoints !== undefined) normalized.pollPoints = transition.pollPoints;
    if (transition.poll !== undefined) normalized.poll = transition.poll;

    if (Object.keys(normalized).length > 0) result.transition = normalized;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function normalizeCourseStructureForEventiciousApi(
  input: Record<string, unknown>
): NormalizationResult {
  const warnings: NormalizationWarning[] = [];
  const output: Record<string, unknown> = {};

  output.name = input.name;
  output.description = input.description;
  output.externalId = input.externalId;
  output.coverImageFileId = input.coverImageFileId;
  output.coverImageThumbnailFileId = input.coverImageThumbnailFileId;
  output.settings = input.settings;

  const stages = input.stages;

  if (!input.description) {
    warnings.push({ message: "Missing course description. Eventicious may reject incomplete payloads." });
  }
  if (!input.externalId) {
    warnings.push({ message: "Missing externalId. Recommended for course deduplication." });
  }

  const settings = input.settings as Record<string, unknown> | undefined;
  if (!settings?.progress) {
    warnings.push({ message: "Missing settings.progress. Course creation may fail without it." });
  }
  if (!settings?.finalScreen) {
    warnings.push({ message: "Missing settings.finalScreen. Course creation may fail without it." });
  }
  if (!settings?.deadline) {
    warnings.push({ message: "Missing settings.deadline. Course creation is known to fail with HTTP 500 without deadline settings." });
  }
  if (settings?.deadline) {
    const dl = settings.deadline as Record<string, unknown>;
    if (dl.isEnabled && !dl.fixedDeadlineDate && !dl.relativeDeadlineUnits) {
      warnings.push({ message: "Deadline enabled but no fixedDeadlineDate or relativeDeadlineUnits provided." });
    }
    if (dl.isEnabled && dl.notificationSettings) {
      const ns = dl.notificationSettings as Record<string, unknown>;
      if (ns.isEnabled && (!Array.isArray(ns.sendingPeriods) || ns.sendingPeriods.length === 0)) {
        warnings.push({ message: "Deadline notifications enabled but no sendingPeriods defined." });
      }
    }
  }
  if (settings?.isFreeOrderAllowed === undefined) {
    warnings.push({ message: "Missing settings.isFreeOrderAllowed. Recommended to set explicitly." });
  }

  if (!Array.isArray(stages) || stages.length === 0) {
    warnings.push({ message: "No stages defined. Course creation requires at least one stage." });
    output.stages = stages;
    if (warnings.length > 0) {
      logger.warn("course_structure_normalization_warnings", { warnings: warnings.map(w => w.message) });
    }
    return { payload: output, warnings };
  }

  const normalizedStages = stages.map((stage: Record<string, unknown>) => {
    const result: Record<string, unknown> = {};

    result.name = stage.name;
    result.comment = stage.comment;

    const rawType = stage.type;
    const normalizedType = normalizeStageType(rawType);
    if (!normalizedType) {
      warnings.push({ message: `Invalid stage type: ${String(rawType)}. Expected Common, Task, or Scorm.` });
      result.type = rawType;
    } else {
      result.type = normalizedType;
    }

    if (stage.taskContent !== undefined) result.taskContent = stage.taskContent;

    if (normalizedType === "task" && (!stage.taskContent || !(stage.taskContent as Record<string, unknown>)?.title)) {
      warnings.push({ message: `Task stage "${String(stage.name)}" missing taskContent.title. Eventicious may reject the payload.` });
    }

    const topConditionType = normalizeConditionType(stage.conditionType);
    const existingSettings = stage.settings as Record<string, unknown> | undefined;
    const existingTransition = existingSettings?.transition as Record<string, unknown> | undefined;
    const existingConditionType = existingTransition?.conditionType !== undefined
      ? normalizeConditionType(existingTransition.conditionType)
      : undefined;

    let mergedConditionType: string | undefined;
    if (topConditionType && existingConditionType) {
      if (topConditionType !== existingConditionType) {
        warnings.push({ message: `Conflicting conditionType: top-level="${String(stage.conditionType)}" vs settings.transition.conditionType="${String(existingTransition?.conditionType)}". Using top-level value.` });
      }
      mergedConditionType = topConditionType;
    } else {
      mergedConditionType = topConditionType ?? existingConditionType;
    }

    if (normalizedType === "common" && !mergedConditionType && !existingSettings?.transition) {
      mergedConditionType = "checkinformation";
      warnings.push({ message: `Common stage "${String(stage.name)}" without conditionType defaults to checkinformation.` });
    }

    const mergedSettings: Record<string, unknown> = {};
    if (existingSettings?.finalMessage !== undefined) mergedSettings.finalMessage = existingSettings.finalMessage;
    if (existingSettings?.scormSettings !== undefined) mergedSettings.scormSettings = existingSettings.scormSettings;

    if (mergedConditionType || existingTransition?.pollButtonNameOverride !== undefined || existingTransition?.pollPoints !== undefined || existingTransition?.poll !== undefined) {
      const transition: Record<string, unknown> = {};
      if (mergedConditionType) transition.conditionType = mergedConditionType;
      if (existingTransition?.pollButtonNameOverride !== undefined) transition.pollButtonNameOverride = existingTransition.pollButtonNameOverride;
      if (existingTransition?.pollPoints !== undefined) transition.pollPoints = existingTransition.pollPoints;
      if (existingTransition?.poll !== undefined) transition.poll = existingTransition.poll;
      mergedSettings.transition = transition;
    }

    if (Object.keys(mergedSettings).length > 0) result.settings = mergedSettings;

    if (normalizedType === "common" && !existingSettings?.finalMessage) {
      warnings.push({ message: `Common stage "${String(stage.name)}" missing settings.finalMessage. Recommended for known-safe course skeleton.` });
    }

    if (mergedConditionType === "passtest" || mergedConditionType === "passpoll") {
      if (!existingTransition?.poll) {
        warnings.push({ message: `Stage "${String(stage.name)}" with ${mergedConditionType} missing transition.poll. Include poll.name for known-safe skeleton.` });
      }
      if (existingTransition?.pollPoints === undefined) {
        warnings.push({ message: `Stage "${String(stage.name)}" with ${mergedConditionType} missing transition.pollPoints.` });
      }
      if (!existingTransition?.pollButtonNameOverride) {
        warnings.push({ message: `Stage "${String(stage.name)}" with ${mergedConditionType} missing transition.pollButtonNameOverride.` });
      }
    }

    return result;
  });

  output.stages = normalizedStages;

  if (warnings.length > 0) {
    logger.warn("course_structure_normalization_warnings", { warnings: warnings.map(w => w.message) });
  }

  return { payload: output, warnings };
}
