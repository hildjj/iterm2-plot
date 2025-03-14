import {Buffer} from 'node:buffer';
import fs from 'node:fs/promises';
import {getTerminalSize} from 'iterm2-size';
import gnuplot from 'gnuplot-wasm';
import terminalImage from 'term-img';
import {text} from 'node:stream/consumers';

const {render} = await gnuplot();

export interface PlotOptions {
  files: string[]; // "-" for stdin
  dimensions?: string; // WxH
  x?: boolean; // Treat first column as X for all following Y columns
  output?: string | null;
  log?: 'x' | 'y' | 'xy' | null;
}

const DEFAULT_PLOT_OPTIONS: Required<PlotOptions> = {
  files: ['-'],
  dimensions: '0x0',
  x: false,
  output: null,
  log: null,
};

interface WH {
  width: number;
  height: number;
}

function toInt(groups?: {
  [key: string]: string;
}): WH {
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

  let {width, height} = toInt(opts.dimensions?.match(/^(?<width>\d+)x(?<height>\d+)/)?.groups);
  if ((width === 0) || (height === 0)) {
    // Only do this if needed, so tests can pass.
    const {width: tw, height: th} =
      await getTerminalSize({rows: -3, columns: -1});
    width = (width === 0) ? tw : width;
    height = (height === 0) ? th : height;
  }

  let script = `
set key off
set term svg size ${width}, ${height} font "sans,28" background rgb "gray90" lw 4 rounded
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
