import Conf from "conf";
import type { GlobalOptions } from "./types.js";

interface CliConfig {
  apiKey?: string;
  defaultProject?: string;
  defaultEnvironment?: string;
  baseUrl?: string;
}

const config = new Conf<CliConfig>({
  projectName: "stack0",
  schema: {
    apiKey: { type: "string" },
    defaultProject: { type: "string" },
    defaultEnvironment: { type: "string", enum: ["sandbox", "production"] },
    baseUrl: { type: "string" },
  },
});

export function resolveApiKey(opts: GlobalOptions): string | undefined {
  return opts.apiKey || process.env.STACK0_API_KEY || config.get("apiKey");
}

export function resolveProject(opts: GlobalOptions): string | undefined {
  return opts.project || process.env.STACK0_PROJECT || config.get("defaultProject");
}

export function resolveEnvironment(opts: GlobalOptions): string | undefined {
  return opts.env || process.env.STACK0_ENV || config.get("defaultEnvironment");
}

export function resolveBaseUrl(opts: GlobalOptions): string | undefined {
  return opts.baseUrl || process.env.STACK0_BASE_URL || config.get("baseUrl");
}

export function getConfig(): typeof config {
  return config;
}

export function setConfigValue(key: keyof CliConfig, value: string): void {
  config.set(key, value);
}

export function getConfigValue(key: keyof CliConfig): string | undefined {
  return config.get(key);
}

export function clearConfig(): void {
  config.clear();
}

export function getConfigPath(): string {
  return config.path;
}
