import * as commander from 'commander';
import Table from 'cli-table';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { Decimal } from 'decimal.js';
import axios from 'axios';

import type { PayrollEntry, SchwabTransaction } from '../../models.js';
import { actionRunner, dateFormat } from '../../utils.js';
import VERSION from '../../version.js';
import { readPayroll, DATA_PATH } from '../../paths.js';
import chalk from 'chalk';

const command = new commander.Command();
const soldDesc = ['RSUs reportadas', 'RSUS REPORTADAS'];
const keptDesc = ['Especies.Si.RSUs Dep', 'ESPECIES.SI.RSUS DEP'];
const retentionDesc = ['Prod.especie'];

interface Arguments {
  api: string | null;
}

command
  .name('rsu')
  .version(VERSION)
  .description('Check if the rsu information in the payroll matches the schwab data')
  .option(
    '--api <api>',
    'https://exchangerate.host Api key to retrive public exchange rates',
  )
  .action(
    actionRunner(async (opts: Arguments) => {
      const payroll = readPayroll();
      const schwab = readSchwab().filter((entry) => entry.symbol == 'AFRM');
      const schwabByMonth = groupByMonth(schwab);
      // console.log(schwabByMonth)
      const tableByMonth = new Table({
        head: [
          'Month',
          'Vested',
          'Sold Schwab',
          'Kept Schwab',
          'Sold(Payroll)',
          'Kept(Payroll)',
          'Especies(Payroll)',
          '$/€ Sold',
          '$/€ Kept',
          '$/€ Public',
        ],
      });

      for (const monthEntries of payroll) {
        const [month, entries] = monthEntries;
        const entry = schwabByMonth.get(month);
        if (entry == undefined) continue; // If there are no vested RSUs skip the row

        const soldPayroll =
          entries.find((entry) => soldDesc.includes(entry.desc))?.income ?? 0;
        const keptPayroll =
          entries.find((entry) => keptDesc.includes(entry.desc))?.income ?? 0;
        const forexSold = entry.price.mul(entry.sold).div(soldPayroll).toPrecision(5);
        const forexKept = entry.price
          .mul(entry.deposited)
          .div(keptPayroll)
          .toPrecision(5);
        let rate = 'N/A';
        if (opts.api) {
          const dayRate = await getRate(entry.date, opts.api);
          rate = new Decimal(1).div(dayRate).toPrecision(5);
        }
        let colorizeForex = colorize(forexSold, forexKept)
        tableByMonth.push([
          month,
          (entry.deposited + entry.sold).toString(),
          `${entry.sold} - $${entry.price.mul(entry.sold)}`,
          `${entry.deposited} - $${entry.price.mul(entry.deposited)}`,
          soldPayroll.toString() + "€",
          keptPayroll.toString() + "€",
          getRetentionWithColor(entries, keptPayroll),
          `${colorizeForex(forexSold)}`,
          `${colorizeForex(forexKept)}`,
          rate,
        ]);
      }
      console.log(tableByMonth.toString());
    }),
  );

class SchwabEntry {
  date: Date;
  symbol: string;
  deposited: number;
  sold: number;
  price: Decimal;

  constructor(
    date: string,
    symbol: string,
    deposited: string,
    sold: string,
    price: string,
  ) {
    // Parsing dates in JS is hard
    const dateParts = date.split('/');
    this.date = new Date(
      Date.UTC(
        parseInt(dateParts[2]),
        parseInt(dateParts[0]) - 1,
        parseInt(dateParts[1]),
      ),
    );
    this.symbol = symbol;
    this.deposited = Number(deposited);
    this.sold = Number(sold);
    this.price = new Decimal(price.substring(1));
  }
}

function getRetentionWithColor(entries: PayrollEntry[], soldPayroll: number): string {
  const retentionPayroll =
    entries.find((entry) => retentionDesc.includes(entry.desc))?.retention ?? 0;
  let retentionColor = retentionPayroll.toString()+ "€";
  if (retentionPayroll == soldPayroll) {
    retentionColor = chalk.green(retentionColor);
  } else {
    retentionColor = chalk.red(retentionColor);
  }
  return retentionColor;
}

function readSchwab(): SchwabEntry[] {
  const files = readdirSync(DATA_PATH).filter(
    (name) => name.startsWith('EquityAwards') && name.endsWith('.json'),
  );
  if (files.length > 1) {
    throw new Error(
      'Multiple schwab files found in the data folder please leave only one',
    );
  }
  if (files.length == 0) {
    throw new Error(
      'No schwab file found in the data folder please download the report and put it in the data folder',
    );
  }
  const schwab = JSON.parse(
    readFileSync(path.join(DATA_PATH, files[0]), { encoding: 'utf-8' }),
  );
  const transactions: SchwabTransaction[] = schwab.Transactions;
  return transactions.map((transaction) => {
    const details = transaction.TransactionDetails[0].Details;
    return new SchwabEntry(
      transaction.Date,
      transaction.Symbol,
      details.NetSharesDeposited,
      details.SharesSoldWithheldForTaxes,
      details.FairMarketValuePrice,
    );
  });
}

function groupByMonth(data: SchwabEntry[]): Map<string, SchwabEntry> {
  return data.reduce((result, entry) => {
    const key = dateFormat.format(entry.date);
    if (result.has(key)) {
      const cloneEntry: SchwabEntry = clone(result.get(key)!);
      cloneEntry.deposited = cloneEntry.deposited + entry.deposited;
      cloneEntry.sold = cloneEntry.sold + entry.sold;
      result.set(key, cloneEntry);
    } else {
      result.set(key, entry);
    }
    return result;
  }, new Map<string, SchwabEntry>());
}

interface EurRate {
  USDEUR: number;
}
interface RateResponse {
  quotes: EurRate;
}

async function getRate(date: Date, api: string): Promise<number> {
  const url = `http://api.exchangerate.host/historical?date=${
    date.toISOString().split('T')[0]
  }&access_key=${api}`;
  const response = await axios.get(url);
  const parsedResponse = response.data as RateResponse;
  return parsedResponse.quotes.USDEUR;
}

function colorize(val1: string, val2: string) : (string) => string {
  let color = (value: string) => chalk.green(value);
  if (val1 != val2) {
    color = (value: string) => chalk.red(value);
  }
  return color
}

function clone(original: SchwabEntry): SchwabEntry {
  return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
}
export default command;
