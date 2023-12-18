import { readFileSync, existsSync } from 'fs';

import type { Transaction } from './forma.js';
import type { PayrollEntry } from './models.js';
import path from 'path';

const WALLETS_FILENAME = 'wallets.json';
const PAYROLL_FILENAME = 'payroll.json';
export const DATA_PATH = 'data';
export const WALLETS_PATH = path.join(DATA_PATH, WALLETS_FILENAME);
export const PAYROLL_PATH = path.join(DATA_PATH, PAYROLL_FILENAME);
export const PAYROLL_INPUT_PATH = path.join(DATA_PATH, 'payroll/');

export function readWallets(): Map<string, Transaction[]> {
  if (!existsSync(WALLETS_PATH)) {
    throw new Error(
      'Your forma data was not downloaded, please run the commands "forma login" and "forma download" first.',
    );
  }
  const walletsObject = JSON.parse(readFileSync(WALLETS_PATH, { encoding: 'utf-8' }));
  const wallets: Map<string, Transaction[]> = new Map(Object.entries(walletsObject));
  return wallets;
}
export function readPayroll(): Map<string, PayrollEntry[]> {
  if (!existsSync(PAYROLL_PATH)) {
    throw new Error(
      'Your payroll was not parsed yet please download the files and run the "payroll" command',
    );
  }
  const payrollObject = JSON.parse(readFileSync(PAYROLL_PATH, { encoding: 'utf-8' }));
  const payroll: Map<string, PayrollEntry[]> = new Map(Object.entries(payrollObject));
  return payroll;
}
