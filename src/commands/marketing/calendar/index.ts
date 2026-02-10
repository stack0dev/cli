import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const CALENDAR_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "contentId", header: "Content ID" },
  { key: "scheduledFor", header: "Scheduled", format: (v) => formatDate(v as string) },
  { key: "timezone", header: "Timezone" },
  { key: "autoPublish", header: "Auto", format: (v) => (v ? "Yes" : "No") },
  { key: "publishedAt", header: "Published", format: (v) => formatDate(v as string) },
];

function resolveRequired(opts: ReturnType<typeof getGlobalOptions>) {
  const projectSlug = resolveProject(opts);
  if (!projectSlug) {
    throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
  }
  const environment = (resolveEnvironment(opts) || "production");
  return { projectSlug, environment };
}

export function registerCalendarCommand(marketing: Command): void {
  const calendar = marketing.command("calendar").description("Schedule and manage content publishing");

  calendar
    .command("schedule")
    .description("Schedule content for publishing")
    .requiredOption("--content-id <id>", "Content ID to schedule")
    .requiredOption("--date <date>", "Scheduled date/time (ISO 8601)")
    .option("--timezone <tz>", "Timezone (e.g. America/New_York)")
    .option("--auto-publish", "Automatically publish at scheduled time")
    .option("--notify", "Notify when ready")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.scheduleContent({
          projectSlug,
          environment,
          contentId: localOpts.contentId,
          scheduledFor: new Date(localOpts.date),
          timezone: localOpts.timezone,
          autoPublish: localOpts.autoPublish,
          notifyUser: localOpts.notify,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Content scheduled (Entry ID: ${result.id})`);
          printOutput(result, opts);
        }
      }),
    );

  calendar
    .command("list")
    .description("List scheduled content")
    .option("--from <date>", "Start date (ISO 8601)")
    .option("--to <date>", "End date (ISO 8601)")
    .option("--limit <n>", "Maximum number of results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const entries = await client.marketing.listCalendarEntries({
          projectSlug,
          environment,
          startDate: localOpts.from ? new Date(localOpts.from) : undefined,
          endDate: localOpts.to ? new Date(localOpts.to) : undefined,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        printOutput(entries, opts, CALENDAR_COLUMNS);
      }),
    );

  calendar
    .command("get <id>")
    .description("Get a calendar entry by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const entry = await client.marketing.getCalendarEntry(id);
        printOutput(entry, opts);
      }),
    );

  calendar
    .command("update <id>")
    .description("Update a calendar entry")
    .option("--date <date>", "New scheduled date/time (ISO 8601)")
    .option("--timezone <tz>", "New timezone")
    .option("--auto-publish", "Enable auto-publish")
    .option("--no-auto-publish", "Disable auto-publish")
    .option("--notify", "Enable notifications")
    .option("--no-notify", "Disable notifications")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.updateCalendarEntry({
          entryId: id,
          scheduledFor: localOpts.date ? new Date(localOpts.date) : undefined,
          timezone: localOpts.timezone,
          autoPublish: localOpts.autoPublish,
          notifyUser: localOpts.notify,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Calendar entry ${id} updated`);
          printOutput(result, opts);
        }
      }),
    );

  calendar
    .command("cancel <id>")
    .description("Cancel a scheduled calendar entry")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.marketing.cancelCalendarEntry(id);
        printSuccess(`Calendar entry ${id} cancelled`);
      }),
    );

  calendar
    .command("mark-published <id>")
    .description("Mark a calendar entry as published")
    .option("--url <url>", "Published URL")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);

        const result = await client.marketing.markContentPublished({
          entryId: id,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Calendar entry ${id} marked as published`);
        }
      }),
    );
}
