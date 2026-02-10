import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput } from "../../output.js";
import { withSpinner } from "../../spinner.js";
import { resolveProject, resolveEnvironment } from "../../config.js";

export function registerExtractCommand(parent: Command): void {
  parent
    .command("extract")
    .description("Extract content from a URL")
    .argument("<url>", "URL to extract from")
    .option("--mode <mode>", "Extraction mode (auto, schema, markdown, raw)", "auto")
    .option("--schema <json>", "JSON schema (inline JSON or @path/to/file.json)")
    .option("--prompt <text>", "Extraction prompt")
    .option("--include-links", "Include links in extraction")
    .option("--include-images", "Include images in extraction")
    .option("--include-metadata", "Include page metadata")
    .option("--no-wait", "Return immediately with job ID instead of waiting")
    .action(
      withErrorHandler(async (url: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{
          mode: string;
          schema?: string;
          prompt?: string;
          includeLinks?: boolean;
          includeImages?: boolean;
          includeMetadata?: boolean;
          wait: boolean;
        }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        let schema: Record<string, unknown> | undefined;
        if (opts.schema) {
          if (opts.schema.startsWith("@")) {
            const filePath = opts.schema.slice(1);
            schema = JSON.parse(readFileSync(filePath, "utf-8"));
          } else {
            schema = JSON.parse(opts.schema);
          }
        }

        const request = {
          url: url as string,
          mode: opts.mode as "auto" | "schema" | "markdown" | "raw",
          ...(schema && { schema }),
          ...(opts.prompt && { prompt: opts.prompt }),
          ...(opts.includeLinks && { includeLinks: true }),
          ...(opts.includeImages && { includeImages: true }),
          ...(opts.includeMetadata && { includeMetadata: true }),
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        };

        if (!opts.wait) {
          const { id, status } = await client.extraction.extract(request);
          printOutput({ id, status }, globalOpts);
          return;
        }

        const result = await withSpinner("Extracting content...", async () => {
          return client.extraction.extractAndWait(request);
        });

        printOutput(
          {
            id: result.id,
            url: result.url,
            mode: result.mode,
            status: result.status,
            markdown: result.markdown,
            extractedData: result.extractedData,
            pageMetadata: result.pageMetadata,
            tokensUsed: result.tokensUsed,
            processingTimeMs: result.processingTimeMs,
            createdAt: result.createdAt,
            completedAt: result.completedAt,
          },
          globalOpts,
        );
      }),
    );
}
