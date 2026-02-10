import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";

export function registerTransformCommand(cdn: Command): void {
  cdn
    .command("transform <url-or-id>")
    .description("Generate a transformed image URL")
    .option("--width <n>", "Output width")
    .option("--height <n>", "Output height")
    .option("--format <fmt>", "Output format (webp, jpeg, png, avif, auto)")
    .option("--quality <n>", "Quality 1-100")
    .option("--fit <mode>", "Resize fit (cover, contain, fill, inside, outside)")
    .option("--crop <position>", "Smart crop position")
    .option("--blur <sigma>", "Blur sigma (0.3-100)")
    .option("--grayscale", "Convert to grayscale")
    .option("--rotate <angle>", "Rotation (0, 90, 180, 270)")
    .action(
      withErrorHandler(async (urlOrId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        let assetUrl = urlOrId;

        // If not a URL, assume it's an asset ID and fetch the CDN URL
        if (!urlOrId.startsWith("http://") && !urlOrId.startsWith("https://")) {
          const asset = await client.cdn.get(urlOrId);
          assetUrl = asset.cdnUrl;
        }

        const transformUrl = client.cdn.getTransformUrl(assetUrl, {
          ...(localOpts.width && { width: parseInt(localOpts.width, 10) }),
          ...(localOpts.height && { height: parseInt(localOpts.height, 10) }),
          ...(localOpts.format && { format: localOpts.format }),
          ...(localOpts.quality && { quality: parseInt(localOpts.quality, 10) }),
          ...(localOpts.fit && { fit: localOpts.fit }),
          ...(localOpts.crop && { crop: localOpts.crop }),
          ...(localOpts.blur && { blur: parseFloat(localOpts.blur) }),
          ...(localOpts.grayscale && { grayscale: true }),
          ...(localOpts.rotate && { rotate: parseInt(localOpts.rotate, 10) }),
        });

        if (opts.json) {
          console.log(JSON.stringify({ url: transformUrl }));
        } else {
          console.log(transformUrl);
        }
      }),
    );
}
