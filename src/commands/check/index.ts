import * as commander from 'commander';

import rsu from './rsu.js';
import wallets from './wallets.js';
import sodexo from './sodexo.js';

const command = new commander.Command();

command.name('check').addCommand(rsu).addCommand(wallets).addCommand(sodexo);

export default command;
