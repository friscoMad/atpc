import * as commander from 'commander';

import login from './login.js';
import benefits from './benefits.js';
import categories from './categories.js';
import download from './download.js';

const command = new commander.Command();

command
  .name('forma')
  .addCommand(login)
  .addCommand(benefits)
  .addCommand(categories)
  .addCommand(download);

export default command;
