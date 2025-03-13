import assert from 'node:assert';
import {fileURLToPath} from 'node:url';
import {plot} from '../lib/index.js';
import test from 'node:test';

const wc = fileURLToPath(new URL('./fixtures/wc', import.meta.url));

test('index', async() => {
  const out = await plot({
    files: [wc],
    dimensions: '1000x500',
  });
  assert(out);
  assert.equal(typeof out, 'string');
});
