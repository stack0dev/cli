import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject } from "../../config.js";
import { printSuccess } from "../../output.js";

export function registerDeleteCommand(parent: Command): void {
  parent
    .command("delete <id>")
    .description("Delete a workflow")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);

        await client.workflows.delete({
          id,
          ...(projectSlug && { projectSlug }),
        });

        printSuccess(`Deleted workflow ${id}`);
      })
    );
}
