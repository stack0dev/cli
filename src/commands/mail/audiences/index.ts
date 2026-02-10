import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 24 },
  { key: "totalContacts", header: "Total", width: 8 },
  { key: "subscribedContacts", header: "Subscribed", width: 12 },
  { key: "unsubscribedContacts", header: "Unsubscribed", width: 14 },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerAudiencesCommand(mail: Command): void {
  const audiences = new Command("audiences").description("Manage audiences");

  audiences
    .command("list")
    .description("List audiences")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.audiences.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.audiences, globalOpts, columns);
      })
    );

  audiences
    .command("get")
    .description("Get an audience by ID")
    .argument("<id>", "Audience ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.audiences.get(id as string);
        printOutput(result, globalOpts);
      })
    );

  audiences
    .command("create")
    .description("Create an audience")
    .requiredOption("--name <name>", "Audience name")
    .option("--description <desc>", "Audience description")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.audiences.create({
          name: opts.name,
          description: opts.description,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Audience "${result.name}" created (ID: ${result.id})`);
        }
      })
    );

  audiences
    .command("update")
    .description("Update an audience")
    .argument("<id>", "Audience ID")
    .option("--name <name>", "Audience name")
    .option("--description <desc>", "Audience description")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.audiences.update({
          id: id as string,
          name: opts.name,
          description: opts.description,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Audience "${result.name}" updated.`);
        }
      })
    );

  audiences
    .command("delete")
    .description("Delete an audience")
    .argument("<id>", "Audience ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.audiences.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Audience deleted.");
        }
      })
    );

  mail.addCommand(audiences);
}
