import chalk from "chalk";
import Table from "cli-table3";
import type { GlobalOptions } from "./types.js";

export interface Column {
  key: string;
  header: string;
  width?: number;
  format?: (value: unknown) => string;
}

export function formatTable(data: Record<string, unknown>[], columns: Column[]): string {
  const table = new Table({
    head: columns.map((c) => chalk.bold(c.header)),
    ...(columns.some((c) => c.width) && {
      colWidths: columns.map((c) => c.width ?? null),
    }),
    style: { head: ["cyan"] },
  });

  for (const row of data) {
    table.push(
      columns.map((col) => {
        const value = row[col.key];
        if (col.format) return col.format(value);
        if (value === null || value === undefined) return chalk.dim("-");
        return String(value);
      })
    );
  }

  return table.toString();
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function printOutput(data: unknown, opts: GlobalOptions, columns?: Column[]): void {
  if (opts.json) {
    console.log(formatJson(data));
    return;
  }

  if (columns && Array.isArray(data)) {
    console.log(formatTable(data as Record<string, unknown>[], columns));
    return;
  }

  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data as Record<string, unknown>);
    const table = new Table();
    for (const [key, value] of entries) {
      table.push({ [chalk.bold(key)]: value === null || value === undefined ? chalk.dim("-") : String(value) });
    }
    console.log(table.toString());
    return;
  }

  console.log(data);
}

export function printSuccess(message: string): void {
  console.log(chalk.green(`${message}`));
}

export function printError(message: string): void {
  console.error(chalk.red(`${message}`));
}

export function printWarning(message: string): void {
  console.warn(chalk.yellow(`${message}`));
}

export function printInfo(message: string): void {
  console.log(chalk.blue(`${message}`));
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return chalk.dim("-");
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString();
}
