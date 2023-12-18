import * as commander from 'commander';
import Table from 'cli-table';

import { writeFileSync } from 'fs';

import { actionRunner } from '../../utils.js';
import { getAccessToken } from '../../config.js';
import { getBenefits, getTransactions } from '../../forma.js';
import VERSION from '../../version.js';
import { WALLETS_PATH } from '../../paths.js';

const command = new commander.Command();

interface Arguments {
  accessToken?: string;
  months: string;
}

command
  .name('download')
  .version(VERSION)
  .description('Download all the data from the last X months')
  .option('--access-token <access_token>', 'Access token used to authenticate with Forma')
  .option('--months <months>', 'Number of months to download', '36')
  .action(
    actionRunner(async (opts: Arguments) => {
      const accessToken = opts.accessToken ?? getAccessToken();

      if (!accessToken) {
        throw new Error(
          "You aren't logged in to Forma. Please run `formanator login` first.",
        );
      }

      const benefits = await getBenefits(accessToken);
      const to = new Date();
      const from = new Date();
      from.setTime(to.getTime() - parseInt(opts.months) * 31 * 24 * 60 * 60 * 1000);
      const allTransactions = new Map();

      for (const benefit of benefits) {
        const transactions = await getTransactions(accessToken, benefit.id, from, to);
        allTransactions.set(benefit.name, transactions);

        console.log(benefit.name);
        const table = new Table({
          head: ['Date', 'Title', 'Amount', 'Type', 'SubType'],
        });
        for (const transaction of transactions) {
          table.push([
            transaction.transaction_date.toString(),
            transaction.title,
            transaction.amount.toString(),
            transaction.transaction_type,
            transaction.transaction_subtype,
          ]);
        }
        console.log(table.toString());
        writeFileSync(
          WALLETS_PATH,
          JSON.stringify(Object.fromEntries(allTransactions), null, 2),
        );
      }
    }),
  );

export default command;
