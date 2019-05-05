// Currently in sync with Node.js lib/internal/errors.js
// https://github.com/nodejs/node/commit/3b044962c48fe313905877a96b5d0894a5404f6f

/* eslint node-core/documented-errors: "error" */
/* eslint node-core/alphabetize-errors: "error" */
/* eslint node-core/prefer-util-format-errors: "error" */

'use strict';

// The whole point behind this internal module is to allow Node.js to no
// longer be forced to treat every error message change as a semver-major
// change. The NodeError classes here all expose a `code` property whose
// value statically and permanently identifies the error. While the error
// message may change, the code should not.

const codes = {};

// Lazy loaded
let assert;
let util;

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error
  }

  function getMessage (arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message
    } else {
      return message(arg1, arg2, arg3)
    }
  }

  class NodeError extends Base {
    constructor (arg1, arg2, arg3) {
      super(getMessage(arg1, arg2, arg3));
      this.code = code;
    }
  }

  codes[code] = NodeError;
}

// https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js
function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    const len = expected.length;
    expected = expected.map((i) => String(i));
    if (len > 2) {
      return `one of ${thing} ${expected.slice(0, len - 1).join(', ')}, or ` +
             expected[len - 1];
    } else if (len === 2) {
      return `one of ${thing} ${expected[0]} or ${expected[1]}`;
    } else {
      return `of ${thing} ${expected[0]}`;
    }
  } else {
    return `of ${thing} ${String(expected)}`;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
function startsWith(str, search, pos) {
	return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
function endsWith(str, search, this_len) {
	if (this_len === undefined || this_len > str.length) {
		this_len = str.length;
	}
	return str.substring(this_len - search.length, this_len) === search;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_AMBIGUOUS_ARGUMENT', 'The "%s" argument is ambiguous. %s', TypeError);
createErrorType('ERR_INVALID_ARG_TYPE',
  (name, expected, actual) => {
    if (assert === undefined) assert = require('../assert');
    assert(typeof name === 'string', "'name' must be a string");

    // determiner: 'must be' or 'must not be'
    let determiner;
    if (typeof expected === 'string' && startsWith(expected, 'not ')) {
      determiner = 'must not be';
      expected = expected.replace(/^not /, '');
    } else {
      determiner = 'must be';
    }

    let msg;
    if (endsWith(name, ' argument')) {
      // For cases like 'first argument'
      msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`;
    } else {
      const type = includes(name, '.') ? 'property' : 'argument';
      msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`;
    }

    // TODO(BridgeAR): Improve the output by showing `null` and similar.
    msg += `. Received type ${typeof actual}`;
    return msg;
  }, TypeError);
createErrorType('ERR_INVALID_ARG_VALUE', (name, value, reason = 'is invalid') => {
  if (util === undefined) util = require('util/');
  let inspected = util.inspect(value);
  if (inspected.length > 128) {
    inspected = `${inspected.slice(0, 128)}...`;
  }
  return `The argument '${name}' ${reason}. Received ${inspected}`;
}, TypeError, RangeError);
createErrorType('ERR_INVALID_RETURN_VALUE', (input, name, value) => {
  let type;
  if (value && value.constructor && value.constructor.name) {
    type = `instance of ${value.constructor.name}`;
  } else {
    type = `type ${typeof value}`;
  }
  return `Expected ${input} to be returned from the "${name}"` +
         ` function but got ${type}.`;
}, TypeError);
createErrorType('ERR_MISSING_ARGS',
  (...args) => {
    if (assert === undefined) assert = require('../assert');
    assert(args.length > 0, 'At least one arg needs to be specified');
    let msg = 'The ';
    const len = args.length;
    args = args.map((a) => `"${a}"`);
    switch (len) {
      case 1:
        msg += `${args[0]} argument`;
        break;
      case 2:
        msg += `${args[0]} and ${args[1]} arguments`;
        break;
      default:
        msg += args.slice(0, len - 1).join(', ');
        msg += `, and ${args[len - 1]} arguments`;
        break;
    }
    return `${msg} must be specified`;
  }, TypeError);

module.exports.codes = codes;
