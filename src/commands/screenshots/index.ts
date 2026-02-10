import type { Command } from "commander";
import { registerCaptureCommand } from "./capture.js";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerDeleteCommand } from "./delete.js";
import { registerBatchCommand } from "./batch.js";
import { registerSchedulesCommand } from "./schedules/index.js";

export function registerScreenshotsCommand(parent: Command): void {
  const screenshots = parent
    .command("screenshots")
    .description("Capture and manage webpage screenshots");

  registerCaptureCommand(screenshots);
  registerListCommand(screenshots);
  registerGetCommand(screenshots);
  registerDeleteCommand(screenshots);
  registerBatchCommand(screenshots);
  registerSchedulesCommand(screenshots);
}
