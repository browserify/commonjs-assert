// Currently in sync with Node.js test/pseudo-tty/test-assert-colors.js
// https://github.com/nodejs/node/commit/7f2d2cdc0cb45b8c97abf152b5cce6ec43aaaf79

'use strict';
require('../common');
const assert = require('../../assert').strict;

try {
  // Activate colors even if the tty does not support colors.
  process.env.COLORTERM = '1';
  // Make sure TERM is not set to e.g., 'dumb' and NODE_DISABLE_COLORS is not
  // active.
  process.env.TERM = 'FOOBAR';
  delete process.env.NODE_DISABLE_COLORS;
  assert.deepStrictEqual([1, 2, 2, 2], [2, 2, 2, 2]);
} catch (err) {
  const expected = 'Expected values to be strictly deep-equal:\n' +
    '\u001b[32m+ actual\u001b[39m \u001b[31m- expected\u001b[39m' +
      ' \u001b[34m...\u001b[39m Lines skipped\n\n' +
    '  [\n' +
    '\u001b[32m+\u001b[39m   1,\n' +
    '\u001b[31m-\u001b[39m   2,\n' +
    '    2,\n' +
    '\u001b[34m...\u001b[39m\n' +
    '    2\n' +
    '  ]';
  // [browserify]
  // Don't test the exact message, it's inconstent between browsers.
  // assert.strictEqual(err.message, expected);
  if(process.stderr && process.stderr.getColorDepth) {
    assert(err.message.indexOf('[32m') > -1);
  }
}
