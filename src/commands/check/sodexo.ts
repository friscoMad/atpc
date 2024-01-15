import * as commander from 'commander';
import Table from 'cli-table';

import { actionRunner } from '../../utils.js';
import VERSION from '../../version.js';
import { readPayroll } from '../../paths.js';

const command = new commander.Command();
const restaurantDesc = ['TARJ.REST.EXENTA', 'TARJET.REST.EXENTA', '*TARJ.REST.EXENTA'];
const childCareDesc = ['CHILDCARE'];

command
  .name('sodexo')
  .version(VERSION)
  .description('Check if the rsu information in the payroll matches the schwab data')
  .action(
    actionRunner(async () => {
      const payroll = readPayroll();
      const tableByMonth = new Table({
        head: ['Month', 'Restaurant', 'Child'],
      });
      payroll.forEach((entries, month) => {
        const rest =
          entries.find((entry) => restaurantDesc.includes(entry.desc))?.income ?? 0;
        const child =
        entries.find((entry) => childCareDesc.includes(entry.desc))?.income ?? 0;
        tableByMonth.push([month, rest.toLocaleString(), child.toLocaleString()]);
      });
      console.log(tableByMonth.toString());
    }),
  );
export default command;
