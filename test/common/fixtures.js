// Currently in sync with Node.js test/common/fixtures.js
// https://github.com/nodejs/node/commit/6934792eb34c75c16ac810951d0abadfe96238a9

/* eslint-disable node-core/required-modules */
'use strict';

const path = require('path');
const fs = require('fs');

const fixturesDir = path.join(__dirname, '..', 'fixtures');

function fixturesPath(...args) {
  return path.join(fixturesDir, ...args);
}

function readFixtureSync(args, enc) {
  if (Array.isArray(args))
    return fs.readFileSync(fixturesPath(...args), enc);
  return fs.readFileSync(fixturesPath(args), enc);
}

function readFixtureKey(name, enc) {
  return fs.readFileSync(fixturesPath('keys', name), enc);
}

module.exports = {
  fixturesDir,
  path: fixturesPath,
  readSync: readFixtureSync,
  readKey: readFixtureKey
};
