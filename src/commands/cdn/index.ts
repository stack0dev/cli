import type { Command } from "commander";
import { registerUploadCommand } from "./upload.js";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";
import { registerDeleteManyCommand } from "./delete-many.js";
import { registerMoveCommand } from "./move.js";
import { registerTransformCommand } from "./transform.js";
import { registerUsageCommand } from "./usage.js";
import { registerFoldersCommand } from "./folders/index.js";
import { registerVideoCommand } from "./video/index.js";
import { registerPrivateCommand } from "./private/index.js";
import { registerBundlesCommand } from "./bundles/index.js";
import { registerImportsCommand } from "./imports/index.js";

export function registerCdnCommand(parent: Command): void {
  const cdn = parent.command("cdn").description("Manage CDN assets, folders, video, private files, and more");

  registerUploadCommand(cdn);
  registerListCommand(cdn);
  registerGetCommand(cdn);
  registerUpdateCommand(cdn);
  registerDeleteCommand(cdn);
  registerDeleteManyCommand(cdn);
  registerMoveCommand(cdn);
  registerTransformCommand(cdn);
  registerUsageCommand(cdn);
  registerFoldersCommand(cdn);
  registerVideoCommand(cdn);
  registerPrivateCommand(cdn);
  registerBundlesCommand(cdn);
  registerImportsCommand(cdn);
}
