import { z } from "zod";

export const dryRunParams = {
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
