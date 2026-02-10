import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";
import { withSpinner } from "../../../spinner.js";

const JOB_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "assetId", header: "Asset" },
  { key: "status", header: "Status" },
  { key: "outputFormat", header: "Format" },
  { key: "progress", header: "Progress", format: (v) => (v != null ? `${v}%` : "-") },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const MERGE_JOB_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "status", header: "Status" },
  { key: "outputFormat", header: "Format" },
  { key: "outputQuality", header: "Quality" },
  { key: "progress", header: "Progress", format: (v) => (v != null ? `${v}%` : "-") },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

export function registerVideoCommand(cdn: Command): void {
  const video = cdn.command("video").description("Video transcoding and processing");

  video
    .command("transcode <asset-id>")
    .description("Start a video transcoding job")
    .requiredOption("--format <fmt>", "Output format (hls or mp4)")
    .requiredOption("--variants <variants>", "JSON array of variants, e.g. '[{\"quality\":\"720p\"}]'")
    .option("--webhook-url <url>", "Webhook URL for completion notification")
    .action(
      withErrorHandler(async (assetId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const variants = JSON.parse(localOpts.variants);

        const job = await withSpinner("Starting transcoding job...", async () => {
          return client.cdn.transcode({
            projectSlug,
            assetId,
            outputFormat: localOpts.format,
            variants,
            webhookUrl: localOpts.webhookUrl,
          });
        });

        printSuccess(`Transcoding job started: ${job.id}`);
        printOutput(job, opts);
      }),
    );

  video
    .command("jobs")
    .description("List transcoding jobs")
    .option("--asset-id <id>", "Filter by asset ID")
    .option("--status <status>", "Filter by status")
    .option("--limit <n>", "Maximum results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const { jobs, total } = await client.cdn.listJobs({
          projectSlug,
          assetId: localOpts.assetId,
          status: localOpts.status,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ jobs, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(jobs, opts, JOB_COLUMNS);
        }
      }),
    );

  video
    .command("job <id>")
    .description("Get a transcoding job by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const job = await client.cdn.getJob(id);
        printOutput(job, opts);
      }),
    );

  video
    .command("cancel-job <id>")
    .description("Cancel a transcoding job")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.cdn.cancelJob(id);
        printSuccess(`Cancelled job ${id}`);
      }),
    );

  video
    .command("stream <asset-id>")
    .description("Get streaming URLs for a video")
    .action(
      withErrorHandler(async (assetId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const urls = await client.cdn.getStreamingUrls(assetId);
        printOutput(urls, opts);
      }),
    );

  video
    .command("thumbnail <asset-id>")
    .description("Generate a thumbnail from a video")
    .requiredOption("--timestamp <seconds>", "Timestamp in seconds")
    .option("--width <n>", "Output width")
    .option("--format <fmt>", "Output format (jpg, png, webp)")
    .action(
      withErrorHandler(async (assetId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const thumbnail = await client.cdn.getThumbnail({
          assetId,
          timestamp: parseFloat(localOpts.timestamp),
          width: localOpts.width ? parseInt(localOpts.width, 10) : undefined,
          format: localOpts.format,
        });

        printOutput(thumbnail, opts);
      }),
    );

  video
    .command("merge")
    .description("Merge multiple videos/images into one")
    .requiredOption("--assets <json>", "JSON array of merge inputs")
    .option("--format <fmt>", "Output format (mp4 or webm)", "mp4")
    .option("--quality <q>", "Output quality (360p-2160p)", "720p")
    .option("--filename <name>", "Output filename")
    .option("--audio-asset <id>", "Background audio asset ID")
    .option("--webhook-url <url>", "Webhook URL for completion notification")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const inputs = JSON.parse(localOpts.assets);

        const job = await withSpinner("Creating merge job...", async () => {
          return client.cdn.createMergeJob({
            projectSlug,
            inputs,
            ...(localOpts.audioAsset && {
              audioTrack: { assetId: localOpts.audioAsset },
            }),
            output: {
              format: localOpts.format,
              quality: localOpts.quality,
              filename: localOpts.filename,
            },
            webhookUrl: localOpts.webhookUrl,
          });
        });

        printSuccess(`Merge job started: ${job.id}`);
        printOutput(job, opts);
      }),
    );

  video
    .command("merge-jobs")
    .description("List merge jobs")
    .option("--status <status>", "Filter by status")
    .option("--limit <n>", "Maximum results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const { jobs, total } = await client.cdn.listMergeJobs({
          projectSlug,
          status: localOpts.status,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ jobs, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(jobs, opts, MERGE_JOB_COLUMNS);
        }
      }),
    );

  video
    .command("merge-job <id>")
    .description("Get a merge job by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const job = await client.cdn.getMergeJob(id);
        printOutput(job, opts);
      }),
    );

  video
    .command("cancel-merge <id>")
    .description("Cancel a merge job")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.cdn.cancelMergeJob(id);
        printSuccess(`Cancelled merge job ${id}`);
      }),
    );

  video
    .command("gif <asset-id>")
    .description("Generate an animated GIF from a video")
    .option("--start-time <seconds>", "Start time in seconds", "0")
    .option("--duration <seconds>", "Duration in seconds", "5")
    .option("--width <n>", "Output width", "480")
    .option("--fps <n>", "Frames per second", "10")
    .action(
      withErrorHandler(async (assetId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const gif = await withSpinner("Generating GIF...", async () => {
          return client.cdn.generateGif({
            projectSlug,
            assetId,
            startTime: parseFloat(localOpts.startTime),
            duration: parseFloat(localOpts.duration),
            width: parseInt(localOpts.width, 10),
            fps: parseInt(localOpts.fps, 10),
          });
        });

        printSuccess(`GIF generation started: ${gif.id}`);
        printOutput(gif, opts);
      }),
    );

  video
    .command("gifs <asset-id>")
    .description("List GIFs for a video asset")
    .action(
      withErrorHandler(async (assetId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const gifs = await client.cdn.listGifs({ assetId });
        printOutput(gifs, opts);
      }),
    );
}
