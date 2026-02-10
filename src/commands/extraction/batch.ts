import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput } from "../../output.js";
import { withSpinner } from "../../spinner.js";
import { resolveProject, resolveEnvironment } from "../../config.js";

export function registerBatchCommand(parent: Command): void {
  parent
    .command("batch")
    .description("Extract content from multiple URLs")
    .argument("[urls...]", "URLs to extract from")
    .option("--file <path>", "Read URLs from a file (one per line)")
    .option("--mode <mode>", "Extraction mode (auto, schema, markdown, raw)")
    .option("--schema <json>", "JSON schema (inline JSON or @path/to/file.json)")
    .option("--name <name>", "Batch job name")
    .option("--no-wait", "Return immediately with batch job ID")
    .action(
      withErrorHandler(async (urlArgs: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{
          file?: string;
          mode?: string;
          schema?: string;
          name?: string;
          wait: boolean;
        }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        let urls = (urlArgs as string[]) || [];

        if (opts.file) {
          const fileContent = readFileSync(opts.file, "utf-8");
          const fileUrls = fileContent.split("\n").map((l) => l.trim()).filter(Boolean);
          urls = [...urls, ...fileUrls];
        }

        if (urls.length === 0) {
          throw new Error("No URLs provided. Pass URLs as arguments or use --file.");
        }

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
          urls,
          ...(opts.name && { name: opts.name }),
          config: {
            ...(opts.mode && { mode: opts.mode as "auto" | "schema" | "markdown" | "raw" }),
            ...(schema && { schema }),
          },
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        };

        if (!opts.wait) {
          const { id, totalUrls } = await client.extraction.batch(request);
          printOutput({ id, totalUrls }, globalOpts);
          return;
        }

        const job = await withSpinner(
          `Processing batch of ${urls.length} URLs...`,
          async (spinner) => {
            const result = await client.extraction.batchAndWait(request);
            spinner.text = `Completed: ${result.successfulUrls}/${result.totalUrls} successful`;
            return result;
          },
        );

        printOutput(
          {
            id: job.id,
            status: job.status,
            totalUrls: job.totalUrls,
            processedUrls: job.processedUrls,
            successfulUrls: job.successfulUrls,
            failedUrls: job.failedUrls,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
          },
          globalOpts,
        );
      }),
    );
}
