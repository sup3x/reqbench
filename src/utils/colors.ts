import chalk from 'chalk';

export const c = chalk;

export function success(text: string): string { return chalk.green(text); }
export function error(text: string): string { return chalk.red(text); }
export function warn(text: string): string { return chalk.yellow(text); }
export function dim(text: string): string { return chalk.dim(text); }
export function bold(text: string): string { return chalk.bold(text); }
export function cyan(text: string): string { return chalk.cyan(text); }
