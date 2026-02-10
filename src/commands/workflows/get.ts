import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject, resolveEnvironment } from "../../config.js";
import { printOutput } from "../../output.js";

export function registerGetCommand(parent: Command): void {
  parent
    .command("get <id-or-slug>")
    .description("Get a workflow by ID or slug")
    .action(
      withErrorHandler(async (idOrSlug: string, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts) as "sandbox" | "production" | undefined;

        const isId = idOrSlug.includes("-") || idOrSlug.length > 20;

        const workflow = await client.workflows.get({
          ...(isId ? { id: idOrSlug } : { slug: idOrSlug }),
          ...(projectSlug && { projectSlug }),
          ...(environment && { environment }),
        });

        printOutput(workflow, globalOpts);
      })
    );
}
