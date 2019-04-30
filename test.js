const test = require('tape');
const glob = require('glob');
const path = require('path');

const testPaths = glob.sync('test/**/test-assert*.js');

testPaths.forEach(testPath => {
  test(testPath, t => {
    t.plan(2)
    let result;
    t.doesNotThrow(() => {
      result = require(path.resolve(__dirname, testPath));
    });
    Promise.resolve(result)
      .then(() => false)
      .catch(error => error)
      .then(resolved => t.error(resolved, 'should not resolve to rejected Promise'));
  });
});
