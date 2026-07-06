import { describe, it, expect } from "vitest";
import { normalizeCourseStructureForEventiciousApi } from "./course-structure-normalizer";

const FIXTURE_API_PAYLOAD = {
  name: "Кибербезопасность",
  description: "Курс по основам информационной безопасности",
  externalId: "security-course-001",
  coverImageFileId: 186374,
  coverImageThumbnailFileId: 186377,
  settings: {
    progress: { isEnabled: true, hintText: "Выполнено {Progress}%" },
    finalScreen: { isEnabled: true, title: "Курс завершен!", text: "Спасибо за прохождение." },
    deadline: {
      isEnabled: true,
      relativeDeadlineUnits: "Months",
      relativeDeadlineValue: 3,
      notificationSettings: {
        isEnabled: true,
        localizedText: {
          "ru-RU": "Приближается срок прохождения курса «{CourseName}». Успейте завершить к {DeadlineDate}.",
          "en-US": "The deadline for the «{CourseName}» course is approaching. Complete it by {DeadlineDate}.",
        },
        duplicateInEmail: false,
        sendingPeriods: [
          { unit: "Months", value: 1 },
          { unit: "Weeks", value: 2 },
          { unit: "Days", value: 1 },
        ],
      },
    },
    isFreeOrderAllowed: true,
  },
  stages: [
    { name: "Теория", type: "common", settings: { transition: { conditionType: "checkinformation" }, finalMessage: { isEnabled: true, title: "Теория пройдена" } } },
    { name: "Тест", type: "common", settings: { transition: { conditionType: "passtest", poll: { name: "Экзамен" }, pollButtonNameOverride: "Начать тест", pollPoints: 100 }, finalMessage: { isEnabled: true, title: "Тест сдан" } } },
    { name: "Практика", type: "task", taskContent: { title: "Выполнить задание" } },
    { name: "SCORM модуль", type: "scorm" },
  ],
};

const FIXTURE_MCP_INPUT = {
  name: "Кибербезопасность",
  description: "Курс по основам информационной безопасности",
  externalId: "security-course-001",
  coverImageFileId: 186374,
  coverImageThumbnailFileId: 186377,
  settings: {
    progress: { isEnabled: true, hintText: "Выполнено {Progress}%" },
    finalScreen: { isEnabled: true, title: "Курс завершен!", text: "Спасибо за прохождение." },
    deadline: {
      isEnabled: true,
      relativeDeadlineUnits: "Months",
      relativeDeadlineValue: 3,
      notificationSettings: {
        isEnabled: true,
        localizedText: {
          "ru-RU": "Приближается срок прохождения курса «{CourseName}». Успейте завершить к {DeadlineDate}.",
          "en-US": "The deadline for the «{CourseName}» course is approaching. Complete it by {DeadlineDate}.",
        },
        duplicateInEmail: false,
        sendingPeriods: [
          { unit: "Months", value: 1 },
          { unit: "Weeks", value: 2 },
          { unit: "Days", value: 1 },
        ],
      },
    },
    isFreeOrderAllowed: true,
  },
  stages: [
    { name: "Теория", type: "Common" },
    { name: "Тест", type: "Common", settings: { transition: { conditionType: "PassTest", poll: { name: "Экзамен" }, pollButtonNameOverride: "Начать тест", pollPoints: 100 }, finalMessage: { isEnabled: true, title: "Тест сдан" } } },
    { name: "Практика", type: "Task", taskContent: { title: "Выполнить задание" } },
    { name: "SCORM модуль", type: "Scorm" },
  ],
};

const CONDITION_TYPE_FIXTURES = [
  { input: "CheckInformation", expected: "checkinformation" },
  { input: "checkinformation", expected: "checkinformation" },
  { input: "PassTest", expected: "passtest" },
  { input: "passtest", expected: "passtest" },
  { input: "PassPoll", expected: "passpoll" },
  { input: "passpoll", expected: "passpoll" },
];

describe("normalizeCourseStructureForEventiciousApi", () => {
  it("Common → common", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage 1", type: "Common" }],
    });
    expect((payload.stages as any[])[0].type).toBe("common");
  });

  it("Task → task", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage 1", type: "Task", taskContent: { title: "Task" } }],
    });
    expect((payload.stages as any[])[0].type).toBe("task");
  });

  it("Scorm → scorm", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage 1", type: "Scorm" }],
    });
    expect((payload.stages as any[])[0].type).toBe("scorm");
  });

  describe("conditionType mapping", () => {
    for (const { input, expected } of CONDITION_TYPE_FIXTURES) {
      it(`${input} → ${expected}`, () => {
        const { payload } = normalizeCourseStructureForEventiciousApi({
          stages: [{ name: "Stage", type: "Common", settings: { transition: { conditionType: input } } }],
        });
        expect((payload.stages as any[])[0].settings.transition.conditionType).toBe(expected);
      });
    }
  });

  it("top-level conditionType maps to settings.transition.conditionType", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage", type: "Common", conditionType: "PassTest" }],
    });
    expect((payload.stages as any[])[0].settings.transition.conditionType).toBe("passtest");
  });

  it("existing settings.transition.conditionType is normalized", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage", type: "Common", settings: { transition: { conditionType: "PassPoll" } } }],
    });
    expect((payload.stages as any[])[0].settings.transition.conditionType).toBe("passpoll");
  });

  it("conflicting top-level and nested conditionType returns validation warning", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{
        name: "Stage",
        type: "Common",
        conditionType: "PassTest",
        settings: { transition: { conditionType: "PassPoll" } },
      }],
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.message.includes("Conflicting conditionType"))).toBe(true);
  });

  it("API-shaped raw payload remains stable after normalization", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi(FIXTURE_API_PAYLOAD);
    expect(payload.name).toBe(FIXTURE_API_PAYLOAD.name);
    expect(payload.description).toBe(FIXTURE_API_PAYLOAD.description);
    expect(payload.externalId).toBe(FIXTURE_API_PAYLOAD.externalId);
    expect(payload.coverImageFileId).toBe(FIXTURE_API_PAYLOAD.coverImageFileId);
    expect(payload.coverImageThumbnailFileId).toBe(FIXTURE_API_PAYLOAD.coverImageThumbnailFileId);
    expect(payload.settings).toEqual(FIXTURE_API_PAYLOAD.settings);
    const stages = payload.stages as any[];
    expect(stages[0].type).toBe("common");
    expect(stages[0].settings.transition.conditionType).toBe("checkinformation");
    expect(stages[1].settings.transition.conditionType).toBe("passtest");
    expect(stages[1].settings.transition.poll.name).toBe("Экзамен");
    expect(stages[1].settings.transition.pollButtonNameOverride).toBe("Начать тест");
    expect(stages[1].settings.transition.pollPoints).toBe(100);
    expect(stages[2].type).toBe("task");
    expect(stages[2].taskContent.title).toBe("Выполнить задание");
    expect(stages[3].type).toBe("scorm");
  });

  it("final normalized payload matches key shape of successful raw.course_payload_sent", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi(FIXTURE_MCP_INPUT);
    expect(payload.name).toBe("Кибербезопасность");
    expect(payload.coverImageFileId).toBe(186374);
    expect(payload.coverImageThumbnailFileId).toBe(186377);
    expect((payload.settings as any).deadline.notificationSettings.sendingPeriods).toEqual([
      { unit: "Months", value: 1 },
      { unit: "Weeks", value: 2 },
      { unit: "Days", value: 1 },
    ]);
    const stages = payload.stages as any[];
    expect(stages[0].type).toBe("common");
    expect(stages[0].settings.transition.conditionType).toBe("checkinformation");
    expect(stages[1].type).toBe("common");
    expect(stages[1].settings.transition.conditionType).toBe("passtest");
    expect(stages[1].settings.transition.poll.name).toBe("Экзамен");
    expect(stages[1].settings.transition.pollButtonNameOverride).toBe("Начать тест");
    expect(stages[1].settings.transition.pollPoints).toBe(100);
    expect(stages[2].type).toBe("task");
    expect(stages[2].taskContent.title).toBe("Выполнить задание");
    expect(stages[3].type).toBe("scorm");
  });

  it("preserves existing settings.finalMessage", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{
        name: "Stage",
        type: "Common",
        settings: {
          transition: { conditionType: "CheckInformation" },
          finalMessage: { isEnabled: true, title: "Done" },
        },
      }],
    });
    expect((payload.stages as any[])[0].settings?.finalMessage).toEqual({ isEnabled: true, title: "Done" });
  });

  it("preserves existing settings.scormSettings", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{
        name: "Stage",
        type: "Scorm",
        settings: { scormSettings: { useFixedScores: true, fixedScores: 80 } },
      }],
    });
    expect((payload.stages as any[])[0].settings.scormSettings).toEqual({ useFixedScores: true, fixedScores: 80 });
  });

  it("preserves task stage taskContent.title", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Task Stage", type: "Task", taskContent: { title: "Important Task" } }],
    });
    expect((payload.stages as any[])[0].taskContent.title).toBe("Important Task");
  });

  it("preserves transition.pollButtonNameOverride", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{
        name: "Stage",
        type: "Common",
        settings: { transition: { conditionType: "PassPoll", pollButtonNameOverride: "Start" } },
      }],
    });
    expect((payload.stages as any[])[0].settings.transition.pollButtonNameOverride).toBe("Start");
  });

  it("preserves transition.pollPoints", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{
        name: "Stage",
        type: "Common",
        settings: { transition: { conditionType: "PassTest", pollPoints: 50 } },
      }],
    });
    expect((payload.stages as any[])[0].settings.transition.pollPoints).toBe(50);
  });

  it("preserves transition.poll.name", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{
        name: "Stage",
        type: "Common",
        settings: { transition: { conditionType: "PassTest", poll: { name: "Quiz" } } },
      }],
    });
    expect((payload.stages as any[])[0].settings.transition.poll.name).toBe("Quiz");
  });

  it("Common stage without conditionType defaults to checkinformation", () => {
    const { payload, warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Simple", type: "Common" }],
    });
    expect((payload.stages as any[])[0].settings.transition.conditionType).toBe("checkinformation");
  });

  it("dry_run-like preview contains normalized payload", () => {
    const { payload, warnings } = normalizeCourseStructureForEventiciousApi({
      name: "Test",
      stages: [{ name: "Stage", type: "Common" }],
    });
    expect(payload.name).toBe("Test");
    expect((payload.stages as any[])[0].type).toBe("common");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("non-array stages are passed through", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({ stages: "invalid" });
    expect(payload.stages).toBe("invalid");
  });

  it("unknown stage type produces warning", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage", type: "Unknown" }],
    });
    expect(warnings.some(w => w.message.includes("Invalid stage type"))).toBe(true);
  });

  it("preserves stage.comment", () => {
    const { payload } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Stage", type: "Common", comment: "A comment" }],
    });
    expect((payload.stages as any[])[0].comment).toBe("A comment");
  });

  it("warns when description is missing", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      name: "Test",
      stages: [{ name: "Stage", type: "Common" }],
    });
    expect(warnings.some(w => w.message.includes("Missing course description"))).toBe(true);
  });

  it("warns when externalId is missing", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      name: "Test",
      description: "Desc",
      stages: [{ name: "Stage", type: "Common" }],
    });
    expect(warnings.some(w => w.message.includes("Missing externalId"))).toBe(true);
  });

  it("warns when settings.progress is missing", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      name: "Test",
      description: "Desc",
      externalId: "ext-001",
      settings: { finalScreen: {}, deadline: {}, isFreeOrderAllowed: true },
      stages: [{ name: "Stage", type: "Common" }],
    });
    expect(warnings.some(w => w.message.includes("settings.progress"))).toBe(true);
  });

  it("warns when settings.deadline is missing", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      name: "Test",
      description: "Desc",
      externalId: "ext-001",
      settings: { progress: {}, finalScreen: {}, isFreeOrderAllowed: true },
      stages: [{ name: "Stage", type: "Common" }],
    });
    expect(warnings.some(w => w.message.includes("settings.deadline"))).toBe(true);
  });

  it("warns when Task stage missing taskContent.title", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Practice", type: "Task" }],
    });
    expect(warnings.some(w => w.message.includes("Task stage") && w.message.includes("taskContent.title"))).toBe(true);
  });

  it("warns when Common stage missing finalMessage", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Theory", type: "Common", settings: { transition: { conditionType: "CheckInformation" } } }],
    });
    expect(warnings.some(w => w.message.includes("finalMessage"))).toBe(true);
  });

  it("warns when PassTest missing poll metadata", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Quiz", type: "Common", settings: { transition: { conditionType: "PassTest" }, finalMessage: { isEnabled: true } } }],
    });
    expect(warnings.some(w => w.message.includes("missing transition.poll"))).toBe(true);
  });

  it("warns when PassPoll missing pollPoints", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      stages: [{ name: "Poll", type: "Common", settings: { transition: { conditionType: "PassPoll", poll: { name: "Survey" } }, finalMessage: { isEnabled: true } } }],
    });
    expect(warnings.some(w => w.message.includes("pollPoints"))).toBe(true);
  });

  it("warns when no stages defined", () => {
    const { warnings } = normalizeCourseStructureForEventiciousApi({
      name: "Test",
      stages: [],
    });
    expect(warnings.some(w => w.message.includes("No stages defined"))).toBe(true);
  });

  it("does NOT warn on complete reference-like payload", () => {
    const referencePayload = {
      name: "Cybersecurity",
      description: "Course",
      externalId: "sec-001",
      settings: {
        progress: { isEnabled: true, hintText: "Progress" },
        finalScreen: { isEnabled: true, title: "Done", text: "Completed" },
        deadline: {
          isEnabled: true,
          fixedDeadlineDate: "2026-12-31",
          notificationSettings: {
            isEnabled: true,
            sendingPeriods: [{ unit: "Months", value: 1 }],
          },
        },
        isFreeOrderAllowed: true,
      },
      stages: [
        {
          name: "Theory",
          type: "Common",
          settings: {
            transition: { conditionType: "CheckInformation" },
            finalMessage: { isEnabled: true, title: "Done" },
          },
        },
        {
          name: "Quiz",
          type: "Common",
          settings: {
            transition: {
              conditionType: "PassTest",
              pollButtonNameOverride: "Start",
              pollPoints: 100,
              poll: { name: "Exam" },
            },
            finalMessage: { isEnabled: true, title: "Passed" },
          },
        },
        {
          name: "Practice",
          type: "Task",
          taskContent: { title: "Do task" },
        },
      ],
    };
    const { warnings } = normalizeCourseStructureForEventiciousApi(referencePayload);
    const skeletonWarnings = warnings.filter(w =>
      w.message.includes("Missing course description") ||
      w.message.includes("Missing externalId") ||
      w.message.includes("settings.progress") ||
      w.message.includes("settings.deadline") ||
      w.message.includes("settings.finalScreen") ||
      w.message.includes("isFreeOrderAllowed") ||
      w.message.includes("taskContent.title") ||
      w.message.includes("finalMessage") ||
      w.message.includes("missing transition.poll") ||
      w.message.includes("pollPoints") ||
      w.message.includes("pollButtonNameOverride") ||
      w.message.includes("No stages defined")
    );
    expect(skeletonWarnings).toHaveLength(0);
  });
});
