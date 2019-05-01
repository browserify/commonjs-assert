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

const kCode = Symbol('code');
const kInfo = Symbol('info');
const messages = new Map();
const codes = {};

const { kMaxLength } = require('buffer/');
const { defineProperty } = Object;

let excludedStackFn;

// Lazily loaded
let util;
let assert;

function makeNodeErrorWithCode(Base, key) {
  return class NodeError extends Base {
    constructor(...args) {
      if (excludedStackFn === undefined) {
        super();
      } else {
        const limit = Error.stackTraceLimit;
        Error.stackTraceLimit = 0;
        super();
        // Reset the limit and setting the name property.
        Error.stackTraceLimit = limit;
      }
      const message = getMessage(key, args, this);
      Object.defineProperty(this, 'message', {
        value: message,
        enumerable: false,
        writable: true,
        configurable: true
      });
      addCodeToName(this, super.name, key);
    }

    get code() {
      return key;
    }

    set code(value) {
      defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      });
    }

    toString() {
      return `${this.name} [${key}]: ${this.message}`;
    }
  };
}

function addCodeToName(err, name, code) {
  // Set the stack
  if (excludedStackFn !== undefined && Error.captureStackTrace) {
    // eslint-disable-next-line no-restricted-syntax
    Error.captureStackTrace(err, excludedStackFn);
  }
  // Add the error code to the name to include it in the stack trace.
  err.name = `${name} [${code}]`;
  // Access the stack to generate the error message including the error code
  // from the name.
  err.stack;
  // Reset the name to the actual name.
  if (name === 'SystemError') {
    defineProperty(err, 'name', {
      value: name,
      enumerable: false,
      writable: true,
      configurable: true
    });
  } else {
    delete err.name;
  }
}

// Utility function for registering the error codes. Only used here. Exported
// *only* to allow for testing.
function E(sym, val, def, ...otherClasses) {
  messages.set(sym, val);
  def = makeNodeErrorWithCode(def, sym);

  if (otherClasses.length !== 0) {
    otherClasses.forEach((clazz) => {
      def[clazz.name] = makeNodeErrorWithCode(clazz, sym);
    });
  }
  codes[sym] = def;
}

function getMessage(key, args, self) {
  if (assert === undefined) assert = require('../');
  const msg = messages.get(key);

  if (typeof msg === 'function') {
    assert(
      msg.length <= args.length, // Default options do not count.
      `Code: ${key}; The provided arguments length (${args.length}) does not ` +
        `match the required ones (${msg.length}).`
    );
    return msg.apply(self, args);
  }

  const expectedLength = (msg.match(/%[dfijoOs]/g) || []).length;
  assert(
    expectedLength === args.length,
    `Code: ${key}; The provided arguments length (${args.length}) does not ` +
      `match the required ones (${expectedLength}).`
  );
  if (args.length === 0)
    return msg;

  args.unshift(msg);
  if (util === undefined) util = require('@lukechilds/util');
  return util.format.apply(null, args);
}

function oneOf(expected, thing) {
  if (assert === undefined) assert = require('../');
  assert(typeof thing === 'string', '`thing` has to be of type string');
  if (Array.isArray(expected)) {
    const len = expected.length;
    assert(len > 0,
           'At least one expected value needs to be specified');
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

module.exports = {
  codes
};

// To declare an error message, use the E(sym, val, def) function above. The sym
// must be an upper case string. The val can be either a function or a string.
// The def must be an error class.
// The return value of the function must be a string.
// Examples:
// E('EXAMPLE_KEY1', 'This is the error value', Error);
// E('EXAMPLE_KEY2', (a, b) => return `${a} ${b}`, RangeError);
//
// Once an error code has been assigned, the code itself MUST NOT change and
// any given error code must never be reused to identify a different error.
//
// Any error code added here should also be added to the documentation
//
// Note: Please try to keep these in alphabetical order
//
// Note: Node.js specific errors must begin with the prefix ERR_
E('ERR_AMBIGUOUS_ARGUMENT', 'The "%s" argument is ambiguous. %s', TypeError);
E('ERR_INVALID_ARG_TYPE',
  (name, expected, actual) => {
    if (assert === undefined) assert = require('../');
    assert(typeof name === 'string', "'name' must be a string");

    // determiner: 'must be' or 'must not be'
    let determiner;
    if (typeof expected === 'string' && expected.startsWith('not ')) {
      determiner = 'must not be';
      expected = expected.replace(/^not /, '');
    } else {
      determiner = 'must be';
    }

    let msg;
    if (name.endsWith(' argument')) {
      // For cases like 'first argument'
      msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`;
    } else {
      const type = name.includes('.') ? 'property' : 'argument';
      msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`;
    }

    // TODO(BridgeAR): Improve the output by showing `null` and similar.
    msg += `. Received type ${typeof actual}`;
    return msg;
  }, TypeError);
E('ERR_INVALID_ARG_VALUE', (name, value, reason = 'is invalid') => {
  if (util === undefined) util = require('@lukechilds/util');
  let inspected = util.inspect(value);
  if (inspected.length > 128) {
    inspected = `${inspected.slice(0, 128)}...`;
  }
  return `The argument '${name}' ${reason}. Received ${inspected}`;
}, TypeError, RangeError);
E('ERR_INVALID_RETURN_VALUE', (input, name, value) => {
  let type;
  if (value && value.constructor && value.constructor.name) {
    type = `instance of ${value.constructor.name}`;
  } else {
    type = `type ${typeof value}`;
  }
  return `Expected ${input} to be returned from the "${name}"` +
         ` function but got ${type}.`;
}, TypeError);
E('ERR_MISSING_ARGS',
  (...args) => {
    if (assert === undefined) assert = require('../');
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
