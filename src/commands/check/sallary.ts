import * as commander from 'commander';
import Table from 'cli-table';

import { Decimal } from 'decimal.js';

import { actionRunner } from '../../utils.js';
import VERSION from '../../version.js';
import { readPayroll } from '../../paths.js';
import { PayrollEntry } from '../../models.js';

const sallaryDesc = ['SALARIO'];
const antiguedadDesc = ['ANTIGUEDAD'];
const convenioDesc = ['P/CONVEN.', 'MEJ.ABSOR', 'A CTA.CON'];
const plusDesc = [
  'PLUS CONFIDENCIALID.',
  'PACTO NO COMPETENCIA',
  'CESION PROP.INDUSTR.',
  'CESION PRO.IND.',
];
const extraDesc = ['PRORRATA PAGAS EXTRAS'];
const sodexoDesc = ['TARJ.REST.EXENTA', 'TARJET.REST.EXENTA', '*TARJ.REST.EXENTA', 'CHILDCARE'];

const command = new commander.Command();

command
  .name('sallary')
  .version(VERSION)
  .description('Check the sallary calculated per month')
  .action(
    actionRunner(async () => {
      const payroll = readPayroll();
      const headers: string[] = [
        'Month',
        'Sallary',
        'Antigüedad',
        'Mejoras',
        'Pluses',
        'Sodexo',
        'Paga Extra',
        'Total Gross',
        'Anual Gross',
      ];
      const tableByMonth = new Table({
        head: headers,
      });
      payroll.forEach((entries, month) => {
        const sallary =
          entries.find((entry) => sallaryDesc.includes(entry.desc))?.income ?? 0;
        const antiguedad =
          entries.find((entry) => antiguedadDesc.includes(entry.desc))?.income ?? 0;
        const extra =
          entries.find((entry) => extraDesc.includes(entry.desc))?.income ?? 0;
        const convenio = sumByDesc(entries, convenioDesc);
        const plus = sumByDesc(entries, plusDesc);
        const sodexo = sumByDesc(entries, sodexoDesc);
        const total = plus
          .plus(convenio)
          .plus(antiguedad)
          .plus(sallary)
          .plus(extra)
          .plus(sodexo);
        tableByMonth.push([
          month,
          sallary.toString(),
          antiguedad.toString(),
          convenio.toString(),
          plus.toString(),
          sodexo.toString(),
          extra.toString(),
          total.toString(),
          total.mul(12).round().toString(),
        ]);
      });
      console.log(tableByMonth.toString());
    }),
  );

function sumByDesc(entries: PayrollEntry[], descriptions: string[]): Decimal {
  return entries
    .filter((entry) => descriptions.includes(entry.desc))
    .reduce((sum, entry) => sum.plus(entry.income), new Decimal(0));
}

export default command;
