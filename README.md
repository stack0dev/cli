# Stack0 CLI

Manage your [Stack0](https://stack0.dev) resources from the terminal — send email, upload to the CDN, capture screenshots, extract structured data, run AI workflows, and more.

```bash
stack0 mail send --from you@yourdomain.com --to user@example.com \
  --subject "Hello" --text "Sent from the Stack0 CLI"
```

## Installation

Requires **Node.js 18+**.

```bash
npm install -g @stack0/cli
# or
bun add -g @stack0/cli
```

Or run without installing:

```bash
npx @stack0/cli --help
# or
bunx @stack0/cli --help
```

The CLI is installed as the `stack0` binary.

## Authentication

Sign in with the interactive device flow (opens your browser):

```bash
stack0 auth login
```

Prefer an API key directly? Pass it inline, set it as an environment variable, or save it:

```bash
stack0 auth login --api-key sk_live_...     # save the key
stack0 config set apiKey sk_live_...         # same thing, persisted to config
export STACK0_API_KEY=sk_live_...            # per-shell
```

Inspect or clear your session:

```bash
stack0 auth whoami     # show the active identity (key is masked)
stack0 auth status     # auth + config summary, including config file path
stack0 auth logout     # clear all stored credentials
```

Credentials are stored locally via [`conf`](https://github.com/sindresorhus/conf). Run `stack0 auth status` to see the exact config file path.

## Configuration

The CLI resolves each value from, in order: **command-line flag → environment variable → saved config**.

| Config key           | Flag                  | Environment variable | Description                          |
| -------------------- | --------------------- | -------------------- | ------------------------------------ |
| `apiKey`             | `--api-key <key>`     | `STACK0_API_KEY`     | API key used for authentication      |
| `defaultProject`     | `-p, --project <id>`  | `STACK0_PROJECT`     | Default project                      |
| `defaultEnvironment` | `-e, --env <env>`     | `STACK0_ENV`         | `sandbox` or `production`            |
| `baseUrl`            | `--base-url <url>`    | `STACK0_BASE_URL`    | Custom API base URL                  |

Manage saved defaults:

```bash
stack0 config set defaultProject my-project
stack0 config set defaultEnvironment production
stack0 config get                  # show all values
stack0 config get defaultProject   # show one value
stack0 config reset                # clear everything (asks to confirm)
```

## Global options

These flags work on every command:

| Option              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `--api-key <key>`   | API key for authentication                        |
| `-p, --project <id>`| Project ID                                        |
| `-e, --env <env>`   | Environment (`sandbox` or `production`)           |
| `--json`            | Output raw JSON instead of formatted tables       |
| `--verbose`         | Verbose output                                    |
| `--no-color`        | Disable colored output                            |
| `--base-url <url>`  | Override the API base URL                         |

Pass `--json` to any command for machine-readable output, ideal for scripting:

```bash
stack0 mail list --json | jq '.[].id'
```

## Commands

Run `stack0 <command> --help` (or `stack0 <command> <subcommand> --help`) for full, up-to-date options on any command.

### `auth` — Authentication
`login` · `logout` · `whoami` · `status`

### `config` — CLI configuration
`set` · `get` · `reset`

### `mail` — Email sending, templates, and campaigns
`send` · `list` · `get` · `resend` · `cancel` · `analytics` · `domains` · `templates` · `contacts` · `audiences` · `campaigns` · `sequences` · `events`

```bash
# Send a plain-text email
stack0 mail send --from you@yourdomain.com --to user@example.com \
  --subject "Welcome" --text "Thanks for signing up!"

# Send HTML from a file (prefix the path with @)
stack0 mail send --from you@yourdomain.com --to user@example.com \
  --subject "Welcome" --html @./welcome.html

# Send a template with variables
stack0 mail send --from you@yourdomain.com --to user@example.com \
  --subject "Your receipt" --template-id tmpl_123 \
  --vars '{"name":"Alex","amount":"$42.00"}'
```

### `cdn` — Assets, folders, video, and private files
`upload` · `list` · `get` · `update` · `delete` · `delete-many` · `move` · `transform` · `usage` · `folders` · `video` · `private` · `bundles` · `imports`

```bash
stack0 cdn upload ./logo.png --folder brand --project my-project
stack0 cdn list --project my-project
stack0 cdn transform asset_123 --width 400 --format webp
```

### `screenshots` — Capture and manage webpage screenshots
`capture` · `list` · `get` · `delete` · `batch` · `schedules`

```bash
# Capture and wait for the result
stack0 screenshots capture https://example.com --full-page --format webp

# Fire-and-forget: return a job ID immediately
stack0 screenshots capture https://example.com --no-wait
```

### `extraction` — Extract structured data from webpages with AI
`extract` · `list` · `get` · `delete` · `batch` · `usage` · `schedules`

```bash
# Markdown extraction
stack0 extraction extract https://example.com/article --mode markdown

# Schema-driven structured extraction (inline JSON or @file.json)
stack0 extraction extract https://example.com/product \
  --mode schema --schema @./product-schema.json
```

### `workflows` — AI workflows and execution
`create` · `list` · `get` · `update` · `delete` · `run` · `runs`

```bash
stack0 workflows list
stack0 workflows run wf_123
stack0 workflows runs list --project my-project
```

### `integrations` — Third-party integrations
`connectors` · `connections` · `stats` · `logs` · `crm` · `storage` · `communication` · `productivity`

### `marketing` — Trends, content, and campaigns
`trends` · `opportunities` · `content` · `scripts` · `analytics` · `calendar` · `settings` · `usage`

## Programmatic use

The CLI is a thin wrapper over the [`@stack0/sdk`](https://www.npmjs.com/package/@stack0/sdk). If you need Stack0 inside your own code, use the SDK directly:

```ts
import Stack0 from "@stack0/sdk";

const stack0 = new Stack0({ apiKey: process.env.STACK0_API_KEY });
await stack0.mail.send({ from, to, subject, text });
```

## License

[MIT](./LICENSE)
