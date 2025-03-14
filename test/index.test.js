import assert from 'node:assert';
import {fileURLToPath} from 'node:url';
import {plot} from '../lib/index.js';
import test from 'node:test';

const wc = fileURLToPath(new URL('./fixtures/wc', import.meta.url));
const col2 = fileURLToPath(new URL('./fixtures/2cols', import.meta.url));

test('wc', async() => {
  const out = await plot({
    files: [wc],
    dimensions: '1000x500',
  });
  assert(out);
  assert.equal(typeof out, 'string');
  // eslint-disable-next-line no-control-regex
  assert.match(out, /^\x1b]1337;/);
});

test('2cols', async() => {
  assert(await plot({
    files: [col2],
    dimensions: '1000x500',
    log: 'y',
  }));
  assert(await plot({
    files: [col2],
    dimensions: '1000x500',
    log: 'x',
    x: true,
  }));
});
