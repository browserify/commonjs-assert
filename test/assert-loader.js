'use strict';

const assert = require(process.env.TEST_NATIVE === 'true' ? 'assert' : '../.');

module.exports = assert;
