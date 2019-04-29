// Currently in sync with Node.js test/parallel/test-assert-first-line.js
// https://github.com/nodejs/node/commit/1ed3c54ecbd72a33693e5954f86bcc9fd9b1cc09

'use strict';

// Verify that asserting in the very first line produces the expected result.

require('../common');
const assert = require('../assert-loader');
const { path } = require('../common/fixtures');

assert.throws(
  () => require(path('assert-first-line')),
  {
    name: 'AssertionError',
    // message: "The expression evaluated to a falsy value:\n\n  ässört.ok('')\n"
  }
);

assert.throws(
  () => require(path('assert-long-line')),
  {
    name: 'AssertionError',
    // message: "The expression evaluated to a falsy value:\n\n  assert.ok('')\n"
  }
);
