const test = require('tape');
const glob = require('glob');
const path = require('path');

const testPaths = glob.sync('test/**/test-assert*.js');

testPaths.forEach(testPath => {
  test(testPath, t => {
    t.doesNotThrow(() => {
      require(path.resolve(__dirname, testPath));
    });
    t.end();
  });
});
