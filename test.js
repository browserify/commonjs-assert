const test = require('tape');
const glob = require('glob');
const path = require('path');
const proxyquire = require('proxyquire');

const assert = require(process.env.TEST_NATIVE === 'true' ? 'assert' : '.');

const testPaths = glob.sync('test/**/test-assert*.js');

testPaths.forEach(testPath => {
  test(testPath, t => {
    t.doesNotThrow(() => {
      proxyquire(path.resolve(__dirname, testPath), {assert});
    });
    t.end();
  });
});
