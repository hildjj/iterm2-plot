import {after, test} from 'node:test';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import assert from 'node:assert';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {plot} from '../lib/index.js';
import {tmpdir} from 'node:os';

const wc = fileURLToPath(new URL('./fixtures/wc', import.meta.url));
const col2 = fileURLToPath(new URL('./fixtures/2cols', import.meta.url));

const tmp = await mkdtemp(join(tmpdir(), 'iterm2-plot-'));

after(async() => {
  await rm(tmp, {recursive: true});
});

test('wc', async() => {
  const output = join(tmp, '1.svg');
  const s = await plot({
    files: [wc],
    dimensions: '1000x500',
    output,
  });
  assert.equal(s, '');
  assert.match(await readFile(output, 'utf8'), /^<\?xml/);
});

test('2cols', async() => {
  const output = join(tmp, '1.svg');
  assert.equal(await plot({
    files: [col2],
    dimensions: '1000x500',
    log: 'y',
    output,
  }), '');
  assert.equal(await plot({
    files: [col2],
    dimensions: '1000x500',
    log: 'x',
    x: true,
    output,
  }), '');
});
