import promptSync from 'prompt-sync';
import chalk from 'chalk';

export const prompt = promptSync({ sigint: true });

const actionErrorHandler = (error: Error): void => {
  console.error(chalk.red(error.message));
  process.exit(1);
};

export const actionRunner = (fn: (...args) => Promise<void>) => {
  return async (...args) => await fn(...args).catch(actionErrorHandler);
};

export const serializeError = (e: unknown): string => {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  return JSON.stringify(e);
};

// This function gets passed the HTTP status code, but we're always going to return true,
// so we don't need to declare the parameter
export const validateAxiosStatus = (): boolean => true;

export const dateFormat = new Intl.DateTimeFormat('en-us', {
  year: '2-digit',
  month: '2-digit',
});
