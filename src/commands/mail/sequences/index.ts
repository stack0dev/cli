import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 24 },
  { key: "status", header: "Status", width: 10 },
  { key: "triggerType", header: "Trigger", width: 16 },
  { key: "totalEntered", header: "Entered", width: 9 },
  { key: "totalActive", header: "Active", width: 8 },
  { key: "totalCompleted", header: "Done", width: 8 },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerSequencesCommand(mail: Command): void {
  const sequences = new Command("sequences").description("Manage email sequences");

  sequences
    .command("list")
    .description("List sequences")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.sequences, globalOpts, columns);
      })
    );

  sequences
    .command("get")
    .description("Get a sequence by ID")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.get(id as string);
        printOutput(result, globalOpts);
      })
    );

  sequences
    .command("create")
    .description("Create a sequence")
    .requiredOption("--name <name>", "Sequence name")
    .requiredOption("--trigger-type <type>", "Trigger type (manual, event_received, contact_added, api, scheduled)")
    .option("--description <desc>", "Description")
    .option("--trigger-frequency <freq>", "Trigger frequency (once, always)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.create({
          name: opts.name,
          description: opts.description,
          triggerType: opts.triggerType,
          triggerFrequency: opts.triggerFrequency,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Sequence "${result.name}" created (ID: ${result.id})`);
        }
      })
    );

  sequences
    .command("update")
    .description("Update a sequence")
    .argument("<id>", "Sequence ID")
    .option("--name <name>", "Sequence name")
    .option("--description <desc>", "Description")
    .option("--trigger-type <type>", "Trigger type")
    .option("--trigger-frequency <freq>", "Trigger frequency")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.update({
          id: id as string,
          name: opts.name,
          description: opts.description,
          triggerType: opts.triggerType,
          triggerFrequency: opts.triggerFrequency,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Sequence "${result.name}" updated.`);
        }
      })
    );

  sequences
    .command("delete")
    .description("Delete a sequence")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Sequence deleted.");
        }
      })
    );

  sequences
    .command("publish")
    .description("Publish (activate) a sequence")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.publish(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Sequence published.");
        }
      })
    );

  sequences
    .command("pause")
    .description("Pause an active sequence")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.pause(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Sequence paused.");
        }
      })
    );

  mail.addCommand(sequences);
}
