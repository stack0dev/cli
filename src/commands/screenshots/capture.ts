import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, printSuccess } from "../../output.js";
import { withSpinner } from "../../spinner.js";
import { resolveProject, resolveEnvironment } from "../../config.js";

export function registerCaptureCommand(parent: Command): void {
  parent
    .command("capture")
    .description("Capture a screenshot of a URL")
    .argument("<url>", "URL to capture")
    .option("--format <format>", "Image format (png, jpeg, webp)", "png")
    .option("--full-page", "Capture the full page")
    .option("--device <type>", "Device type (desktop, tablet, mobile)", "desktop")
    .option("--width <pixels>", "Viewport width", parseInt)
    .option("--height <pixels>", "Viewport height", parseInt)
    .option("--delay <ms>", "Wait timeout in milliseconds", parseInt)
    .option("--quality <value>", "Image quality (1-100)", parseInt)
    .option("--no-wait", "Return immediately with job ID instead of waiting")
    .action(
      withErrorHandler(async (url: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{
          format: string;
          fullPage?: boolean;
          device: string;
          width?: number;
          height?: number;
          delay?: number;
          quality?: number;
          wait: boolean;
        }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const request = {
          url: url as string,
          format: opts.format as "png" | "jpeg" | "webp",
          fullPage: opts.fullPage,
          deviceType: opts.device as "desktop" | "tablet" | "mobile",
          ...(opts.width && { viewportWidth: opts.width }),
          ...(opts.height && { viewportHeight: opts.height }),
          ...(opts.delay && { waitForTimeout: opts.delay }),
          ...(opts.quality && { quality: opts.quality }),
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        };

        if (!opts.wait) {
          const { id, status } = await client.screenshots.capture(request);
          printOutput({ id, status }, globalOpts);
          return;
        }

        const screenshot = await withSpinner("Capturing screenshot...", async () => {
          return client.screenshots.captureAndWait(request);
        });

        printOutput(
          {
            id: screenshot.id,
            url: screenshot.url,
            status: screenshot.status,
            format: screenshot.format,
            imageUrl: screenshot.imageUrl,
            imageSize: screenshot.imageSize,
            imageWidth: screenshot.imageWidth,
            imageHeight: screenshot.imageHeight,
            processingTimeMs: screenshot.processingTimeMs,
            createdAt: screenshot.createdAt,
            completedAt: screenshot.completedAt,
          },
          globalOpts,
        );
      }),
    );
}
