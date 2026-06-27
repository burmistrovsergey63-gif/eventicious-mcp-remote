import { z } from "zod";

// --- Gamification Manual Charge Schema ---
export const gamificationManualChargeSchema = {
  externalId: z.number().int().describe("External user ID"),
  scores: z.number().int().min(1).max(10000).describe("Points to charge (1-10000)"),
  reason: z.string().min(1).describe("Reason for the charge"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
