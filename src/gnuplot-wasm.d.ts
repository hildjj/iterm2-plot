declare module 'gnuplot-wasm';

export interface InitOptions {
  noInitialRun?: boolean;
  noFSInit?: boolean;
  print?(s: string): void;
  printErr?(s: string): void;
}

export interface RenderOptions {
  term?: string;
  width?: number;
  height?: number;
  background?: string;
  data?: {
    [filename: string]: string;
  }
}

export default function init(options?: InitOptions): Promise<{
  version: () => string;
  render: (script: string, options?: RenderOptions) => {
      svg: any;
      stdout: string;
  };
  exec: (...argv: any[]) => {
      exitCode: any;
      stdout: string;
  };
  _gnuplot: any;
}>;
