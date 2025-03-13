#!/usr/bin/env node
/* eslint-disable no-console */

import {cli} from '../lib/cli.js';

const out = await cli();
console.log(out);
