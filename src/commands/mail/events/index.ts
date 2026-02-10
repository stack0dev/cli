import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 24 },
  { key: "description", header: "Description", width: 30 },
  { key: "totalReceived", header: "Received", width: 10 },
  { key: "lastReceivedAt", header: "Last Received", width: 22, format: (v) => formatDate(v as string) },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerEventsCommand(mail: Command): void {
  const events = new Command("events").description("Manage mail events");

  events
    .command("list")
    .description("List event definitions")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.events.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.events, globalOpts, columns);
      })
    );

  events
    .command("get")
    .description("Get an event definition by ID")
    .argument("<id>", "Event ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.events.get(id as string);
        printOutput(result, globalOpts);
      })
    );

  events
    .command("create")
    .description("Create an event definition")
    .requiredOption("--name <name>", "Event name")
    .option("--description <desc>", "Event description")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.events.create({
          name: opts.name,
          description: opts.description,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Event "${result.name}" created (ID: ${result.id})`);
        }
      })
    );

  events
    .command("track")
    .description("Track an event occurrence")
    .requiredOption("--event-name <name>", "Event name")
    .option("--contact-id <id>", "Contact ID")
    .option("--contact-email <email>", "Contact email")
    .option("--properties <json>", "Event properties as JSON")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.events.track({
          eventName: opts.eventName,
          contactId: opts.contactId,
          contactEmail: opts.contactEmail,
          properties: opts.properties ? JSON.parse(opts.properties) : undefined,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Event tracked.");
        }
      })
    );

  events
    .command("delete")
    .description("Delete an event definition")
    .argument("<id>", "Event ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.events.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Event deleted.");
        }
      })
    );

  mail.addCommand(events);
}
