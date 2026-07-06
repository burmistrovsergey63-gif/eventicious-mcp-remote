import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "../logger";
import {
  UploadInlineImageInput,
  isPublicHttpsUrl,
} from "../storage/inline-image-storage";

export type InlineImagePlanItem = {
  action: "upload_inline_image";
  provider: "imgbb";
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  willUseExpiration: boolean;
};

function hasImageNodes(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const obj = node as Record<string, unknown>;
  if (obj.type === "image") return true;
  if (Array.isArray(obj.content)) {
    return obj.content.some(hasImageNodes);
  }
  if (Array.isArray(obj)) {
    return obj.some(hasImageNodes);
  }
  return false;
}

interface GravityJsonConversionResult {
  result: Record<string, unknown>;
  warnings: string[];
  errors: string[];
}

interface GravityJsonValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateGravityJson(input: unknown): GravityJsonValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    errors.push("GravityJson must be an object");
    return { valid: false, warnings, errors };
  }

  const obj = input as Record<string, unknown>;
  if (obj.type !== "doc") {
    errors.push('Root type must be "doc", got "' + obj.type + '"');
  }
  if (!Array.isArray(obj.content)) {
    errors.push("Root must have a content array");
  }

  return { valid: errors.length === 0, warnings, errors };
}

function collectImageNodes(node: unknown): UploadInlineImageInput[] {
  const images: UploadInlineImageInput[] = [];
  if (!node || typeof node !== "object") return images;
  const obj = node as Record<string, unknown>;

  if (obj.type === "image") {
    const attrs = obj.attrs as Record<string, unknown> | undefined;
    if (attrs) {
      if (typeof attrs.fileId === "string" && attrs.fileId) {
        throw new Error("Eventicious fileId cannot be used as GravityJson image.attrs.src.");
      }
      const img: UploadInlineImageInput = {};
      if (typeof attrs.imageUrl === "string") img.imageUrl = attrs.imageUrl;
      if (typeof attrs.fileBase64 === "string") img.fileBase64 = attrs.fileBase64;
      if (typeof attrs.dataUri === "string") img.dataUri = attrs.dataUri;
      if (typeof attrs.fileName === "string") img.fileName = attrs.fileName;
      if (typeof attrs.mimeType === "string") img.mimeType = attrs.mimeType;
      if (typeof attrs.src === "string" && attrs.src.startsWith("data:")) {
        img.dataUri = attrs.src;
      }
      if (img.imageUrl || img.fileBase64 || img.dataUri) {
        images.push(img);
      }
    }
  }

  if (Array.isArray(obj.content)) {
    for (const child of obj.content) {
      images.push(...collectImageNodes(child));
    }
  }

  return images;
}

export function buildInlineImagePlan(
  gravityJson: Record<string, unknown>,
  options: { forceUpload?: boolean; expirationSeconds?: number }
): InlineImagePlanItem[] {
  if (!hasImageNodes(gravityJson)) return [];

  const imageInputs = collectImageNodes(gravityJson);
  const plan: InlineImagePlanItem[] = [];

  for (const input of imageInputs) {
    const fileName = input.fileName || "inline-image";
    const mimeType = input.mimeType || "image/jpeg";
    const needsUpload = options.forceUpload || !isPublicHttpsUrl(input.imageUrl || "") || !!input.dataUri || !!input.fileBase64;

    if (needsUpload) {
      plan.push({
        action: "upload_inline_image",
        provider: "imgbb",
        fileName,
        mimeType,
        willUseExpiration: !!options.expirationSeconds,
      });
    }
  }

  return plan;
}

export function convertMarkdownToGravityJson(text: string): GravityJsonConversionResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const lines = text.split("\n");
  const content: unknown[] = [];
  let i = 0;

  function parseInlineFormatting(line: string): unknown[] {
    const nodes: unknown[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      const boldIndex = remaining.indexOf("**");
      const italicIndex = remaining.indexOf("*");
      const linkIndex = remaining.indexOf("[");

      let earliestType = "";
      let earliestIndex = remaining.length;

      if (boldIndex >= 0 && boldIndex < earliestIndex) {
        earliestType = "bold";
        earliestIndex = boldIndex;
      }
      if (italicIndex >= 0 && italicIndex < earliestIndex && italicIndex !== boldIndex) {
        earliestType = "italic";
        earliestIndex = italicIndex;
      }
      if (linkIndex >= 0 && linkIndex < earliestIndex) {
        earliestType = "link";
        earliestIndex = linkIndex;
      }

      if (earliestType === "") {
        if (remaining.length > 0) {
          nodes.push({ type: "text", text: remaining });
        }
        break;
      }

      if (earliestIndex > 0) {
        nodes.push({ type: "text", text: remaining.slice(0, earliestIndex) });
      }

      if (earliestType === "bold") {
        const endBold = remaining.indexOf("**", earliestIndex + 2);
        if (endBold > earliestIndex) {
          const boldText = remaining.slice(earliestIndex + 2, endBold);
          nodes.push({
            type: "text",
            marks: [{ type: "strong", attrs: { dataMarkup: "**" } }],
            text: boldText,
          });
          remaining = remaining.slice(endBold + 2);
        } else {
          nodes.push({ type: "text", text: "**" });
          remaining = remaining.slice(2);
        }
      } else if (earliestType === "italic") {
        const endItalic = remaining.indexOf("*", earliestIndex + 1);
        if (endItalic > earliestIndex) {
          const italicText = remaining.slice(earliestIndex + 1, endItalic);
          nodes.push({
            type: "text",
            marks: [{ type: "em", attrs: { dataMarkup: "*" } }],
            text: italicText,
          });
          remaining = remaining.slice(endItalic + 1);
        } else {
          nodes.push({ type: "text", text: "*" });
          remaining = remaining.slice(1);
        }
      } else if (earliestType === "link") {
        const closeBracket = remaining.indexOf("]", earliestIndex + 1);
        const openParen = remaining.indexOf("(", closeBracket + 1);
        const closeParen = remaining.indexOf(")", openParen + 1);
        if (closeBracket > earliestIndex && openParen === closeBracket + 1 && closeParen > openParen) {
          const linkText = remaining.slice(earliestIndex + 1, closeBracket);
          const href = remaining.slice(openParen + 1, closeParen);
          nodes.push({
            type: "text",
            marks: [{ type: "link", attrs: { href: href, title: null } }],
            text: linkText,
          });
          remaining = remaining.slice(closeParen + 1);
        } else {
          nodes.push({ type: "text", text: "[" });
          remaining = remaining.slice(1);
        }
      }
    }

    return nodes.length > 0 ? nodes : [{ type: "text", text: line }];
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    if (trimmed === "") {
      i++;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      content.push({
        type: "heading",
        attrs: { level: level, id: "", dataLine: null },
        content: [{ type: "text", text: headingMatch[2] }],
      });
      i++;
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const items: unknown[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].trimEnd().match(/^[-*]\s+(.+)$/);
        if (!itemMatch) break;
        items.push({
          type: "list_item",
          attrs: { markup: null, dataLine: null },
          content: [{
            type: "paragraph",
            attrs: { dataLine: null },
            content: parseInlineFormatting(itemMatch[1]),
          }],
        });
        i++;
      }
      content.push({
        type: "bullet_list",
        attrs: {},
        content: items,
      });
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      const items: unknown[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].trimEnd().match(/^(\d+)\.\s+(.+)$/);
        if (!itemMatch) break;
        items.push({
          type: "list_item",
          attrs: { markup: null, dataLine: null },
          content: [{
            type: "paragraph",
            attrs: { dataLine: null },
            content: parseInlineFormatting(itemMatch[2]),
          }],
        });
        i++;
      }
      content.push({
        type: "ordered_list",
        attrs: {},
        content: items,
      });
      continue;
    }

    content.push({
      type: "paragraph",
      attrs: { dataLine: null },
      content: parseInlineFormatting(trimmed),
    });
    i++;
  }

  if (content.length === 0) {
    warnings.push("Input produced empty document");
  }

  return {
    result: { type: "doc", content: content },
    warnings: warnings,
    errors: errors,
  };
}

const convertSchema = {
  text: z.string().describe("Markdown or plain text to convert to GravityJson"),
};

const validateSchema = {
  gravityJson: z.record(z.unknown()).describe("GravityJson object to validate"),
};

export function registerGravityJsonTools(
  server: McpServer,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_convert_markdown_to_gravity_json",
    "Convert markdown or plain text to GravityJson (ProseMirror) format for Text 2.0 catalog elements. Never performs API calls. For Russian text use UTF-8. In direct PowerShell 5.1 HTTP JSON calls do not pass JSON as -Body string; use UTF-8 bytes.",
    convertSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_convert_markdown_to_gravity_json" });
      try {
        const conversion = convertMarkdownToGravityJson(params.text);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              gravityJson: conversion.result,
              warnings: conversion.warnings,
              errors: conversion.errors,
            }),
          }],
        };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );

  server.tool(
    "eventicious_validate_gravity_json",
    "Validate a GravityJson object for Text 2.0 catalog elements. Never performs API calls. For Russian text use UTF-8. In direct PowerShell 5.1 HTTP JSON calls do not pass JSON as -Body string; use UTF-8 bytes.",
    validateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_validate_gravity_json" });
      try {
        const validation = validateGravityJson(params.gravityJson);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              valid: validation.valid,
              warnings: validation.warnings,
              errors: validation.errors,
            }),
          }],
        };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );
}
