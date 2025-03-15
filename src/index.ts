import {Buffer} from 'node:buffer';
import fs from 'node:fs/promises';
import {getTerminalSize} from 'iterm2-size';
import gnuplot from 'gnuplot-wasm';
import terminalImage from 'term-img';
import {text} from 'node:stream/consumers';

const {render} = await gnuplot();

export interface PlotOptions {
  /**
   * List of file names to read, relative to the working directory.
   * Use "-" for stdin.
   */
  files: string[];

  /**
   * Background color for graph.
   */
  background?: string;

  /**
   * A string of the form <number>x<number> for width and height.
   * Example: "1000x500".
   */
  dimensions?: string; // WxH

  /**
   * If true, treat first column as X, following columns as Ys.  If falsy,
   * X is autoincremented from 0 for each line, and each column is a Y value
   * at that X.
   */
  x?: boolean;

  /**
   * If given, write output to the given file name relative to the working
   * directory, and make the result of plot an empty string.
   */
  output?: string | null;

  /**
   * Use a logarithmic scale for the given axes.  Linear for both x and y if
   * null.
   */
  log?: 'x' | 'y' | 'xy' | '' | null;

  /**
   * Useful for debugging only.  Ouptut the generated gnuplot script to the
   * given file if specified.
   */
  scriptOut?: string | null;

  /**
   * A string of the form <number>x<number> for columns and rows.
   * Shrink by columns and rows.
   */
  shrink?: string;
}

export const DEFAULT_PLOT_OPTIONS: Required<PlotOptions> = {
  files: ['-'],
  background: 'gray90',
  dimensions: '0x0',
  x: false,
  output: null,
  log: null,
  scriptOut: null,
  shrink: '1x3',
};

interface WH {
  width: number;
  height: number;
}

function toInt(xByY?: string): WH {
  const groups = xByY?.match(/^(?<width>\d+)x(?<height>\d+)/)?.groups;
  if (!groups) {
    return {width: 0, height: 0};
  }
  return {
    width: parseInt(groups.width, 10),
    height: parseInt(groups.height, 10),
  };
}

/**
 * Plot with the given options.
 *
 * @param opts Options for plotting.
 * @returns Exit value for process.
 */
export async function plot(opts: PlotOptions): Promise<string> {
  opts = {
    ...DEFAULT_PLOT_OPTIONS,
    ...opts,
  };
  const data: {
    [filename: string]: string;
  } = Object.create(null);
  const cols: {
    [filename: string]: number;
  } = Object.create(null);

  for (const f of opts.files) {
    const fn = (f === '-') ? 'stdin' : f.replaceAll('/', '__');
    const txt = (f === '-') ?
      await text(process.stdin) :
      await fs.readFile(f, 'utf8');

    // Blank lines.
    for (const [i, chunk] of txt.split('\n\n').entries()) {
      if (chunk) {
        const cn = `${fn}-${i}`;
        data[cn] = chunk;
        cols[cn] = Math.max(...chunk.split('\n').map(line => line.split(/\s+/g).length));
      }
    }
  }

  let {width, height} = toInt(opts.dimensions);
  if ((width === 0) || (height === 0) || isNaN(width) || isNaN(height)) {
    const {width: columns, height: rows} = toInt(opts.shrink);

    // Only do this if needed, so tests can pass.
    const {width: tw, height: th} =
      await getTerminalSize({rows: -rows, columns: -columns});
    width = ((width === 0) || isNaN(width)) ? tw : width;
    height = ((height === 0) || isNaN(height)) ? th : height;
  }

  let script = `\
set key off
set term svg size ${width}, ${height} font "sans,28" background rgb "${opts.background}" lw 4 rounded
`;
  if (opts.log?.includes('x')) {
    script += 'set logscale x\n';
  }
  if (opts.log?.includes('y')) {
    script += 'set logscale y\n';
  }
  script += 'plot';
  let first = true;
  for (const f of Object.keys(data)) {
    const numCols = cols[f] ?? 0;
    for (let col = (opts.x ? 2 : 1); col <= numCols; col++) {
      if (first) {
        first = false;
      } else {
        script += ',';
      }
      script += ` "${f}" using ${opts.x ? `1:${col}` : `0:${col}`} with linespoints`;
    }
  }
  script += '\n';

  if (opts.scriptOut) {
    await fs.writeFile(opts.scriptOut, script, 'utf8');
  }
  const {svg, stdout} = render(script, {data});

  if (stdout) {
    return stdout;
  }

  if (opts.output) {
    await fs.writeFile(opts.output, svg, 'utf8');
    return '';
  }
  return terminalImage(Buffer.from(svg));
}
