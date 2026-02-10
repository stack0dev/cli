import Stack0 from "@stack0/sdk";
import { resolveApiKey, resolveBaseUrl } from "./config.js";
import type { GlobalOptions } from "./types.js";

export function createClient(opts: GlobalOptions): Stack0 {
  const apiKey = resolveApiKey(opts);
  if (!apiKey) {
    throw new Error(
      "No API key found. Provide one via --api-key, STACK0_API_KEY env variable, or run `stack0 auth login`."
    );
  }

  const baseUrl = resolveBaseUrl(opts);

  return new Stack0({
    apiKey,
    ...(baseUrl && { baseUrl }),
  });
}
