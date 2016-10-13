# assert

[![Build Status](https://travis-ci.org/defunctzombie/commonjs-assert.svg?branch=master)](https://travis-ci.org/defunctzombie/commonjs-assert)

This module is used for writing unit tests for your applications, you can access it with `require('assert')`.

It aims to be fully compatibe with the [node.js assert module](http://nodejs.org/api/assert.html), same API and same behavior, just adding support for web browsers.
The API and code may contain traces of the [CommonJS Unit Testing 1.0 spec](http://wiki.commonjs.org/wiki/Unit_Testing/1.0) which they were based on, but both have evolved significantly since then.

## assert.fail(actual, expected, message, operator)
Throws an exception that displays the values for actual and expected separated by the provided operator.

## assert(value, message), assert.ok(value, [message])
Tests if value is truthy, it is equivalent to assert.equal(true, !!value, message);

## assert.equal(actual, expected, [message])
Tests shallow, coercive equality with the equal comparison operator ( == ).

## assert.notEqual(actual, expected, [message])
Tests shallow, coercive non-equality with the not equal comparison operator ( != ).

## assert.deepEqual(actual, expected, [message])
Tests for deep equality.

## assert.deepStrictEqual(actual, expected, [message])
Tests for deep equality, as determined by the strict equality operator ( === )

## assert.notDeepEqual(actual, expected, [message])
Tests for any deep inequality.

## assert.strictEqual(actual, expected, [message])
Tests strict equality, as determined by the strict equality operator ( === )

## assert.notStrictEqual(actual, expected, [message])
Tests strict non-equality, as determined by the strict not equal operator ( !== )

## assert.throws(block, [error], [message])
Expects block to throw an error. error can be constructor, regexp or validation function.

Validate instanceof using constructor:

```javascript
assert.throws(function() { throw new Error("Wrong value"); }, Error);
```

Validate error message using RegExp:

```javascript
assert.throws(function() { throw new Error("Wrong value"); }, /value/);
```

Custom error validation:

```javascript
assert.throws(function() {
    throw new Error("Wrong value");
}, function(err) {
    if ( (err instanceof Error) && /value/.test(err) ) {
        return true;
    }
}, "unexpected error");
```

## assert.doesNotThrow(block, [message])
Expects block not to throw an error, see assert.throws for details.

## assert.ifError(value)
Tests if value is not a false value, throws if it is a true value. Useful when testing the first argument, error in callbacks.
