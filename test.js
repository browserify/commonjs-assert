const test = require('tape');

// Conditionally load polyfills required for testing
if (typeof Promise === 'undefined') {
  console.log('Loading Promise polyfill');
  require('core-js/features/promise');
}

const testPaths = [
  ['test-assert-async.js', () => require('./test/parallel/test-assert-async.js')],
  ['test-assert-checktag.js', () => require('./test/parallel/test-assert-checktag.js')],
  ['test-assert-deep.js', () => require('./test/parallel/test-assert-deep.js')],
  ['test-assert-fail-deprecation.js', () => require('./test/parallel/test-assert-fail-deprecation.js')],
  ['test-assert-fail.js', () => require('./test/parallel/test-assert-fail.js')],
  ['test-assert-if-error.js', () => require('./test/parallel/test-assert-if-error.js')],
  ['test-assert-typedarray-deepequal.js', () => require('./test/parallel/test-assert-typedarray-deepequal.js')],
  ['test-assert.js', () => require('./test/parallel/test-assert.js')],
  ['test-assert-colors.js', () => require('./test/pseudo-tty/test-assert-colors.js')],
  ['test-assert-no-color.js', () => require('./test/pseudo-tty/test-assert-no-color.js')],
  ['test-assert-position-indicator.js', () => require('./test/pseudo-tty/test-assert-position-indicator.js')]
];

testPaths.forEach(([testName, requireTest]) => {
  test(testName, t => {
    t.plan(2)
    let result;
    t.doesNotThrow(() => {
      result = requireTest();
    });
    Promise.resolve(result)
      .then(() => false)
      .catch(error => error)
      .then(resolved => t.error(resolved, 'should not resolve to rejected Promise'));
  });
});
