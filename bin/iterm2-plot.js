#!/usr/bin/env node

import {cli} from '../lib/cli.js';

const out = await cli();
if (out) {
  console.log(out);
}
