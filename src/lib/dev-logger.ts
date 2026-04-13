type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown> | unknown;

interface LogPayload {
  message: string;
  context?: LogContext;
  timestamp: string;
}

const LOG_METHODS: Record<LogLevel, "info" | "warn" | "error" | "debug"> = {
  info: "info",
  warn: "warn",
  error: "error",
  debug: "debug",
};

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === "production") {
    return level === "warn" || level === "error";
  }

  return true;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload: LogPayload = {
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  const method = LOG_METHODS[level];
  const prefix = `[dev-logger:${level}]`;

  if (context === undefined) {
    console[method](prefix, payload.message);
    return;
  }

  console[method](prefix, payload.message, {
    context: payload.context,
    timestamp: payload.timestamp,
  });
}

export const logger = {
  info(message: string, context?: LogContext): void {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    write("error", message, context);
  },
  debug(message: string, context?: LogContext): void {
    write("debug", message, context);
  },
};
