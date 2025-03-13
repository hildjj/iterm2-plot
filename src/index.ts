import {Buffer} from 'node:buffer';
import fs from 'node:fs/promises';
import {getTerminalSize} from 'iterm2-size';
import gnuplot from 'gnuplot-wasm';
import terminalImage from 'term-img';

export interface PlotOptions {
  files: string[]; // "-" for stdin
  dimensions?: string; // WxH
  x?: boolean; // Treat first column as X for all following Y columns
}

const DEFAULT_PLOT_OPTIONS: Required<PlotOptions> = {
  files: ['-'],
  dimensions: '0x0',
  x: false,
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
  // const pointsByCol: Point[][] = [];

  let txt = '';
  for (const f of opts.files) {
    txt += await fs.readFile((f === '-') ? '/dev/stdin' : f, 'utf8');
    // let x = opts.x ? null : 0;
    // let max_col = 0;
    // let col_offset = 0;
    // for (const line of txt.split(os.EOL)) {
    //   if (line.length === 0) {
    //     // Reset x on blank line
    //     x = opts.x ? null : 0;
    //     col_offset = max_col;
    //     continue;
    //   }
    //   const nums = line.split(/[^0-9._-]/).map(n => parseFloat(n));
    //   if (opts.x) {
    //     x = nums.shift() ?? NaN;
    //   }
    //   let col = 0;
    //   for (const y of nums) {
    //     assert(typeof x === 'number');
    //     let pm = pointsByCol[col];
    //     if (!pm) {
    //       pm = [];
    //       pointsByCol[col] = pm;
    //     }
    //     pm.push(new Point(x, y));
    //     col++;
    //   }
    //   max_col = Math.max(max_col, nums.length + col_offset);
    //   if (!opts.x) {
    //     assert(x !== null);
    //     x++;
    //   }
    // }
  }

  let {width, height} = toInt(opts.dimensions?.match(/^(?<width>\d+)x(?<height>\d+)/)?.groups);
  if ((width === 0) || (height === 0)) {
    // Only do this if needed, so tests can pass.
    const {width: tw, height: th} =
      await getTerminalSize({rows: -3, columns: -1});
    width = (width === 0) ? tw : width;
    height = (height === 0) ? th : height;
  }

  const script = `
    set key off
    set term svg size ${width}, ${height} font "sans,28" background rgb "gray90" lw 4 rounded

    plot 'txt' using 0:1 with linespoints pi -1
`;
  const {render} = await gnuplot();
  const {svg} = render(script, {data: {txt}});
  return terminalImage(Buffer.from(svg));
}
