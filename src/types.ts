export interface GlobalOptions {
  apiKey?: string;
  project?: string;
  env?: string;
  json?: boolean;
  verbose?: boolean;
  color?: boolean;
  baseUrl?: string;
}

export type OutputFormat = "table" | "json";
