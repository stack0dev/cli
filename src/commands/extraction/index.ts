import type { Command } from "commander";
import { registerExtractCommand } from "./extract.js";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerDeleteCommand } from "./delete.js";
import { registerBatchCommand } from "./batch.js";
import { registerUsageCommand } from "./usage.js";
import { registerSchedulesCommand } from "./schedules/index.js";

export function registerExtractionCommand(parent: Command): void {
  const extraction = parent
    .command("extraction")
    .description("Extract structured data from webpages using AI");

  registerExtractCommand(extraction);
  registerListCommand(extraction);
  registerGetCommand(extraction);
  registerDeleteCommand(extraction);
  registerBatchCommand(extraction);
  registerUsageCommand(extraction);
  registerSchedulesCommand(extraction);
}
