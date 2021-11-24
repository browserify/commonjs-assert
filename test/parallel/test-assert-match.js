// Currently in sync with Node.js test/parallel/test-assert.js
// https://github.com/nodejs/node/commit/2a871df3dfb8ea663ef5e1f8f62701ec51384ecb

'use strict';

require('../common');
const assert = require('../../assert');

// Multiple assert.match() tests.
{
  assert.throws(
    () => assert.match(/abc/, 'string'),
    {
      code: 'ERR_INVALID_ARG_TYPE',
      message: 'The "regexp" argument must be of type RegExp. Received type string'
    }
  );
  assert.throws(
    () => assert.match('string', /abc/),
    {
      actual: 'string',
      expected: /abc/,
      operator: 'match',
      message: 'The input did not match the regular expression /abc/. ' +
               "Input:\n\n'string'\n",
      generatedMessage: true
    }
  );
  assert.throws(
    () => assert.match('string', /abc/, 'foobar'),
    {
      actual: 'string',
      expected: /abc/,
      operator: 'match',
      message: 'foobar',
      generatedMessage: false
    }
  );
  const errorMessage = new RangeError('foobar');
  assert.throws(
    () => assert.match('string', /abc/, errorMessage),
    errorMessage
  );
  assert.throws(
    () => assert.match({ abc: 123 }, /abc/),
    {
      actual: { abc: 123 },
      expected: /abc/,
      operator: 'match',
      message: 'The "string" argument must be of type string. ' +
               'Received type object ({ abc: 123 })',
      generatedMessage: true
    }
  );
  assert.match('I will pass', /pass$/);
}

// Multiple assert.doesNotMatch() tests.
{
  assert.throws(
    () => assert.doesNotMatch(/abc/, 'string'),
    {
      code: 'ERR_INVALID_ARG_TYPE',
      message: 'The "regexp" argument must be of type RegExp. Received type string'
    }
  );
  assert.throws(
    () => assert.doesNotMatch('string', /string/),
    {
      actual: 'string',
      expected: /string/,
      operator: 'doesNotMatch',
      message: 'The input was expected to not match the regular expression ' +
               "/string/. Input:\n\n'string'\n",
      generatedMessage: true
    }
  );
  assert.throws(
    () => assert.doesNotMatch('string', /string/, 'foobar'),
    {
      actual: 'string',
      expected: /string/,
      operator: 'doesNotMatch',
      message: 'foobar',
      generatedMessage: false
    }
  );
  const errorMessage = new RangeError('foobar');
  assert.throws(
    () => assert.doesNotMatch('string', /string/, errorMessage),
    errorMessage
  );
  assert.throws(
    () => assert.doesNotMatch({ abc: 123 }, /abc/),
    {
      actual: { abc: 123 },
      expected: /abc/,
      operator: 'doesNotMatch',
      message: 'The "string" argument must be of type string. ' +
               'Received type object ({ abc: 123 })',
      generatedMessage: true
    }
  );
  assert.doesNotMatch('I will pass', /different$/);
}
