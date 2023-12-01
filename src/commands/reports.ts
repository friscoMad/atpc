import * as commander from 'commander';
import Table from 'cli-table';

import { inspect } from 'util';

import { actionRunner } from '../utils.js';
import { getAccessToken } from '../config.js';
import { getBenefits, getTransactions } from '../forma.js';
import VERSION from '../version.js';

const command = new commander.Command();

interface Arguments {
  accessToken?: string;
}

command
  .name('reports')
  .version(VERSION)
  .description('List all the movements for the last 6 months')
  .option('--access-token <access_token>', 'Access token used to authenticate with Forma')
  .action(
    actionRunner(async (opts: Arguments) => {
      const accessToken = opts.accessToken ?? getAccessToken();

      if (!accessToken) {
        throw new Error(
          "You aren't logged in to Forma. Please run `formanator login` first.",
        );
      }

      const benefits = await getBenefits(accessToken);
      const to = new Date()
      const from = new Date()
      from.setTime(to.getTime() - 6*30*24*60*60*1000)

      for (const benefit of benefits) {
        const transactions = await getTransactions(accessToken, benefit.id, from, to)
        const table = new Table({
            head: ['Date', 'Title', 'Amount', 'Type', 'SubType'],
          });
        for (const transaction of transactions) {
          table.push([
            transaction.transaction_date.toString(),
            transaction.title,
            transaction.amount.toString(),
            transaction.transaction_type,
            transaction.transaction_subtype
          ]);
        }
        console.log(table.toString());
      }
    }),
  );

export default command;