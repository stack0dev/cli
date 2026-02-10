import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const CHANNEL_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "type", header: "Type" },
  { key: "memberCount", header: "Members" },
  { key: "isArchived", header: "Archived", format: (v) => (v ? "Yes" : "No") },
];

const MESSAGE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "senderName", header: "From" },
  { key: "content", header: "Content" },
  { key: "createdAt", header: "Sent", format: (v) => formatDate(v as string) },
];

const USER_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "username", header: "Username" },
  { key: "email", header: "Email" },
  { key: "isBot", header: "Bot", format: (v) => (v ? "Yes" : "No") },
];

function requireConnectionId(cmd: Command): string {
  const localOpts = cmd.opts<{ connectionId?: string }>();
  if (!localOpts.connectionId) {
    throw new Error("--connection-id is required.");
  }
  return localOpts.connectionId;
}

function registerChannelsCommand(communication: Command): void {
  const channels = new Command("channels").description("Manage communication channels");
  channels.requiredOption("--connection-id <id>", "Connection ID");

  channels
    .command("list")
    .description("List channels")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.communication.listChannels(connectionId, {
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.data, opts, CHANNEL_COLUMNS);
      }),
    );

  channels
    .command("get <id>")
    .description("Get channel details")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const channel = await client.integrations.communication.getChannel(connectionId, id);
        printOutput(channel, opts);
      }),
    );

  communication.addCommand(channels);
}

function registerMessagesCommand(communication: Command): void {
  const messages = new Command("messages").description("Manage messages");
  messages.requiredOption("--connection-id <id>", "Connection ID");

  messages
    .command("list")
    .description("List messages in a channel")
    .requiredOption("--channel-id <id>", "Channel ID")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ channelId: string; limit?: string }>();

        const result = await client.integrations.communication.listMessages(
          connectionId,
          localOpts.channelId,
          { limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined },
        );

        printOutput(result.data, opts, MESSAGE_COLUMNS);
      }),
    );

  messages
    .command("send")
    .description("Send a message to a channel")
    .requiredOption("--channel-id <id>", "Channel ID")
    .requiredOption("--content <text>", "Message content")
    .option("--thread-id <id>", "Thread ID for threaded reply")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ channelId: string; content: string; threadId?: string }>();

        const message = await client.integrations.communication.sendMessage(connectionId, {
          channelId: localOpts.channelId,
          content: localOpts.content,
          threadId: localOpts.threadId,
        });

        printSuccess("Message sent.");
        printOutput(message, opts);
      }),
    );

  communication.addCommand(messages);
}

function registerUsersCommand(communication: Command): void {
  const users = new Command("users").description("List communication users");
  users.requiredOption("--connection-id <id>", "Connection ID");

  users
    .command("list")
    .description("List users")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.communication.listUsers(connectionId, {
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.data, opts, USER_COLUMNS);
      }),
    );

  communication.addCommand(users);
}

export function registerCommunicationCommand(parent: Command): void {
  const communication = new Command("communication").description("Communication integration commands");

  registerChannelsCommand(communication);
  registerMessagesCommand(communication);
  registerUsersCommand(communication);

  parent.addCommand(communication);
}
