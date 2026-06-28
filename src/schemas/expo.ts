import { z } from "zod";

// --- Exhibitor Create Schema ---
export const exhibitorCreateSchema = {
  id: z.number().int().describe("Exhibitor ID in your external system"),
  name: z.string().min(1).describe("Company name"),
  address: z.string().optional().describe("Company address"),
  site: z.string().url().optional().describe("Company website URL"),
  email: z.string().email().optional().describe("Contact email"),
  phone: z.string().optional().describe("Contact phone"),
  details: z.string().optional().describe("Company details, supports formatted HTML"),
  externalImagePath: z.string().url().optional().describe("URL for company logo image"),
  representativesIds: z.array(z.number().int()).optional().describe("User IDs of company representatives"),
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Exhibitor Update Schema ---
export const exhibitorUpdateSchema = {
  id: z.number().int().describe("Exhibitor ID in your external system"),
  name: z.string().optional().describe("Company name"),
  address: z.string().optional().describe("Company address"),
  site: z.string().url().optional().describe("Company website URL"),
  email: z.string().email().optional().describe("Contact email"),
  phone: z.string().optional().describe("Contact phone"),
  details: z.string().optional().describe("Company details, supports formatted HTML"),
  externalImagePath: z.string().url().optional().describe("URL for company logo image"),
  language: z.string().optional().describe("Language code for the exhibitor"),
  representativesIds: z.array(z.number().int()).optional().describe("User IDs of company representatives"),
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Exhibitor Delete Schema ---
export const exhibitorDeleteSchema = {
  id: z.number().int().describe("Exhibitor ID in your external system"),
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_EXHIBITOR").optional().describe("Exact string required for real deletion"),
};

// --- Prepare Exhibitors Import Schema ---
export const prepareExhibitorsImportSchema = {
  exhibitors: z.array(z.object({
    id: z.number().int(),
    name: z.string(),
    address: z.string().optional(),
    site: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    details: z.string().optional(),
    externalImagePath: z.string().optional(),
    representativesIds: z.array(z.number().int()).optional(),
  })).min(1).max(100).describe("Array of exhibitors to import"),
};

// --- Validate Exhibitor Plan Schema ---
export const validateExhibitorPlanSchema = {
  plan: z.object({
    create: z.array(z.object({
      id: z.number().int(),
      name: z.string(),
      address: z.string().optional(),
      site: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      details: z.string().optional(),
      externalImagePath: z.string().optional(),
      representativesIds: z.array(z.number().int()).optional(),
    })).optional().describe("Exhibitors to create"),
    update: z.array(z.object({
      id: z.number().int(),
      name: z.string().optional(),
      address: z.string().optional(),
      site: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      details: z.string().optional(),
      externalImagePath: z.string().optional(),
      language: z.string().optional(),
      representativesIds: z.array(z.number().int()).optional(),
    })).optional().describe("Exhibitors to update"),
    delete: z.array(z.object({
      id: z.number().int(),
    })).optional().describe("Exhibitors to delete"),
  }).describe("Import plan with create/update/delete arrays"),
};
