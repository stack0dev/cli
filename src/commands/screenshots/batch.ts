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
    .description("Capture screenshots for multiple URLs")
    .argument("[urls...]", "URLs to capture")
    .option("--file <path>", "Read URLs from a file (one per line)")
    .option("--format <format>", "Image format (png, jpeg, webp)")
    .option("--full-page", "Capture the full page")
    .option("--device <type>", "Device type (desktop, tablet, mobile)")
    .option("--name <name>", "Batch job name")
    .option("--no-wait", "Return immediately with batch job ID")
    .action(
      withErrorHandler(async (urlArgs: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{
          file?: string;
          format?: string;
          fullPage?: boolean;
          device?: string;
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

        const request = {
          urls,
          ...(opts.name && { name: opts.name }),
          config: {
            ...(opts.format && { format: opts.format as "png" | "jpeg" | "webp" }),
            ...(opts.fullPage && { fullPage: true }),
            ...(opts.device && { deviceType: opts.device as "desktop" | "tablet" | "mobile" }),
          },
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        };

        if (!opts.wait) {
          const { id, totalUrls } = await client.screenshots.batch(request);
          printOutput({ id, totalUrls }, globalOpts);
          return;
        }

        const job = await withSpinner(
          `Processing batch of ${urls.length} URLs...`,
          async (spinner) => {
            const result = await client.screenshots.batchAndWait(request);
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
