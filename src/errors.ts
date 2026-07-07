export class EventiciousError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "EventiciousError";
  }
}

export class AuthError extends EventiciousError {
  constructor(endpoint: string, detail?: string) {
    super(
      detail || "Authentication failed with Eventicious API",
      401,
      endpoint
    );
    this.name = "AuthError";
  }
}

export class ValidationError extends EventiciousError {
  constructor(endpoint: string, detail: string) {
    super(detail, 400, endpoint);
    this.name = "ValidationError";
  }
}

export interface StructuredErrorField {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

export interface StructuredErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    field?: string;
    suggestion?: string;
    issues?: StructuredErrorField[];
    tool?: string;
    endpoint?: string;
    checkedRequiredFields?: string[];
  };
}

export function formatValidationError(
  toolName: string,
  apiEndpoint: string,
  message: string,
  checkedFields: string[]
): StructuredErrorResponse {
  const fieldMatch = checkedFields.find(f => message.toLowerCase().includes(f.toLowerCase()));
  return {
    ok: false,
    error: {
      code: "validation_failed",
      message,
      tool: toolName,
      endpoint: apiEndpoint,
      checkedRequiredFields: checkedFields,
      ...(fieldMatch ? {
        field: fieldMatch,
        suggestion: `Ensure "${fieldMatch}" is provided and non-empty. If the field is optional, set it to an empty string explicitly.`
      } : {
        suggestion: "Check that all required fields are provided. Refer to the tool description for the required schema."
      }),
    },
  };
}

export function formatZodIssues(issues: { path: (string | number)[]; message: string; code: string }[]): StructuredErrorResponse {
  return {
    ok: false,
    error: {
      code: "validation_failed",
      message: "Input validation failed",
      issues: issues.map(i => ({
        field: i.path.join("."),
        code: i.code,
        message: i.message,
        suggestion: `Provide a valid value for "${i.path.join(".")}".`,
      })),
    },
  };
}
