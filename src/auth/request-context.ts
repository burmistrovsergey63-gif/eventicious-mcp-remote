import { z } from "zod";

export const eventiciousRequestInfoSchema = z.object({
  eventId: z.string().min(1),
  applicationId: z.string().min(1),
  languageId: z.string().min(1),
  appLanguageId: z.string().min(1),
});

export type EventiciousRequestInfo = z.infer<typeof eventiciousRequestInfoSchema>;

export function normalizeRequestInfo(input: unknown): EventiciousRequestInfo {
  if (typeof input === "string") {
    const parsed = JSON.parse(input);
    return eventiciousRequestInfoSchema.parse(parsed);
  }
  return eventiciousRequestInfoSchema.parse(input);
}
