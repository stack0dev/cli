import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput } from "../../output.js";

export function registerGetCommand(mail: Command): void {
  mail
    .command("get")
    .description("Get email details by ID")
    .argument("<id>", "Email ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.get(id as string);
        printOutput(result, globalOpts);
      })
    );
}
