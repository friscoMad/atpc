import * as commander from 'commander';
import Table from 'cli-table';

import { Decimal } from 'decimal.js';

import { actionRunner, dateFormat } from '../../utils.js';
import type { Transaction } from '../../forma.js';
import VERSION from '../../version.js';
import { readPayroll, readWallets } from '../../paths.js';
import chalk from 'chalk';

const command = new commander.Command();

command
  .name('wallets')
  .version(VERSION)
  .description(
    'Check if the wallets received in the payroll matches the actual data from Forma',
  )
  .action(
    actionRunner(async () => {
      const wallets = readWallets();
      const keys = Array.from(wallets.keys());
      const walletsPerTypeAndMonth = Array.from(wallets.entries()).reduce(
        (map, entry) => {
          console.log(entry[0]);
          map.set(entry[0], getTotalByMonth(entry[1]));
          return map;
        },
        new Map<string, Map<string, Decimal>>(),
      );
      //console.log(walletsPerTypeAndMonth)
      const payroll = readPayroll();
      const headers: string[] = ['Month', ...keys, 'Total', 'Payroll', 'Diff'];
      const tableByMonth = new Table({
        head: headers,
      });
      payroll.forEach((entries, month) => {
        const payrollWallets = entries.find((entry) => entry.desc == 'WALLETS');
        const walletDetail = keys.map((wallet) => {
          return walletsPerTypeAndMonth.get(wallet)?.get(month) ?? new Decimal(0);
        });
        const total = walletDetail.reduce(
          (sum, wallet) => sum.plus(wallet),
          new Decimal(0),
        );
        const payrollValue = payrollWallets?.income ?? 0;
        const diff = total.neg().plus(payrollValue);
        let diffColor = diff.toString();
        if (diff.greaterThan(new Decimal(0))) {
          diffColor = chalk.green(diffColor);
        } else if (diff.lessThan(new Decimal(0))) {
          diffColor = chalk.red(diffColor);
        }
        tableByMonth.push([
          month,
          ...walletDetail.map((wallet) => wallet.toString()),
          total.toString(),
          payrollValue.toString() ?? '',
          diffColor,
        ]);
      });
      console.log(tableByMonth.toString());
    }),
  );

function getTotalByMonth(transactions: Transaction[]): Map<string, Decimal> {
  return transactions
    .filter(
      (tx) =>
        tx.transaction_type == 'debit' &&
        tx.transaction_subtype != 'country_change_wallet_reset' &&
        tx.transaction_subtype != 'wallet_reset',
    )
    .reduce((map, transaction) => {
      const dateKey = dateFormat.format(getTransactionDate(transaction));
      // console.log(transaction.transaction_date, transaction.amount, getTransactionDate(transaction))
      if (map.has(dateKey)) {
        map.set(dateKey, map.get(dateKey).plus(new Decimal(transaction.amount)));
      } else {
        map.set(dateKey, new Decimal(transaction.amount));
      }
      return map;
    }, new Map());
}

function getTransactionDate(item: Transaction): Date {
  const date = new Date(item.transaction_date);
  if (date.getDate() > 14) {
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export default command;
