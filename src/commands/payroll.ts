import * as commander from 'commander';
import Table from 'cli-table';
import { writeFileSync, readdirSync } from 'fs';
import { PdfReader } from 'pdfreader';

import { actionRunner } from '../utils.js';
import { PayrollEntry } from '../models.js';
import VERSION from '../version.js';
import { PAYROLL_PATH, PAYROLL_INPUT_PATH } from '../paths.js';

const command = new commander.Command();

interface Arguments {
  password: string;
}

command
  .name('payroll')
  .version(VERSION)
  .description('Parse all payroll pdfs in /data/payroll folder')
  .requiredOption('--password <password>', 'Password required to open PDFs, your DNI')
  .action(
    actionRunner(async (opts: Arguments) => {
      const files = readdirSync(PAYROLL_INPUT_PATH);
      if (files.length == 1) {
        throw new Error('Your payrolls should be downloaded in the /data/payroll folder');
      }
      const allPayroll = new Map();
      for (const file of files) {
        if (file == '.gitkeep') continue;
        const parts = file.match(/^(\d{4})_(\d{2})_(\d{2})_/);
        if (!parts) {
          throw new Error(
            `File name is not correct ${file} it should be YYYY_MM_DD_XXXX`,
          );
        }
        let year = parseInt(parts[1]);
        let month = parseInt(parts[2]);
        const day = parseInt(parts[3]);
        // Some months the payroll is created the last day of the months, usually the file is created after that
        if (day != 31) {
          month--;
          if (month == 0) {
            month = 12;
            year--;
          }
        }
        console.log(`Nomina de ${month} del ${year}`);

        const payroll = await readPayroll(PAYROLL_INPUT_PATH + file, opts.password);
        allPayroll.set(
          `${month.toString().padStart(2, '0')}/${year.toString().substring(2, 4)}`,
          payroll,
        );
        printPayroll(payroll);
      }
      writeFileSync(
        PAYROLL_PATH,
        JSON.stringify(Object.fromEntries(allPayroll), null, 2),
      );
    }),
  );

function printPayroll(info: PayrollEntry[]) {
  // console.log(info)
  const table = new Table({
    head: ['Desc', 'Income', 'Retention'],
  });
  info.forEach((ele) => {
    table.push([ele.desc, ele.income.toString(), ele.retention.toString()]);
  });
  console.log(table.toString());
}

async function readPayroll(path: string, password: string): Promise<PayrollEntry[]> {
  const rows = await readFile(path, password);
  // console.log(rows)
  const info = rows
    .slice(3) // The first 3 lines are just text
    .reduce((array, data) => {
      // Split columns by size, skips rows where the second column "concepto" does not start with a letter (totals and end of the file)
      const parts = data.match(/^\s{7}(?:\d{2}| {2})\s([\w*].{20}).{18}(.{11})(.{11})?/);
      if (parts) {
        array.push(new PayrollEntry(parts[1], parts[2], parts[3]));
      }
      return array;
    }, [] as PayrollEntry[]);
  // console.log(info)
  return info;
}

function readFile(path: string, password: string): Promise<string[]> {
  return new Promise((resolve) => {
    const rows: string[] = [];
    new PdfReader({ password: password }).parseFileItems(path, (err, item) => {
      if (!item) resolve(rows);
      else if (item && item.text) {
        if (item.text.startsWith('       ')) {
          rows.push(item.text);
        }
      }
    });
  });
}

export default command;
