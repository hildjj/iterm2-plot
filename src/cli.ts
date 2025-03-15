import {Command, Option} from 'commander';
import {DEFAULT_PLOT_OPTIONS, plot} from './index.js';

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
      DEFAULT_PLOT_OPTIONS.files
    )
    .option(
      '-b, --background <colorName>',
      'Background color name or #6hexdig',
      'gray90'
    )
    .option(
      '-d, --dimensions <WxH>',
      'Width x Height in pixels.  0 reads from the terminal.',
      DEFAULT_PLOT_OPTIONS.dimensions
    )
    .addOption(
      new Option('-l, --log <axes>', 'Set X, Y, and/or count to log scale')
        .choices(['x', 'y', 'xy'])
    )
    .option(
      '-o, --output <filename>',
      'Output svg to file instead of chart on stdout'
    )
    .option('-s, --shrink <CxR>', 'Shrink output by columns or rows', '1x3')
    .option(
      '-x',
      'Treat first column as X for all following Y columns (default: use row count)'
    )
    .addOption(
      new Option('--scriptOut <filename>', 'Output gnuplot to file')
        .hideHelp(true)
    )
    .action(async(files, opts) => {
      ret = await plot({...opts, files});
    });

  await program.parseAsync(argv);
  return ret;
}
