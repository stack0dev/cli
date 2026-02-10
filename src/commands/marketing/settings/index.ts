import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess } from "../../../output.js";

function resolveRequired(opts: ReturnType<typeof getGlobalOptions>) {
  const projectSlug = resolveProject(opts);
  if (!projectSlug) {
    throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
  }
  const environment = (resolveEnvironment(opts) || "production");
  return { projectSlug, environment };
}

export function registerSettingsCommand(marketing: Command): void {
  const settings = marketing.command("settings").description("Manage marketing settings");

  settings
    .command("get")
    .description("Get marketing settings")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);

        const result = await client.marketing.getSettings({
          projectSlug,
          environment,
        });

        printOutput(result, opts);
      }),
    );

  settings
    .command("update")
    .description("Update marketing settings")
    .option("--target-audience <text>", "Target audience description")
    .option("--brand-voice <text>", "Brand voice description")
    .option("--content-themes <json>", "Content themes as JSON array")
    .option("--avoid-topics <json>", "Topics to avoid as JSON array")
    .option("--preferred-platforms <json>", "Preferred platforms as JSON array")
    .option("--monitored-keywords <json>", "Monitored keywords as JSON array")
    .option("--monitored-subreddits <json>", "Monitored subreddits as JSON array")
    .option("--custom-instructions <text>", "Custom instructions")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const result = await client.marketing.updateSettings({
          projectSlug,
          environment,
          targetAudience: localOpts.targetAudience,
          brandVoice: localOpts.brandVoice,
          contentThemes: localOpts.contentThemes ? JSON.parse(localOpts.contentThemes) : undefined,
          avoidTopics: localOpts.avoidTopics ? JSON.parse(localOpts.avoidTopics) : undefined,
          preferredPlatforms: localOpts.preferredPlatforms ? JSON.parse(localOpts.preferredPlatforms) : undefined,
          monitoredKeywords: localOpts.monitoredKeywords ? JSON.parse(localOpts.monitoredKeywords) : undefined,
          monitoredSubreddits: localOpts.monitoredSubreddits ? JSON.parse(localOpts.monitoredSubreddits) : undefined,
          customInstructions: localOpts.customInstructions,
        });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(result.created ? "Marketing settings created" : "Marketing settings updated");
        }
      }),
    );
}
