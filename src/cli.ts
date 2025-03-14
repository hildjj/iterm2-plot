import {Command, Option} from 'commander';
import {plot} from './index.js';

/**
 * Process the command line arguments and run the plot routine.
 *
 * @param argv If undefined, use process.argv.
 * @returns String for writing to stdout.
 */
export async function cli(argv?: readonly string[]): Promise<string> {
  const program = new Command();
  let ret = '';
  program
    .argument(
      '[files...]',
      'File to read from, or "-" for stdin',
      ['-']
    )
    .option(
      '-x',
      'Treat first column as X for all following Y columns (default: use row count)'
    )
    .option(
      '-d, --dimensions [WxH]',
      'Width x Height in pixels.  0 reads from the terminal.',
      '0x0'
    )
    .addOption(
      new Option('-l, --log <axes>', 'Set X, Y, and/or count to log scale')
        .choices(['x', 'y', 'xy'])
    )
    .option(
      '-o, --output <filename>',
      'Output svg to file instead of chart on stdout'
    )
    .action(async(files, opts) => {
      ret = await plot({...opts, files});
    });

  await program.parseAsync(argv);
  return ret;
}
