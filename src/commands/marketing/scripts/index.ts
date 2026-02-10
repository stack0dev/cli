import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess, formatDate, truncate, type Column } from "../../../output.js";

const SCRIPT_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "hook", header: "Hook", format: (v) => truncate(String(v ?? ""), 40) },
  { key: "version", header: "Version" },
  { key: "model", header: "Model", format: (v) => String(v ?? "-") },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function resolveRequired(opts: ReturnType<typeof getGlobalOptions>) {
  const projectSlug = resolveProject(opts);
  if (!projectSlug) {
    throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
  }
  const environment = (resolveEnvironment(opts) || "production");
  return { projectSlug, environment };
}

export function registerScriptsCommand(marketing: Command): void {
  const scripts = marketing.command("scripts").description("Create and manage content scripts");

  scripts
    .command("create")
    .description("Create a new script")
    .requiredOption("--hook <text>", "Script hook/opening line")
    .requiredOption("--cta <text>", "Call to action")
    .option("--content-id <id>", "Content ID to link")
    .option("--slides <json>", "Slides as JSON array")
    .option("--prompt <text>", "Prompt used to generate")
    .option("--model <model>", "AI model used")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const slides = localOpts.slides ? JSON.parse(localOpts.slides) : [];

        const result = await client.marketing.createScript({
          projectSlug,
          environment,
          contentId: localOpts.contentId,
          hook: localOpts.hook,
          slides,
          cta: localOpts.cta,
          prompt: localOpts.prompt,
          model: localOpts.model,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Script created (ID: ${result.id})`);
          printOutput(result, opts);
        }
      }),
    );

  scripts
    .command("list")
    .description("List scripts")
    .option("--limit <n>", "Maximum number of results", "20")
    .option("--content-id <id>", "Filter by content ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const items = await client.marketing.listScripts({
          projectSlug,
          environment,
          contentId: localOpts.contentId,
          limit: parseInt(localOpts.limit, 10),
        });

        printOutput(items, opts, SCRIPT_COLUMNS);
      }),
    );

  scripts
    .command("get <id>")
    .description("Get a script by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const script = await client.marketing.getScript(id);
        printOutput(script, opts);
      }),
    );

  scripts
    .command("update <id>")
    .description("Update a script")
    .option("--hook <text>", "New hook line")
    .option("--cta <text>", "New call to action")
    .option("--slides <json>", "Updated slides as JSON array")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.updateScript({
          scriptId: id,
          hook: localOpts.hook,
          cta: localOpts.cta,
          slides: localOpts.slides ? JSON.parse(localOpts.slides) : undefined,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Script ${id} updated`);
          printOutput(result, opts);
        }
      }),
    );

  scripts
    .command("delete <id>")
    .description("Delete a script")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.marketing.deleteScript(id);
        printSuccess(`Script ${id} deleted`);
      }),
    );

  scripts
    .command("versions <id>")
    .description("List all versions of a script")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const versions = await client.marketing.getScriptVersions(id);
        printOutput(versions, opts, SCRIPT_COLUMNS);
      }),
    );
}
