import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate, truncate } from "../../../output.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 24, format: (v) => truncate(String(v ?? ""), 22) },
  { key: "url", header: "URL", width: 36, format: (v) => truncate(String(v ?? ""), 34) },
  { key: "frequency", header: "Frequency", width: 12 },
  { key: "isActive", header: "Active", width: 10, format: (v) => (v ? "Yes" : "No") },
  { key: "nextRunAt", header: "Next Run", width: 22, format: (v) => formatDate(v as string) },
];

export function registerSchedulesCommand(parent: Command): void {
  const schedules = parent
    .command("schedules")
    .description("Manage screenshot schedules");

  schedules
    .command("create")
    .description("Create a screenshot schedule")
    .requiredOption("--name <name>", "Schedule name")
    .requiredOption("--url <url>", "URL to capture")
    .option("--frequency <freq>", "Frequency (hourly, daily, weekly, monthly)", "daily")
    .option("--format <format>", "Image format (png, jpeg, webp)")
    .option("--full-page", "Capture the full page")
    .option("--device <type>", "Device type (desktop, tablet, mobile)")
    .option("--detect-changes", "Enable change detection")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{
          name: string;
          url: string;
          frequency: string;
          format?: string;
          fullPage?: boolean;
          device?: string;
          detectChanges?: boolean;
        }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const result = await client.screenshots.createSchedule({
          name: opts.name,
          url: opts.url,
          frequency: opts.frequency as "hourly" | "daily" | "weekly" | "monthly",
          config: {
            ...(opts.format && { format: opts.format as "png" | "jpeg" | "webp" }),
            ...(opts.fullPage && { fullPage: true }),
            ...(opts.device && { deviceType: opts.device as "desktop" | "tablet" | "mobile" }),
          },
          ...(opts.detectChanges && { detectChanges: true }),
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printOutput(result, globalOpts);
      }),
    );

  schedules
    .command("list")
    .description("List screenshot schedules")
    .option("--limit <count>", "Max items to return", parseInt)
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--active", "Only show active schedules")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{ limit?: number; cursor?: string; active?: boolean }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const { items, nextCursor } = await client.screenshots.listSchedules({
          ...(opts.limit && { limit: opts.limit }),
          ...(opts.cursor && { cursor: opts.cursor }),
          ...(opts.active !== undefined && { isActive: opts.active }),
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        if (globalOpts.json) {
          printOutput({ items, nextCursor }, globalOpts);
          return;
        }

        printOutput(items, globalOpts, columns);

        if (nextCursor) {
          console.log(`\nNext cursor: ${nextCursor}`);
        }
      }),
    );

  schedules
    .command("get")
    .description("Get a screenshot schedule by ID")
    .argument("<id>", "Schedule ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const schedule = await client.screenshots.getSchedule({
          id: id as string,
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printOutput(schedule, globalOpts);
      }),
    );

  schedules
    .command("update")
    .description("Update a screenshot schedule")
    .argument("<id>", "Schedule ID")
    .option("--name <name>", "Schedule name")
    .option("--frequency <freq>", "Frequency (hourly, daily, weekly, monthly)")
    .option("--active <bool>", "Enable or disable")
    .option("--detect-changes <bool>", "Enable or disable change detection")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{
          name?: string;
          frequency?: string;
          active?: string;
          detectChanges?: string;
        }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        await client.screenshots.updateSchedule({
          id: id as string,
          ...(opts.name && { name: opts.name }),
          ...(opts.frequency && { frequency: opts.frequency as "hourly" | "daily" | "weekly" | "monthly" }),
          ...(opts.active !== undefined && { isActive: opts.active === "true" }),
          ...(opts.detectChanges !== undefined && { detectChanges: opts.detectChanges === "true" }),
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printSuccess(`Schedule ${id} updated.`);
      }),
    );

  schedules
    .command("delete")
    .description("Delete a screenshot schedule")
    .argument("<id>", "Schedule ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        await client.screenshots.deleteSchedule({
          id: id as string,
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printSuccess(`Schedule ${id} deleted.`);
      }),
    );

  schedules
    .command("toggle")
    .description("Toggle a screenshot schedule on or off")
    .argument("<id>", "Schedule ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const result = await client.screenshots.toggleSchedule({
          id: id as string,
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printSuccess(`Schedule ${id} is now ${result.isActive ? "active" : "inactive"}.`);
      }),
    );
}
