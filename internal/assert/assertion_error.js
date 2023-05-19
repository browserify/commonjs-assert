// Currently in sync with Node.js lib/internal/assert/assertion_error.js
// https://github.com/nodejs/node/commit/0817840f775032169ddd70c85ac059f18ffcc81c

'use strict';

const { inspect } = require('util');
const { codes: {
  ERR_INVALID_ARG_TYPE
} } = require('../errors');

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
function endsWith(str, search, this_len) {
	if (this_len === undefined || this_len > str.length) {
		this_len = str.length;
	}
	return str.substring(this_len - search.length, this_len) === search;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
function repeat(str, count) {
  count = Math.floor(count);
  if (str.length == 0 || count == 0)
    return '';

  var maxCount = str.length * count;
  count = Math.floor(Math.log(count) / Math.log(2));
  while (count) {
     str += str;
     count--;
  }
  str += str.substring(0, maxCount - str.length);
  return str;
}

let blue = '';
let green = '';
let red = '';
let white = '';

const kReadableOperator = {
  deepStrictEqual: 'Expected values to be strictly deep-equal:',
  strictEqual: 'Expected values to be strictly equal:',
  strictEqualObject: 'Expected "actual" to be reference-equal to "expected":',
  deepEqual: 'Expected values to be loosely deep-equal:',
  equal: 'Expected values to be loosely equal:',
  notDeepStrictEqual: 'Expected "actual" not to be strictly deep-equal to:',
  notStrictEqual: 'Expected "actual" to be strictly unequal to:',
  notStrictEqualObject:
    'Expected "actual" not to be reference-equal to "expected":',
  notDeepEqual: 'Expected "actual" not to be loosely deep-equal to:',
  notEqual: 'Expected "actual" to be loosely unequal to:',
  notIdentical: 'Values identical but not reference-equal:',
};

// Comparing short primitives should just show === / !== instead of using the
// diff.
const kMaxShortLength = 10;

function copyError(source) {
  const keys = Object.keys(source);
  const target = Object.create(Object.getPrototypeOf(source));
  keys.forEach(key => {
    target[key] = source[key];
  });
  Object.defineProperty(target, 'message', { value: source.message });
  return target;
}

function inspectValue(val) {
  // The util.inspect default values could be changed. This makes sure the
  // error messages contain the necessary information nevertheless.
  return inspect(
    val,
    {
      compact: false,
      customInspect: false,
      depth: 1000,
      maxArrayLength: Infinity,
      // Assert compares only enumerable properties (with a few exceptions).
      showHidden: false,
      // Having a long line as error is better than wrapping the line for
      // comparison for now.
      // TODO(BridgeAR): `breakLength` should be limited as soon as soon as we
      // have meta information about the inspected properties (i.e., know where
      // in what line the property starts and ends).
      breakLength: Infinity,
      // Assert does not detect proxies currently.
      showProxy: false,
      sorted: true,
      // Inspect getters as we also check them when comparing entries.
      getters: true
    }
  );
}

function createErrDiff(actual, expected, operator) {
  let other = '';
  let res = '';
  let lastPos = 0;
  let end = '';
  let skipped = false;
  const actualInspected = inspectValue(actual);
  const actualLines = actualInspected.split('\n');
  const expectedLines = inspectValue(expected).split('\n');

  let i = 0;
  let indicator = '';

  // In case both values are objects explicitly mark them as not reference equal
  // for the `strictEqual` operator.
  if (operator === 'strictEqual' &&
      typeof actual === 'object' &&
      typeof expected === 'object' &&
      actual !== null &&
      expected !== null) {
    operator = 'strictEqualObject';
  }

  // If "actual" and "expected" fit on a single line and they are not strictly
  // equal, check further special handling.
  if (actualLines.length === 1 && expectedLines.length === 1 &&
    actualLines[0] !== expectedLines[0]) {
    const inputLength = actualLines[0].length + expectedLines[0].length;
    // If the character length of "actual" and "expected" together is less than
    // kMaxShortLength and if neither is an object and at least one of them is
    // not `zero`, use the strict equal comparison to visualize the output.
    if (inputLength <= kMaxShortLength) {
      if ((typeof actual !== 'object' || actual === null) &&
          (typeof expected !== 'object' || expected === null) &&
          (actual !== 0 || expected !== 0)) { // -0 === +0
        return `${kReadableOperator[operator]}\n\n` +
            `${actualLines[0]} !== ${expectedLines[0]}\n`;
      }
    } else if (operator !== 'strictEqualObject') {
      // If the stderr is a tty and the input length is lower than the current
      // columns per line, add a mismatch indicator below the output. If it is
      // not a tty, use a default value of 80 characters.
      const maxLength = process.stderr && process.stderr.isTTY ? process.stderr.columns : 80;
      if (inputLength < maxLength) {
        while (actualLines[0][i] === expectedLines[0][i]) {
          i++;
        }
        // Ignore the first characters.
        if (i > 2) {
          // Add position indicator for the first mismatch in case it is a
          // single line and the input length is less than the column length.
          indicator = `\n  ${repeat(' ', i)}^`;
          i = 0;
        }
      }
    }
  }

  // Remove all ending lines that match (this optimizes the output for
  // readability by reducing the number of total changed lines).
  let a = actualLines[actualLines.length - 1];
  let b = expectedLines[expectedLines.length - 1];
  while (a === b) {
    if (i++ < 2) {
      end = `\n  ${a}${end}`;
    } else {
      other = a;
    }
    actualLines.pop();
    expectedLines.pop();
    if (actualLines.length === 0 || expectedLines.length === 0)
      break;
    a = actualLines[actualLines.length - 1];
    b = expectedLines[expectedLines.length - 1];
  }

  const maxLines = Math.max(actualLines.length, expectedLines.length);
  // Strict equal with identical objects that are not identical by reference.
  // E.g., assert.deepStrictEqual({ a: Symbol() }, { a: Symbol() })
  if (maxLines === 0) {
    // We have to get the result again. The lines were all removed before.
    const actualLines = actualInspected.split('\n');

    // Only remove lines in case it makes sense to collapse those.
    // TODO: Accept env to always show the full error.
    if (actualLines.length > 30) {
      actualLines[26] = `${blue}...${white}`;
      while (actualLines.length > 27) {
        actualLines.pop();
      }
    }

    return `${kReadableOperator.notIdentical}\n\n${actualLines.join('\n')}\n`;
  }

  if (i > 3) {
    end = `\n${blue}...${white}${end}`;
    skipped = true;
  }
  if (other !== '') {
    end = `\n  ${other}${end}`;
    other = '';
  }

  let printedLines = 0;
  const msg = kReadableOperator[operator] +
        `\n${green}+ actual${white} ${red}- expected${white}`;
  const skippedMsg = ` ${blue}...${white} Lines skipped`;

  for (i = 0; i < maxLines; i++) {
    // Only extra expected lines exist
    const cur = i - lastPos;
    if (actualLines.length < i + 1) {
      // If the last diverging line is more than one line above and the
      // current line is at least line three, add some of the former lines and
      // also add dots to indicate skipped entries.
      if (cur > 1 && i > 2) {
        if (cur > 4) {
          res += `\n${blue}...${white}`;
          skipped = true;
        } else if (cur > 3) {
          res += `\n  ${expectedLines[i - 2]}`;
          printedLines++;
        }
        res += `\n  ${expectedLines[i - 1]}`;
        printedLines++;
      }
      // Mark the current line as the last diverging one.
      lastPos = i;
      // Add the expected line to the cache.
      other += `\n${red}-${white} ${expectedLines[i]}`;
      printedLines++;
    // Only extra actual lines exist
    } else if (expectedLines.length < i + 1) {
      // If the last diverging line is more than one line above and the
      // current line is at least line three, add some of the former lines and
      // also add dots to indicate skipped entries.
      if (cur > 1 && i > 2) {
        if (cur > 4) {
          res += `\n${blue}...${white}`;
          skipped = true;
        } else if (cur > 3) {
          res += `\n  ${actualLines[i - 2]}`;
          printedLines++;
        }
        res += `\n  ${actualLines[i - 1]}`;
        printedLines++;
      }
      // Mark the current line as the last diverging one.
      lastPos = i;
      // Add the actual line to the result.
      res += `\n${green}+${white} ${actualLines[i]}`;
      printedLines++;
    // Lines diverge
    } else {
      const expectedLine = expectedLines[i];
      let actualLine = actualLines[i];
      // If the lines diverge, specifically check for lines that only diverge by
      // a trailing comma. In that case it is actually identical and we should
      // mark it as such.
      let divergingLines = actualLine !== expectedLine &&
                           (!endsWith(actualLine, ',') ||
                            actualLine.slice(0, -1) !== expectedLine);
      // If the expected line has a trailing comma but is otherwise identical,
      // add a comma at the end of the actual line. Otherwise the output could
      // look weird as in:
      //
      //   [
      //     1         // No comma at the end!
      // +   2
      //   ]
      //
      if (divergingLines &&
          endsWith(expectedLine, ',') &&
          expectedLine.slice(0, -1) === actualLine) {
        divergingLines = false;
        actualLine += ',';
      }
      if (divergingLines) {
        // If the last diverging line is more than one line above and the
        // current line is at least line three, add some of the former lines and
        // also add dots to indicate skipped entries.
        if (cur > 1 && i > 2) {
          if (cur > 4) {
            res += `\n${blue}...${white}`;
            skipped = true;
          } else if (cur > 3) {
            res += `\n  ${actualLines[i - 2]}`;
            printedLines++;
          }
          res += `\n  ${actualLines[i - 1]}`;
          printedLines++;
        }
        // Mark the current line as the last diverging one.
        lastPos = i;
        // Add the actual line to the result and cache the expected diverging
        // line so consecutive diverging lines show up as +++--- and not +-+-+-.
        res += `\n${green}+${white} ${actualLine}`;
        other += `\n${red}-${white} ${expectedLine}`;
        printedLines += 2;
      // Lines are identical
      } else {
        // Add all cached information to the result before adding other things
        // and reset the cache.
        res += other;
        other = '';
        // If the last diverging line is exactly one line above or if it is the
        // very first line, add the line to the result.
        if (cur === 1 || i === 0) {
          res += `\n  ${actualLine}`;
          printedLines++;
        }
      }
    }
    // Inspected object to big (Show ~20 rows max)
    if (printedLines > 20 && i < maxLines - 2) {
      return `${msg}${skippedMsg}\n${res}\n${blue}...${white}${other}\n` +
             `${blue}...${white}`;
    }
  }

  return `${msg}${skipped ? skippedMsg : ''}\n${res}${other}${end}${indicator}`;
}

class AssertionError extends Error {
  constructor(options) {
    if (typeof options !== 'object' || options === null) {
      throw new ERR_INVALID_ARG_TYPE('options', 'Object', options);
    }
    const {
      message,
      operator,
      stackStartFn
    } = options;
    let {
      actual,
      expected
    } = options;

    const limit = Error.stackTraceLimit;
    Error.stackTraceLimit = 0;

    if (message != null) {
      super(String(message));
    } else {
      if (process.stderr && process.stderr.isTTY) {
        // Reset on each call to make sure we handle dynamically set environment
        // variables correct.
        if (
          process.stderr &&
          process.stderr.getColorDepth &&
          process.stderr.getColorDepth() !== 1
        ) {
          blue = '\u001b[34m';
          green = '\u001b[32m';
          white = '\u001b[39m';
          red = '\u001b[31m';
        } else {
          blue = '';
          green = '';
          white = '';
          red = '';
        }
      }
      // Prevent the error stack from being visible by duplicating the error
      // in a very close way to the original in case both sides are actually
      // instances of Error.
      if (typeof actual === 'object' && actual !== null &&
          typeof expected === 'object' && expected !== null &&
          'stack' in actual && actual instanceof Error &&
          'stack' in expected && expected instanceof Error) {
        actual = copyError(actual);
        expected = copyError(expected);
      }

      if (operator === 'deepStrictEqual' || operator === 'strictEqual') {
        super(createErrDiff(actual, expected, operator));
      } else if (operator === 'notDeepStrictEqual' ||
        operator === 'notStrictEqual') {
        // In case the objects are equal but the operator requires unequal, show
        // the first object and say A equals B
        let base = kReadableOperator[operator];
        const res = inspectValue(actual).split('\n');

        // In case "actual" is an object, it should not be reference equal.
        if (operator === 'notStrictEqual' &&
            typeof actual === 'object' &&
            actual !== null) {
          base = kReadableOperator.notStrictEqualObject;
        }

        // Only remove lines in case it makes sense to collapse those.
        // TODO: Accept env to always show the full error.
        if (res.length > 30) {
          res[26] = `${blue}...${white}`;
          while (res.length > 27) {
            res.pop();
          }
        }

        // Only print a single input.
        if (res.length === 1) {
          super(`${base} ${res[0]}`);
        } else {
          super(`${base}\n\n${res.join('\n')}\n`);
        }
      } else {
        let res = inspectValue(actual);
        let other = '';
        const knownOperators = kReadableOperator[operator];
        if (operator === 'notDeepEqual' || operator === 'notEqual') {
          res = `${kReadableOperator[operator]}\n\n${res}`;
          if (res.length > 1024) {
            res = `${res.slice(0, 1021)}...`;
          }
        } else {
          other = `${inspectValue(expected)}`;
          if (res.length > 512) {
            res = `${res.slice(0, 509)}...`;
          }
          if (other.length > 512) {
            other = `${other.slice(0, 509)}...`;
          }
          if (operator === 'deepEqual' || operator === 'equal') {
            res = `${knownOperators}\n\n${res}\n\nshould equal\n\n`;
          } else {
            other = ` ${operator} ${other}`;
          }
        }
        super(`${res}${other}`);
      }
    }

    Error.stackTraceLimit = limit;

    this.generatedMessage = !message;
    Object.defineProperty(this, 'name', {
      value: 'AssertionError [ERR_ASSERTION]',
      enumerable: false,
      writable: true,
      configurable: true
    });
    this.code = 'ERR_ASSERTION';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;
    if (Error.captureStackTrace) {
      // eslint-disable-next-line no-restricted-syntax
      Error.captureStackTrace(this, stackStartFn);
    }
    // Create error message including the error code in the name.
    this.stack;
    // Reset the name.
    this.name = 'AssertionError';
  }

  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  [inspect.custom](recurseTimes, ctx) {
    // This limits the `actual` and `expected` property default inspection to
    // the minimum depth. Otherwise those values would be too verbose compared
    // to the actual error message which contains a combined view of these two
    // input values.
    return inspect(this, { ...ctx, customInspect: false, depth: 0 });
  }
}

module.exports = AssertionError;
