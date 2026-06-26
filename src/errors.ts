export class EventiciousError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
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
