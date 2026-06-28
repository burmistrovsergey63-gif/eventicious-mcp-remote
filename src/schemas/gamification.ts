import { z } from "zod";

// --- Gamification Manual Charge Schema ---
export const gamificationManualChargeSchema = {
  externalId: z.number().int().describe("External user ID"),
  scores: z.number().int().refine((val) => val !== 0, "Scores cannot be zero").describe("Points to charge (positive=charge, negative=write-off). Max absolute value: 10000"),
  reason: z.string().min(1).describe("Reason for the charge/write-off"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Gamification Validate Charge Schema ---
export const gamificationValidateChargeSchema = {
  externalId: z.number().int().describe("External user ID"),
  scores: z.number().int().refine((val) => val !== 0, "Scores cannot be zero").describe("Points to charge (positive=charge, negative=write-off)"),
  reason: z.string().min(1).describe("Reason for the charge/write-off"),
};
