const test = require('tape');

const testPaths = [
  './test/parallel/test-assert-async.js',
  './test/parallel/test-assert-checktag.js',
  './test/parallel/test-assert-deep.js',
  './test/parallel/test-assert-fail-deprecation.js',
  './test/parallel/test-assert-fail.js',
  './test/parallel/test-assert-if-error.js',
  './test/parallel/test-assert-typedarray-deepequal.js',
  './test/parallel/test-assert.js',
  './test/pseudo-tty/test-assert-colors.js',
  './test/pseudo-tty/test-assert-no-color.js',
  './test/pseudo-tty/test-assert-position-indicator.js'
];

testPaths.forEach(testPath => {
  test(testPath, t => {
    t.plan(2)
    let result;
    t.doesNotThrow(() => {
      result = require(testPath);
    });
    Promise.resolve(result)
      .then(() => false)
      .catch(error => error)
      .then(resolved => t.error(resolved, 'should not resolve to rejected Promise'));
  });
});
