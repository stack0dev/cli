import { Command } from "commander";
import chalk from "chalk";
import type { GlobalOptions } from "./types.js";

interface ApiError {
  status?: number;
  message?: string;
  code?: string;
}

function formatApiError(error: ApiError): string {
  const status = error.status;
  const message = error.message || "An unknown error occurred";

  switch (status) {
    case 401:
      return `Authentication failed: ${message}\nRun \`stack0 auth login\` or provide a valid API key.`;
    case 403:
      return `Permission denied: ${message}`;
    case 404:
      return `Not found: ${message}`;
    case 422:
      return `Validation error: ${message}`;
    case 429:
      return `Rate limited: ${message}\nPlease wait and try again.`;
    default:
      return status ? `Error (${status}): ${message}` : message;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler(fn: (...args: any[]) => Promise<void>): (...args: any[]) => Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (error: unknown) {
      const cmd = args.find((a) => a instanceof Command) as Command | undefined;
      const opts = cmd?.optsWithGlobals?.() as GlobalOptions | undefined;

      const err = error as ApiError & { stack?: string };

      if (opts?.json) {
        console.error(
          JSON.stringify({
            error: true,
            message: err.message || String(error),
            ...(err.status && { status: err.status }),
            ...(err.code && { code: err.code }),
          })
        );
      } else {
        console.error(chalk.red(formatApiError(err)));
        if (opts?.verbose && err.stack) {
          console.error(chalk.dim(err.stack));
        }
      }

      process.exit(1);
    }
  };
}

export function getGlobalOptions(cmd: Command): GlobalOptions {
  return cmd.optsWithGlobals() as GlobalOptions;
}
