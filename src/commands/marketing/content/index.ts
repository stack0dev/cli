import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess, formatDate, truncate, type Column } from "../../../output.js";

const CONTENT_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title", format: (v) => truncate(String(v ?? ""), 40) },
  { key: "contentType", header: "Type" },
  { key: "status", header: "Status" },
  { key: "approvalStatus", header: "Approval" },
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

export function registerContentCommand(marketing: Command): void {
  const content = marketing.command("content").description("Create and manage marketing content");

  content
    .command("create")
    .description("Create new marketing content")
    .requiredOption("--title <title>", "Content title")
    .requiredOption("--type <type>", "Content type (tiktok_slideshow, instagram_reel, youtube_short, blog_post, twitter_thread)")
    .option("--opportunity-id <id>", "Opportunity ID to link")
    .option("--script-id <id>", "Script ID to link")
    .option("--description <text>", "Content description")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.createContent({
          projectSlug,
          environment,
          contentType: localOpts.type,
          title: localOpts.title,
          description: localOpts.description,
          opportunityId: localOpts.opportunityId,
          scriptId: localOpts.scriptId,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Content created (ID: ${result.id})`);
          printOutput(result, opts);
        }
      }),
    );

  content
    .command("list")
    .description("List content")
    .option("--limit <n>", "Maximum number of results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .option("--status <status>", "Filter by status")
    .option("--type <type>", "Filter by content type")
    .option("--approval <status>", "Filter by approval status (pending, approved, rejected)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const items = await client.marketing.listContent({
          projectSlug,
          environment,
          status: localOpts.status,
          contentType: localOpts.type,
          approvalStatus: localOpts.approval,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        printOutput(items, opts, CONTENT_COLUMNS);
      }),
    );

  content
    .command("get <id>")
    .description("Get content by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const item = await client.marketing.getContent(id);
        printOutput(item, opts);
      }),
    );

  content
    .command("update <id>")
    .description("Update content")
    .option("--title <title>", "New title")
    .option("--description <text>", "New description")
    .option("--status <status>", "New status")
    .option("--published-url <url>", "Published URL")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.updateContent({
          contentId: id,
          title: localOpts.title,
          description: localOpts.description,
          status: localOpts.status,
          publishedUrl: localOpts.publishedUrl,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Content ${id} updated`);
          printOutput(result, opts);
        }
      }),
    );

  content
    .command("approve <id>")
    .description("Approve content for publishing")
    .option("--notes <text>", "Review notes")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.approveContent({
          contentId: id,
          reviewNotes: localOpts.notes,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Content ${id} approved`);
        }
      }),
    );

  content
    .command("reject <id>")
    .description("Reject content")
    .requiredOption("--reason <text>", "Rejection reason")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.rejectContent({
          contentId: id,
          reviewNotes: localOpts.reason,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Content ${id} rejected`);
        }
      }),
    );

  content
    .command("delete <id>")
    .description("Delete content")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.marketing.deleteContent(id);
        printSuccess(`Content ${id} deleted`);
      }),
    );
}
