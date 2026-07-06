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
  if (!Array.isArray(stages)) {
    output.stages = stages;
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

    return result;
  });

  output.stages = normalizedStages;

  if (warnings.length > 0) {
    logger.warn("course_structure_normalization_warnings", { warnings: warnings.map(w => w.message) });
  }

  return { payload: output, warnings };
}
