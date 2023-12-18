#!/usr/bin/env node

import * as commander from 'commander';

import forma from './commands/forma/index.js';
import check from './commands/check/index.js';
import payroll from './commands/payroll.js';
import VERSION from './version.js';

const program = new commander.Command();

program.version(VERSION).addCommand(forma).addCommand(check).addCommand(payroll);

program.parse();
