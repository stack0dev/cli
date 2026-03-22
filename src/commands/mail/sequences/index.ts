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

const nodeColumns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "nodeType", header: "Type", width: 16 },
  { key: "name", header: "Name", width: 24 },
  { key: "positionX", header: "X", width: 6 },
  { key: "positionY", header: "Y", width: 6 },
  { key: "sortOrder", header: "Order", width: 7 },
];

const entryColumns: Column[] = [
  { key: "id", header: "Entry ID", width: 28 },
  { key: "contactId", header: "Contact ID", width: 28 },
  { key: "status", header: "Status", width: 14 },
  { key: "currentNodeId", header: "Current Node", width: 28 },
  { key: "enteredAt", header: "Entered", width: 22, format: (v) => formatDate(v as string) },
];

const connectionColumns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "sourceNodeId", header: "Source", width: 28 },
  { key: "targetNodeId", header: "Target", width: 28 },
  { key: "connectionType", header: "Type", width: 12 },
];

export function registerSequencesCommand(mail: Command): void {
  const sequences = new Command("sequences").description("Manage email sequences");

  // ============================================================================
  // SEQUENCE CRUD
  // ============================================================================

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

  // ============================================================================
  // SEQUENCE LIFECYCLE
  // ============================================================================

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

  sequences
    .command("resume")
    .description("Resume a paused sequence")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.resume(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Sequence resumed.");
        }
      })
    );

  sequences
    .command("archive")
    .description("Archive a sequence")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.archive(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Sequence archived.");
        }
      })
    );

  sequences
    .command("duplicate")
    .description("Duplicate a sequence")
    .argument("<id>", "Sequence ID")
    .option("--name <name>", "Name for the duplicate")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.duplicate(id as string, opts.name);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Sequence duplicated as "${result.name}" (ID: ${result.id})`);
        }
      })
    );

  // ============================================================================
  // NODE MANAGEMENT
  // ============================================================================

  sequences
    .command("create-node")
    .description("Create a node in a sequence")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--type <type>", "Node type (trigger, email, timer, filter, branch, experiment, update_contact, add_to_list, remove_from_list, end)")
    .option("--name <name>", "Node name")
    .option("--position-x <n>", "X position", parseInt)
    .option("--position-y <n>", "Y position", parseInt)
    .option("--sort-order <n>", "Sort order", parseInt)
    .option("--config <json>", "Node config as JSON")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.createNode({
          id: opts.sequenceId,
          nodeType: opts.type,
          name: opts.name,
          positionX: opts.positionX,
          positionY: opts.positionY,
          sortOrder: opts.sortOrder,
          config: opts.config ? JSON.parse(opts.config) : undefined,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Node created (ID: ${result.id}, type: ${result.nodeType})`);
        }
      })
    );

  sequences
    .command("update-node")
    .description("Update a node")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .option("--name <name>", "Node name")
    .option("--sort-order <n>", "Sort order", parseInt)
    .option("--config <json>", "Node config as JSON")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.updateNode({
          id: opts.sequenceId,
          nodeId: opts.nodeId,
          name: opts.name,
          sortOrder: opts.sortOrder,
          config: opts.config ? JSON.parse(opts.config) : undefined,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Node updated.");
        }
      })
    );

  sequences
    .command("delete-node")
    .description("Delete a node from a sequence")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.deleteNode(opts.sequenceId, opts.nodeId);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Node deleted.");
        }
      })
    );

  // ============================================================================
  // NODE CONFIGURATION
  // ============================================================================

  sequences
    .command("set-node-email")
    .description("Configure an email node")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .requiredOption("--subject <subject>", "Email subject")
    .option("--html <html>", "HTML content")
    .option("--text <text>", "Text content")
    .option("--template-id <id>", "Template ID")
    .option("--from-email <email>", "Sender email")
    .option("--from-name <name>", "Sender name")
    .option("--reply-to <email>", "Reply-to address")
    .option("--preview-text <text>", "Preview/preheader text")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.setNodeEmail(opts.sequenceId, {
          nodeId: opts.nodeId,
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
          templateId: opts.templateId,
          fromEmail: opts.fromEmail,
          fromName: opts.fromName,
          replyTo: opts.replyTo,
          previewText: opts.previewText,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Email node configured.");
        }
      })
    );

  sequences
    .command("set-node-timer")
    .description("Configure a timer/delay node")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .requiredOption("--delay-amount <n>", "Delay amount", parseInt)
    .requiredOption("--delay-unit <unit>", "Delay unit (minutes, hours, days, weeks)")
    .option("--wait-until-time <time>", "Wait until time of day (HH:MM)")
    .option("--wait-until-timezone <tz>", "Timezone for wait-until-time")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.setNodeTimer(opts.sequenceId, {
          nodeId: opts.nodeId,
          delayAmount: opts.delayAmount,
          delayUnit: opts.delayUnit,
          waitUntilTime: opts.waitUntilTime,
          waitUntilTimezone: opts.waitUntilTimezone,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Timer set: ${opts.delayAmount} ${opts.delayUnit}`);
        }
      })
    );

  sequences
    .command("set-node-filter")
    .description("Configure a filter node")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .requiredOption("--conditions <json>", "Filter conditions as JSON")
    .option("--non-match-action <action>", "Action for non-matching contacts (stop, continue)", "stop")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.setNodeFilter(opts.sequenceId, {
          nodeId: opts.nodeId,
          conditions: JSON.parse(opts.conditions),
          nonMatchAction: opts.nonMatchAction,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Filter node configured.");
        }
      })
    );

  sequences
    .command("set-node-branch")
    .description("Configure a branch node")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .requiredOption("--branches <json>", "Branch conditions as JSON array")
    .option("--has-default-branch", "Include a default branch for unmatched contacts")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.setNodeBranch(opts.sequenceId, {
          nodeId: opts.nodeId,
          branches: JSON.parse(opts.branches),
          hasDefaultBranch: opts.hasDefaultBranch ?? true,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Branch node configured.");
        }
      })
    );

  sequences
    .command("set-node-experiment")
    .description("Configure an A/B experiment node")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--node-id <id>", "Node ID")
    .requiredOption("--variants <json>", "Variants as JSON array [{id, name, weight}]")
    .option("--sample-size <n>", "Sample size percentage (0-100)", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.setNodeExperiment(opts.sequenceId, {
          nodeId: opts.nodeId,
          variants: JSON.parse(opts.variants),
          sampleSize: opts.sampleSize,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Experiment node configured.");
        }
      })
    );

  // ============================================================================
  // CONNECTIONS
  // ============================================================================

  sequences
    .command("create-connection")
    .description("Create a connection between two nodes")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--source-node-id <id>", "Source node ID")
    .requiredOption("--target-node-id <id>", "Target node ID")
    .option("--connection-type <type>", "Connection type (default, yes, no, or variant ID)", "default")
    .option("--label <label>", "Connection label")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.createConnection({
          id: opts.sequenceId,
          sourceNodeId: opts.sourceNodeId,
          targetNodeId: opts.targetNodeId,
          connectionType: opts.connectionType,
          label: opts.label,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Connection created (ID: ${result.id})`);
        }
      })
    );

  sequences
    .command("delete-connection")
    .description("Delete a connection between nodes")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--connection-id <id>", "Connection ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.deleteConnection(opts.sequenceId, opts.connectionId);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Connection deleted.");
        }
      })
    );

  // ============================================================================
  // ENTRIES (CONTACTS IN SEQUENCE)
  // ============================================================================

  sequences
    .command("list-entries")
    .description("List contacts in a sequence")
    .argument("<id>", "Sequence ID")
    .option("--status <status>", "Filter by status (active, completed, paused, stopped, bounced, unsubscribed)")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.listEntries({
          id: id as string,
          status: opts.status,
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.entries, globalOpts, entryColumns);
      })
    );

  sequences
    .command("add-contact")
    .description("Add a contact to a sequence")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--contact-id <id>", "Contact ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.addContact({
          id: opts.sequenceId,
          contactId: opts.contactId,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Contact added to sequence (Entry ID: ${result.id})`);
        }
      })
    );

  sequences
    .command("remove-contact")
    .description("Remove a contact from a sequence")
    .requiredOption("--sequence-id <id>", "Sequence ID")
    .requiredOption("--entry-id <id>", "Entry ID")
    .option("--reason <reason>", "Exit reason")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.removeContact({
          id: opts.sequenceId,
          entryId: opts.entryId,
          reason: opts.reason,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Contact removed from sequence.");
        }
      })
    );

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  sequences
    .command("analytics")
    .description("Get sequence analytics")
    .argument("<id>", "Sequence ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.sequences.getAnalytics(id as string);
        printOutput(result, globalOpts);
      })
    );

  mail.addCommand(sequences);
}
