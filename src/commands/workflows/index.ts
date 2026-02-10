import type { Command } from "commander";
import { registerCreateCommand } from "./create.js";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";
import { registerRunCommand } from "./run.js";
import { registerRunsCommand } from "./runs/index.js";

export function registerWorkflowsCommand(parent: Command): void {
  const workflows = parent
    .command("workflows")
    .description("Manage AI workflows and execution");

  registerCreateCommand(workflows);
  registerListCommand(workflows);
  registerGetCommand(workflows);
  registerUpdateCommand(workflows);
  registerDeleteCommand(workflows);
  registerRunCommand(workflows);
  registerRunsCommand(workflows);
}
