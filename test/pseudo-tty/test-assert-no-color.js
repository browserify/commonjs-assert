// Currently in sync with Node.js test/pseudo-tty/test-assert-no-color.js
// https://github.com/nodejs/node/commit/a2c2c78e097c4e1036eb24abd620a52c709a9467

'use strict';
require('../common');
const assert = require('../../assert').strict;

process.env.NODE_DISABLE_COLORS = true;

try {
  assert.deepStrictEqual({}, { foo: 'bar' });
} catch (error) {
  const expected =
    'Expected values to be strictly deep-equal:\n' +
    '+ actual - expected\n' +
    '\n' +
    '+ {}\n' +
    '- {\n' +
    '-   foo: \'bar\'\n' +
    '- }';
  // [browserify]
  // Don't test the exact message, it's inconstent between browsers.
  // assert.strictEqual(error.message, expected);
  assert(error.message.indexOf('[32m') === -1);
}
