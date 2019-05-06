// Currently in sync with Node.js test/parallel/test-assert-checktag.js
// https://github.com/nodejs/node/commit/7493db21b667ed746d39c9b54357eac4287232e3

// [browserify]
// Most `err.message` tests are commented out because they are
// inconsistent between browsers.

'use strict';
const {isBrowser} = require('../common');
const assert = require('../../assert');

// Disable colored output to prevent color codes from breaking assertion
// message comparisons. This should only be an issue when process.stdout
// is a TTY.
if (process.stdout && process.stdout.isTTY)
  process.env.NODE_DISABLE_COLORS = '1';

// Turn off no-restricted-properties because we are testing deepEqual!
/* eslint-disable no-restricted-properties */

// See https://github.com/nodejs/node/issues/10258
{
  const date = new Date('2016');
  function FakeDate() {}
  FakeDate.prototype = Date.prototype;
  const fake = new FakeDate();

  assert.notDeepEqual(date, fake);
  assert.notDeepEqual(fake, date);

  // For deepStrictEqual we check the runtime type,
  // then reveal the fakeness of the fake date
  assert.throws(
    () => assert.deepStrictEqual(date, fake),
    // {
    //   message: 'Expected values to be strictly deep-equal:\n' +
    //            '+ actual - expected\n\n+ 2016-01-01T00:00:00.000Z\n- Date {}'
    // }
  );
  assert.throws(
    () => assert.deepStrictEqual(fake, date),
    // {
    //   message: 'Expected values to be strictly deep-equal:\n' +
    //            '+ actual - expected\n\n+ Date {}\n- 2016-01-01T00:00:00.000Z'
    // }
  );
}

if (!isBrowser) {  // At the moment global has its own type tag
  const fakeGlobal = {};
  Object.setPrototypeOf(fakeGlobal, Object.getPrototypeOf(global));
  Object.keys(global).forEach(prop => {
    fakeGlobal[prop] = global[prop];
  });
  assert.notDeepEqual(fakeGlobal, global);
  // Message will be truncated anyway, don't validate
  assert.throws(() => assert.deepStrictEqual(fakeGlobal, global),
                assert.AssertionError);
}


if (!isBrowser) { // At the moment process has its own type tag
  const fakeProcess = {};
  Object.setPrototypeOf(fakeProcess, Object.getPrototypeOf(process));
  Object.keys(process).forEach(prop => {
    fakeProcess[prop] = process[prop];
  });
  assert.notDeepEqual(fakeProcess, process);
  // Message will be truncated anyway, don't validate
  assert.throws(() => assert.deepStrictEqual(fakeProcess, process),
                assert.AssertionError);
}
/* eslint-enable */
