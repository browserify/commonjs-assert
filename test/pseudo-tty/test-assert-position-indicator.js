// Currently in sync with Node.js test/pseudo-tty/test-assert-position-indicator.js
// https://github.com/nodejs/node/commit/40a8a7391664e7a5d8a264a1d85d059f9c05063b

'use strict';
const common = require('../common');
const assert = require('../../assert');

process.env.NODE_DISABLE_COLORS = true;
if (!process.stderr) {
  process.stderr = {};
}
process.stderr.isTTY = true;
process.stderr.columns = 20;

// Confirm that there is no position indicator.
assert.throws(
  () => { assert.deepStrictEqual('a'.repeat(30), 'a'.repeat(31)); },
  (err) => !common.includes(err.message, '^')
);

// Confirm that there is a position indicator.
assert.throws(
  () => { assert.deepStrictEqual('aaa', 'aaaa'); },
  (err) => common.includes(err.message, '^')
);
