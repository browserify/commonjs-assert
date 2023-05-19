// Currently in sync with Node.js test/parallel/test-assert-deep.js
// https://github.com/nodejs/node/commit/1ed3c54ecbd72a33693e5954f86bcc9fd9b1cc09

// [browserify]
// Most `err.message` tests are commented out because they are
// inconsistent between browsers.

'use strict';

const common = require('../common');
const assert = require('../../assert');
const util = require('util');
const { AssertionError } = assert;
const defaultMsgStart = 'Expected values to be strictly deep-equal:\n';
const defaultMsgStartFull = `${defaultMsgStart}+ actual - expected`;

const objectEntries = require('object.entries');

const arrayFromSet = set => {
  const array = [];
  set.forEach(value => array.push(value));

  return array;
};

// Disable colored output to prevent color codes from breaking assertion
// message comparisons. This should only be an issue when process.stdout
// is a TTY.
if (process.stdout && process.stdout.isTTY)
  process.env.NODE_DISABLE_COLORS = '1';

// Allows us to create Sets/Maps from arrays in IE
const createSet = (values = []) => {
  const set = new Set();
  values.forEach(value => set.add(value));

  return set;
};

const createMap = (values = []) => {
  const map = new Map();
  values.forEach(([key, value]) => map.set(key, value));

  return map;
};

// Template tag function turning an error message into a RegExp
// for assert.throws()
function re(literals, ...values) {
  let result = 'Expected values to be loosely deep-equal:\n\n';
  values.forEach((value, i) => {
    const str = util.inspect(value, {
      compact: false,
      depth: 1000,
      customInspect: false,
      maxArrayLength: Infinity,
      breakLength: Infinity,
      sorted: true,
      getters: true
    });
    // Need to escape special characters.
    result += str;
    result += literals[i + 1];
  });
  return {
    code: 'ERR_ASSERTION',
    message: result
  };
}

// The following deepEqual tests might seem very weird.
// They just describe what it is now.
// That is why we discourage using deepEqual in our own tests.

// Turn off no-restricted-properties because we are testing deepEqual!
/* eslint-disable no-restricted-properties */

const arr = new Uint8Array([120, 121, 122, 10]);
const buf = Buffer.from(arr);
// They have different [[Prototype]]
assert.throws(
  () => assert.deepStrictEqual(arr, buf),
  // {
  //   code: 'ERR_ASSERTION',
  //   message: `${defaultMsgStartFull} ... Lines skipped\n\n` +
  //            '+ Uint8Array [\n' +
  //            '- Buffer [Uint8Array] [\n    120,\n...\n    10\n  ]'
  // }
);
assert.deepEqual(arr, buf);

{
  const buf2 = Buffer.from(arr);
  buf2.prop = 1;

  assert.throws(
    () => assert.deepStrictEqual(buf2, buf),
    {
      code: 'ERR_ASSERTION',
    //   message: `${defaultMsgStartFull} ... Lines skipped\n\n` +
    //            '  Buffer [Uint8Array] [\n' +
    //            '    120,\n' +
    //            '...\n' +
    //            '    10,\n' +
    //            '+   prop: 1\n' +
    //            '  ]'
    }
  );
  assert.notDeepEqual(buf2, buf);
}

{
  const arr2 = new Uint8Array([120, 121, 122, 10]);
  arr2.prop = 5;
  assert.throws(
    () => assert.deepStrictEqual(arr, arr2),
    {
      code: 'ERR_ASSERTION',
    //   message: `${defaultMsgStartFull} ... Lines skipped\n\n` +
    //            '  Uint8Array [\n' +
    //            '    120,\n' +
    //            '...\n' +
    //            '    10,\n' +
    //            '-   prop: 5\n' +
    //            '  ]'
    }
  );
  assert.notDeepEqual(arr, arr2);
}

const date = new Date('2016');

class MyDate extends Date {
  constructor(...args) {
    super(...args);
    this[0] = '1';
  }
}

const date2 = new MyDate('2016');

// deepEqual returns true as long as the time are the same,
// but deepStrictEqual checks own properties
assert.notDeepEqual(date, date2);
assert.notDeepEqual(date2, date);
assert.throws(
  () => assert.deepStrictEqual(date, date2),
  {
    code: 'ERR_ASSERTION',
  //   message: `${defaultMsgStartFull}\n\n` +
  //            '+ 2016-01-01T00:00:00.000Z\n- MyDate 2016-01-01T00:00:00.000Z' +
  //            " {\n-   '0': '1'\n- }"
  }
);
assert.throws(
  () => assert.deepStrictEqual(date2, date),
  {
    code: 'ERR_ASSERTION',
  //   message: `${defaultMsgStartFull}\n\n` +
  //            '+ MyDate 2016-01-01T00:00:00.000Z {\n' +
  //            "+   '0': '1'\n+ }\n- 2016-01-01T00:00:00.000Z"
  }
);

class MyRegExp extends RegExp {
  constructor(...args) {
    super(...args);
    this[0] = '1';
  }
}

const re1 = new RegExp('test');
const re2 = new MyRegExp('test');

// deepEqual returns true as long as the regexp-specific properties
// are the same, but deepStrictEqual checks all properties
assert.notDeepEqual(re1, re2);
assert.throws(
  () => assert.deepStrictEqual(re1, re2),
  {
    code: 'ERR_ASSERTION',
  //   message: `${defaultMsgStartFull}\n\n` +
  //            "+ /test/\n- MyRegExp /test/ {\n-   '0': '1'\n- }"
  }
);

// For these weird cases, deepEqual should pass (at least for now),
// but deepStrictEqual should throw.
{
  const similar = createSet([
    { 0: 1 },  // Object
    new String('1'),  // Object
    [1],  // Array
    date2,  // Date with this[0] = '1'
    re2,  // RegExp with this[0] = '1'
    new Int8Array([1]), // Int8Array
    new Int16Array([1]), // Int16Array
    new Uint16Array([1]), // Uint16Array
    new Int32Array([1]), // Int32Array
    new Uint32Array([1]), // Uint32Array
    Buffer.from([1]), // Uint8Array
    (function() { return arguments; })(1)
  ]);

  arrayFromSet(similar).forEach(a => {
    arrayFromSet(similar).forEach(b => {
      if (a !== b) {
        assert.notDeepEqual(a, b);
        assert.throws(
          () => assert.deepStrictEqual(a, b),
          { code: 'ERR_ASSERTION' }
        );
      }
    });
  });
}

function assertDeepAndStrictEqual(a, b) {
  assert.deepEqual(a, b);
  assert.deepStrictEqual(a, b);

  assert.deepEqual(b, a);
  assert.deepStrictEqual(b, a);
}

function assertNotDeepOrStrict(a, b, err) {
  assert.throws(
    () => assert.deepEqual(a, b),
    err || re`${a}\n\nshould equal\n\n${b}`
  );
  assert.throws(
    () => assert.deepStrictEqual(a, b),
    err || { code: 'ERR_ASSERTION' }
  );

  assert.throws(
    () => assert.deepEqual(b, a),
    err || re`${b}\n\nshould equal\n\n${a}`
  );
  assert.throws(
    () => assert.deepStrictEqual(b, a),
    err || { code: 'ERR_ASSERTION' }
  );
}

function assertOnlyDeepEqual(a, b, err) {
  assert.deepEqual(a, b);
  assert.throws(
    () => assert.deepStrictEqual(a, b),
    err || { code: 'ERR_ASSERTION' }
  );

  assert.deepEqual(b, a);
  assert.throws(
    () => assert.deepStrictEqual(b, a),
    err || { code: 'ERR_ASSERTION' }
  );
}

// es6 Maps and Sets
assertDeepAndStrictEqual(createSet(), createSet());
assertDeepAndStrictEqual(createMap(), createMap());

assertDeepAndStrictEqual(createSet([1, 2, 3]), createSet([1, 2, 3]));
assertNotDeepOrStrict(createSet([1, 2, 3]), createSet([1, 2, 3, 4]));
assertNotDeepOrStrict(createSet([1, 2, 3, 4]), createSet([1, 2, 3]));
assertDeepAndStrictEqual(createSet(['1', '2', '3']), createSet(['1', '2', '3']));
assertDeepAndStrictEqual(createSet([[1, 2], [3, 4]]), createSet([[3, 4], [1, 2]]));
assertNotDeepOrStrict(createSet([{ a: 0 }]), createSet([{ a: 1 }]));
if (common.symbolSupported) {
  assertNotDeepOrStrict(createSet([Symbol()]), createSet([Symbol()]));
}

{
  const a = [ 1, 2 ];
  const b = [ 3, 4 ];
  const c = [ 1, 2 ];
  const d = [ 3, 4 ];

  assertDeepAndStrictEqual(
    { a: a, b: b, s: createSet([a, b]) },
    { a: c, b: d, s: createSet([d, c]) }
  );
}

assertDeepAndStrictEqual(createMap([[1, 1], [2, 2]]), createMap([[1, 1], [2, 2]]));
assertDeepAndStrictEqual(createMap([[1, 1], [2, 2]]), createMap([[2, 2], [1, 1]]));
assertNotDeepOrStrict(createMap([[1, 1], [2, 2]]), createMap([[1, 2], [2, 1]]));
assertNotDeepOrStrict(
  createMap([[[1], 1], [{}, 2]]),
  createMap([[[1], 2], [{}, 1]])
);

assertNotDeepOrStrict(createSet([1]), [1]);
assertNotDeepOrStrict(createSet(), []);
assertNotDeepOrStrict(createSet(), {});

assertNotDeepOrStrict(createMap([['a', 1]]), { a: 1 });
assertNotDeepOrStrict(createMap(), []);
assertNotDeepOrStrict(createMap(), {});

assertOnlyDeepEqual(createSet(['1']), createSet([1]));

assertOnlyDeepEqual(createMap([['1', 'a']]), createMap([[1, 'a']]));
assertOnlyDeepEqual(createMap([['a', '1']]), createMap([['a', 1]]));
assertNotDeepOrStrict(createMap([['a', '1']]), createMap([['a', 2]]));

assertDeepAndStrictEqual(createSet([{}]), createSet([{}]));

// Ref: https://github.com/nodejs/node/issues/13347
assertNotDeepOrStrict(
  createSet([{ a: 1 }, { a: 1 }]),
  createSet([{ a: 1 }, { a: 2 }])
);
assertNotDeepOrStrict(
  createSet([{ a: 1 }, { a: 1 }, { a: 2 }]),
  createSet([{ a: 1 }, { a: 2 }, { a: 2 }])
);
assertNotDeepOrStrict(
  createMap([[{ x: 1 }, 5], [{ x: 1 }, 5]]),
  createMap([[{ x: 1 }, 5], [{ x: 2 }, 5]])
);

assertNotDeepOrStrict(createSet([3, '3']), createSet([3, 4]));
assertNotDeepOrStrict(createMap([[3, 0], ['3', 0]]), createMap([[3, 0], [4, 0]]));

assertNotDeepOrStrict(
  createSet([{ a: 1 }, { a: 1 }, { a: 2 }]),
  createSet([{ a: 1 }, { a: 2 }, { a: 2 }])
);

// Mixed primitive and object keys
assertDeepAndStrictEqual(
  createMap([[1, 'a'], [{}, 'a']]),
  createMap([[1, 'a'], [{}, 'a']])
);
assertDeepAndStrictEqual(
  createSet([1, 'a', [{}, 'a']]),
  createSet([1, 'a', [{}, 'a']])
);

// This is an awful case, where a map contains multiple equivalent keys:
assertOnlyDeepEqual(
  createMap([[1, 'a'], ['1', 'b']]),
  createMap([['1', 'a'], [true, 'b']])
);
assertNotDeepOrStrict(
  createSet(['a']),
  createSet(['b'])
);
assertDeepAndStrictEqual(
  createMap([[{}, 'a'], [{}, 'b']]),
  createMap([[{}, 'b'], [{}, 'a']])
);
assertOnlyDeepEqual(
  createMap([[true, 'a'], ['1', 'b'], [1, 'a']]),
  createMap([['1', 'a'], [1, 'b'], [true, 'a']])
);
assertNotDeepOrStrict(
  createMap([[true, 'a'], ['1', 'b'], [1, 'c']]),
  createMap([['1', 'a'], [1, 'b'], [true, 'a']])
);

// Similar object keys
assertNotDeepOrStrict(
  createSet([{}, {}]),
  createSet([{}, 1])
);
assertNotDeepOrStrict(
  createSet([[{}, 1], [{}, 1]]),
  createSet([[{}, 1], [1, 1]])
);
assertNotDeepOrStrict(
  createMap([[{}, 1], [{}, 1]]),
  createMap([[{}, 1], [1, 1]])
);
assertOnlyDeepEqual(
  createMap([[{}, 1], [true, 1]]),
  createMap([[{}, 1], [1, 1]])
);

// Similar primitive key / values
assertNotDeepOrStrict(
  createSet([1, true, false]),
  createSet(['1', 0, '0'])
);
assertNotDeepOrStrict(
  createMap([[1, 5], [true, 5], [false, 5]]),
  createMap([['1', 5], [0, 5], ['0', 5]])
);

// Undefined value in Map
assertDeepAndStrictEqual(
  createMap([[1, undefined]]),
  createMap([[1, undefined]])
);
assertOnlyDeepEqual(
  createMap([[1, null], ['', '0']]),
  createMap([['1', undefined], [false, 0]])
);
assertNotDeepOrStrict(
  createMap([[1, undefined]]),
  createMap([[2, undefined]])
);

// null as key
assertDeepAndStrictEqual(
  createMap([[null, 3]]),
  createMap([[null, 3]])
);

if (common.bigIntSupported) {
  assertOnlyDeepEqual(
    createMap([[undefined, null], eval("['+000', 2n]")]),
    createMap([[null, undefined], [false, '2']]),
  );

  assertOnlyDeepEqual(
    createSet(eval("[null, '', 1n, 5, 2n, false]")),
    createSet(eval("[undefined, 0, 5n, true, '2', '-000']"))
  );
}

assertNotDeepOrStrict(
  createSet(['']),
  createSet(['0'])
);
assertOnlyDeepEqual(
  createMap([[1, {}]]),
  createMap([[true, {}]])
);
assertOnlyDeepEqual(
  createMap([[undefined, true]]),
  createMap([[null, true]])
);
assertNotDeepOrStrict(
  createMap([[undefined, true]]),
  createMap([[true, true]])
);

// GH-6416. Make sure circular refs don't throw.
{
  const b = {};
  b.b = b;
  const c = {};
  c.b = c;

  assertDeepAndStrictEqual(b, c);

  const d = {};
  d.a = 1;
  d.b = d;
  const e = {};
  e.a = 1;
  e.b = {};

  assertNotDeepOrStrict(d, e);
}

// GH-14441. Circular structures should be consistent
{
  const a = {};
  const b = {};
  a.a = a;
  b.a = {};
  b.a.a = a;
  assertDeepAndStrictEqual(a, b);
}

{
  const a = createSet();
  const b = createSet();
  const c = createSet();
  a.add(a);
  b.add(b);
  c.add(a);
  assertDeepAndStrictEqual(b, c);
}

// https://github.com/nodejs/node-v0.x-archive/pull/7178
// Ensure reflexivity of deepEqual with `arguments` objects.
{
  const args = (function() { return arguments; })();
  assertNotDeepOrStrict([], args);
}

// More checking that arguments objects are handled correctly
{
  // eslint-disable-next-line func-style
  const returnArguments = function() { return arguments; };

  const someArgs = returnArguments('a');
  const sameArgs = returnArguments('a');
  const diffArgs = returnArguments('b');

  assertNotDeepOrStrict(someArgs, ['a']);
  assertNotDeepOrStrict(someArgs, { '0': 'a' });
  assertNotDeepOrStrict(someArgs, diffArgs);
  assertDeepAndStrictEqual(someArgs, sameArgs);
}

{
  const values = [
    123,
    Infinity,
    0,
    null,
    undefined,
    false,
    true,
    {},
    [],
    () => {},
  ];
  assertDeepAndStrictEqual(createSet(values), createSet(values));
  assertDeepAndStrictEqual(createSet(values), createSet(values.reverse()));

  const mapValues = values.map((v) => [v, { a: 5 }]);
  assertDeepAndStrictEqual(createMap(mapValues), createMap(mapValues));
  assertDeepAndStrictEqual(createMap(mapValues), createMap(mapValues.reverse()));
}

{
  const s1 = createSet();
  const s2 = createSet();
  s1.add(1);
  s1.add(2);
  s2.add(2);
  s2.add(1);
  assertDeepAndStrictEqual(s1, s2);
}

{
  const m1 = createMap();
  const m2 = createMap();
  const obj = { a: 5, b: 6 };
  m1.set(1, obj);
  m1.set(2, 'hi');
  m1.set(3, [1, 2, 3]);

  m2.set(2, 'hi'); // different order
  m2.set(1, obj);
  m2.set(3, [1, 2, 3]); // Deep equal, but not reference equal.

  assertDeepAndStrictEqual(m1, m2);
}

{
  const m1 = createMap();
  const m2 = createMap();

  // m1 contains itself.
  m1.set(1, m1);
  m2.set(1, createMap());

  assertNotDeepOrStrict(m1, m2);
}

{
  const map1 = createMap([[1, 1]]);
  const map2 = createMap([[1, '1']]);
  assert.deepEqual(map1, map2);
  assert.throws(
    () => assert.deepStrictEqual(map1, map2),
    {
      code: 'ERR_ASSERTION',
    //   message: `${defaultMsgStartFull}\n\n` +
    //            "  Map {\n+   1 => 1\n-   1 => '1'\n  }"
    }
  );
}

{
  // Two equivalent sets / maps with different key/values applied shouldn't be
  // the same. This is a terrible idea to do in practice, but deepEqual should
  // still check for it.
  const s1 = createSet();
  const s2 = createSet();
  s1.x = 5;
  assertNotDeepOrStrict(s1, s2);

  const m1 = createMap();
  const m2 = createMap();
  m1.x = 5;
  assertNotDeepOrStrict(m1, m2);
}

{
  // Circular references.
  const s1 = createSet();
  s1.add(s1);
  const s2 = createSet();
  s2.add(s2);
  assertDeepAndStrictEqual(s1, s2);

  const m1 = createMap();
  m1.set(2, m1);
  const m2 = createMap();
  m2.set(2, m2);
  assertDeepAndStrictEqual(m1, m2);

  const m3 = createMap();
  m3.set(m3, 2);
  const m4 = createMap();
  m4.set(m4, 2);
  assertDeepAndStrictEqual(m3, m4);
}

// Handle sparse arrays.
{
  assertDeepAndStrictEqual([1, , , 3], [1, , , 3]);
  assertNotDeepOrStrict([1, , , 3], [1, , , 3, , , ]);
  const a = new Array(3);
  const b = new Array(3);
  a[2] = true;
  b[1] = true;
  assertNotDeepOrStrict(a, b);
  b[2] = true;
  assertNotDeepOrStrict(a, b);
  a[0] = true;
  assertNotDeepOrStrict(a, b);
}

// Handle different error messages
{
  const err1 = new Error('foo1');
  assertNotDeepOrStrict(err1, new Error('foo2'), assert.AssertionError);
  assertNotDeepOrStrict(err1, new TypeError('foo1'), assert.AssertionError);
  // [browserify] Objects will not be strictly equal in some browsers due to
  // different `line`/`column` properties
  // assertDeepAndStrictEqual(err1, new Error('foo1'));
  assertNotDeepOrStrict(err1, {}, AssertionError);
}

// Handle NaN
assert.notDeepEqual(NaN, NaN);
assert.deepStrictEqual(NaN, NaN);
assert.deepStrictEqual({ a: NaN }, { a: NaN });
assert.deepStrictEqual([ 1, 2, NaN, 4 ], [ 1, 2, NaN, 4 ]);

// Handle boxed primitives
if (common.symbolSupported) {
  const boxedString = new String('test');
  const boxedSymbol = Object(Symbol());
  assertNotDeepOrStrict(new Boolean(true), Object(false));
  assertNotDeepOrStrict(Object(true), new Number(1));
  assertNotDeepOrStrict(new Number(2), new Number(1));
  assertNotDeepOrStrict(boxedSymbol, Object(Symbol()));
  assertNotDeepOrStrict(boxedSymbol, {});
  assertDeepAndStrictEqual(boxedSymbol, boxedSymbol);
  assertDeepAndStrictEqual(Object(true), Object(true));
  assertDeepAndStrictEqual(Object(2), Object(2));
  assertDeepAndStrictEqual(boxedString, Object('test'));
  boxedString.slow = true;
  assertNotDeepOrStrict(boxedString, Object('test'));
  boxedSymbol.slow = true;
  assertNotDeepOrStrict(boxedSymbol, {});
}

// Minus zero
assertOnlyDeepEqual(0, -0);
assertDeepAndStrictEqual(-0, -0);

// Handle symbols (enumerable only)
if (common.symbolSupported) {
  const symbol1 = Symbol();
  const obj1 = { [symbol1]: 1 };
  const obj2 = { [symbol1]: 1 };
  const obj3 = { [Symbol()]: 1 };
  // Add a non enumerable symbol as well. It is going to be ignored!
  Object.defineProperty(obj2, Symbol(), { value: 1 });
  assertOnlyDeepEqual(obj1, obj3);
  assertDeepAndStrictEqual(obj1, obj2);
  obj2[Symbol()] = true;
  assertOnlyDeepEqual(obj1, obj2);
  // TypedArrays have a fast path. Test for this as well.
  const a = new Uint8Array(4);
  const b = new Uint8Array(4);
  a[symbol1] = true;
  b[symbol1] = false;
  assertNotDeepOrStrict(a, b);
  b[symbol1] = true;
  assertDeepAndStrictEqual(a, b);
  // The same as TypedArrays is valid for boxed primitives
  const boxedStringA = new String('test');
  const boxedStringB = new String('test');
  boxedStringA[symbol1] = true;
  assertOnlyDeepEqual(boxedStringA, boxedStringB);
  boxedStringA[symbol1] = true;
  assertDeepAndStrictEqual(a, b);
}

assert.deepEqual(new Date(2000, 3, 14), new Date(2000, 3, 14));

assert.throws(() => { assert.deepEqual(new Date(), new Date(2000, 3, 14)); },
              AssertionError,
              'deepEqual(new Date(), new Date(2000, 3, 14))');

assert.throws(
  () => { assert.notDeepEqual(new Date(2000, 3, 14), new Date(2000, 3, 14)); },
  AssertionError,
  'notDeepEqual(new Date(2000, 3, 14), new Date(2000, 3, 14))'
);

assert.throws(
  () => { assert.notDeepEqual(common.repeat('a', 1024), common.repeat('a', 1024)); },
  AssertionError,
  'notDeepEqual("a".repeat(1024), "a".repeat(1024))'
);

assert.notDeepEqual(new Date(), new Date(2000, 3, 14));

assertDeepAndStrictEqual(/a/, /a/);
assertDeepAndStrictEqual(/a/g, /a/g);
assertDeepAndStrictEqual(/a/i, /a/i);
assertDeepAndStrictEqual(/a/m, /a/m);
assertDeepAndStrictEqual(/a/igm, /a/igm);
assertNotDeepOrStrict(/ab/, /a/);
assertNotDeepOrStrict(/a/g, /a/);
assertNotDeepOrStrict(/a/i, /a/);
assertNotDeepOrStrict(/a/m, /a/);
assertNotDeepOrStrict(/a/igm, /a/im);

{
  const re1 = /a/g;
  re1.lastIndex = 3;
  assert.deepEqual(re1, /a/g);
}

assert.deepEqual(4, '4');
assert.deepEqual(true, 1);
assert.throws(() => assert.deepEqual(4, '5'),
              AssertionError,
              'deepEqual( 4, \'5\')');

// Having the same number of owned properties && the same set of keys.
assert.deepEqual({ a: 4 }, { a: 4 });
assert.deepEqual({ a: 4, b: '2' }, { a: 4, b: '2' });
assert.deepEqual([4], ['4']);
assert.throws(
  () => assert.deepEqual({ a: 4 }, { a: 4, b: true }), AssertionError);
assert.notDeepEqual(['a'], { 0: 'a' });
assert.deepEqual({ a: 4, b: '1' }, { b: '1', a: 4 });
const a1 = [1, 2, 3];
const a2 = [1, 2, 3];
a1.a = 'test';
a1.b = true;
a2.b = true;
a2.a = 'test';
assert.throws(() => assert.deepEqual(Object.keys(a1), Object.keys(a2)),
              AssertionError);
assert.deepEqual(a1, a2);

// Having an identical prototype property.
const nbRoot = {
  toString() { return `${this.first} ${this.last}`; }
};

function nameBuilder(first, last) {
  this.first = first;
  this.last = last;
  return this;
}
nameBuilder.prototype = nbRoot;

function nameBuilder2(first, last) {
  this.first = first;
  this.last = last;
  return this;
}
nameBuilder2.prototype = nbRoot;

const nb1 = new nameBuilder('Ryan', 'Dahl');
let nb2 = new nameBuilder2('Ryan', 'Dahl');

assert.deepEqual(nb1, nb2);

nameBuilder2.prototype = Object;
nb2 = new nameBuilder2('Ryan', 'Dahl');
assert.deepEqual(nb1, nb2);

// Primitives
assertNotDeepOrStrict(null, {});
assertNotDeepOrStrict(undefined, {});
assertNotDeepOrStrict('a', ['a']);
assertNotDeepOrStrict('a', { 0: 'a' });
assertNotDeepOrStrict(1, {});
assertNotDeepOrStrict(true, {});
if (common.symbolSupported) {
  assertNotDeepOrStrict(Symbol(), {});
  assertNotDeepOrStrict(Symbol(), Symbol());
}

assertOnlyDeepEqual(4, '4');
assertOnlyDeepEqual(true, 1);

if (common.symbolSupported) {
  const s = Symbol();
  assertDeepAndStrictEqual(s, s);
}

// Primitive wrappers and object.
assertNotDeepOrStrict(new String('a'), ['a']);
assertNotDeepOrStrict(new String('a'), { 0: 'a' });
assertNotDeepOrStrict(new Number(1), {});
assertNotDeepOrStrict(new Boolean(true), {});

// Same number of keys but different key names.
assertNotDeepOrStrict({ a: 1 }, { b: 1 });

assert.deepStrictEqual(new Date(2000, 3, 14), new Date(2000, 3, 14));

assert.throws(
  () => assert.deepStrictEqual(new Date(), new Date(2000, 3, 14)),
  AssertionError,
  'deepStrictEqual(new Date(), new Date(2000, 3, 14))'
);

assert.throws(
  () => assert.notDeepStrictEqual(new Date(2000, 3, 14), new Date(2000, 3, 14)),
  {
    name: 'AssertionError',
    // message: 'Expected "actual" not to be strictly deep-equal to: ' +
    //          util.inspect(new Date(2000, 3, 14))
  }
);

assert.notDeepStrictEqual(new Date(), new Date(2000, 3, 14));

assert.throws(
  () => assert.deepStrictEqual(/ab/, /a/),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n+ /ab/\n- /a/`
  });
assert.throws(
  () => assert.deepStrictEqual(/a/g, /a/),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n+ /a/g\n- /a/`
  });
assert.throws(
  () => assert.deepStrictEqual(/a/i, /a/),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n+ /a/i\n- /a/`
  });
assert.throws(
  () => assert.deepStrictEqual(/a/m, /a/),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n+ /a/m\n- /a/`
  });
assert.throws(
  () => assert.deepStrictEqual(/a/igm, /a/im),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n+ /a/gim\n- /a/im\n     ^`
  });

{
  const re1 = /a/;
  re1.lastIndex = 3;
  assert.deepStrictEqual(re1, /a/);
}

assert.throws(
  () => assert.deepStrictEqual(4, '4'),
  // { message: `${defaultMsgStart}\n4 !== '4'\n` }
);

assert.throws(
  () => assert.deepStrictEqual(true, 1),
  // { message: `${defaultMsgStart}\ntrue !== 1\n` }
);

// Having the same number of owned properties && the same set of keys.
assert.deepStrictEqual({ a: 4 }, { a: 4 });
assert.deepStrictEqual({ a: 4, b: '2' }, { a: 4, b: '2' });
assert.throws(() => assert.deepStrictEqual([4], ['4']),
              {
                code: 'ERR_ASSERTION',
                name: 'AssertionError',
                // message: `${defaultMsgStartFull}\n\n  [\n+   4\n-   '4'\n  ]`
              });
assert.throws(
  () => assert.deepStrictEqual({ a: 4 }, { a: 4, b: true }),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n  ` +
    //          '{\n    a: 4,\n-   b: true\n  }'
  });
assert.throws(
  () => assert.deepStrictEqual(['a'], { 0: 'a' }),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n` +
    //          "+ [\n+   'a'\n+ ]\n- {\n-   '0': 'a'\n- }"
  });

/* eslint-enable */

assert.deepStrictEqual({ a: 4, b: '1' }, { b: '1', a: 4 });

assert.throws(
  () => assert.deepStrictEqual([0, 1, 2, 'a', 'b'], [0, 1, 2, 'b', 'a']),
  AssertionError);

assert.deepStrictEqual(a1, a2);

// Prototype check.
function Constructor1(first, last) {
  this.first = first;
  this.last = last;
}

function Constructor2(first, last) {
  this.first = first;
  this.last = last;
}

const obj1 = new Constructor1('Ryan', 'Dahl');
let obj2 = new Constructor2('Ryan', 'Dahl');

assert.throws(() => assert.deepStrictEqual(obj1, obj2), AssertionError);

Constructor2.prototype = Constructor1.prototype;
obj2 = new Constructor2('Ryan', 'Dahl');

assert.deepStrictEqual(obj1, obj2);

// Check extra properties on errors.
{
  const a = new TypeError('foo');
  const b = new TypeError('foo');
  a.foo = 'bar';
  b.foo = 'baz';

  assert.throws(
    () => assert.deepStrictEqual(a, b),
    // {
    //   message: `${defaultMsgStartFull}\n\n` +
    //            '  [TypeError: foo] {\n+   foo: \'bar\'\n-   foo: \'baz\'\n  }'
    // }
  );
}

// Check proxies.
{
  // TODO(BridgeAR): Check if it would not be better to detect proxies instead
  // of just using the proxy value.
  if (typeof Proxy !== 'undefined') {
    const arrProxy = new Proxy([1, 2], {});
    assert.deepStrictEqual(arrProxy, [1, 2]);
    const tmp = util.inspect.defaultOptions;
    util.inspect.defaultOptions = { showProxy: true };
    assert.throws(
      () => assert.deepStrictEqual(arrProxy, [1, 2, 3]),
      // { message: `${defaultMsgStartFull}\n\n` +
      //            '  [\n    1,\n    2,\n-   3\n  ]' }
    );
    util.inspect.defaultOptions = tmp;
  }

  // [browserify] Safari fails this test due to the proxy. Chrome and Firefox pass.
  // const invalidTrap = new Proxy([1, 2, 3], {
  //   ownKeys() { return []; }
  // });
  // assert.throws(
  //   () => assert.deepStrictEqual(invalidTrap, [1, 2, 3]),
  //   {
  //     name: 'TypeError',
  //     // message: "'ownKeys' on proxy: trap result did not include 'length'"
  //   }
  // );
}

// Strict equal with identical objects that are not identical
// by reference and longer than 30 elements
// E.g., assert.deepStrictEqual({ a: Symbol() }, { a: Symbol() })
if (common.symbolSupported) {
  const a = {};
  const b = {};
  for (let i = 0; i < 35; i++) {
    a[`symbol${i}`] = Symbol();
    b[`symbol${i}`] = Symbol();
  }

  assert.throws(
    () => assert.deepStrictEqual(a, b),
    {
      code: 'ERR_ASSERTION',
      name: 'AssertionError',
      // message: /\.\.\./g
    }
  );
}

// Basic valueOf check.
{
  const a = new String(1);
  a.valueOf = undefined;
  assertNotDeepOrStrict(a, new String(1));
}

// Basic array out of bounds check.
{
  const arr = [1, 2, 3];
  arr[2 ** 32] = true;
  assertNotDeepOrStrict(arr, [1, 2, 3]);
}

assert.throws(
  () => assert.deepStrictEqual([1, 2, 3], [1, 2]),
  {
    code: 'ERR_ASSERTION',
    name: 'AssertionError',
    // message: `${defaultMsgStartFull}\n\n` +
            // '  [\n' +
            // '    1,\n' +
            // '    2,\n' +
            // '+   3\n' +
            // '  ]'
  }
);

// Verify that manipulating the `getTime()` function has no impact on the time
// verification.
{
  const a = new Date('2000');
  const b = new Date('2000');
  Object.defineProperty(a, 'getTime', {
    value: () => 5
  });
  assert.deepStrictEqual(a, b);
}

// Verify that extra keys will be tested for when using fake arrays.
if (common.symbolToStringTagSupported) {
  const a = {
    0: 1,
    1: 1,
    2: 'broken'
  };
  Object.setPrototypeOf(a, Object.getPrototypeOf([]));
  Object.defineProperty(a, Symbol.toStringTag, {
    value: 'Array',
  });
  Object.defineProperty(a, 'length', {
    value: 2
  });
  assert.notDeepStrictEqual(a, [1, 1]);
}

// Verify that changed tags will still check for the error message.
if (common.symbolToStringTagSupported) {
  const err = new Error('foo');
  err[Symbol.toStringTag] = 'Foobar';
  const err2 = new Error('bar');
  err2[Symbol.toStringTag] = 'Foobar';
  assertNotDeepOrStrict(err, err2, AssertionError);
}

// Check for non-native errors.
if (common.symbolToStringTagSupported) {
  const source = new Error('abc');
  const err = Object.create(
    Object.getPrototypeOf(source), common.getOwnPropertyDescriptors(source));
  Object.defineProperty(err, 'message', { value: 'foo' });
  const err2 = Object.create(
    Object.getPrototypeOf(source), common.getOwnPropertyDescriptors(source));
  Object.defineProperty(err2, 'message', { value: 'bar' });
  err[Symbol.toStringTag] = 'Foo';
  err2[Symbol.toStringTag] = 'Foo';
  assert.notDeepStrictEqual(err, err2);
}

// Verify that `valueOf` is not called for boxed primitives.
{
  const a = new Number(5);
  const b = new Number(5);
  Object.defineProperty(a, 'valueOf', {
    value: () => { throw new Error('failed'); }
  });
  Object.defineProperty(b, 'valueOf', {
    value: () => { throw new Error('failed'); }
  });
  assertDeepAndStrictEqual(a, b);
}

// Check getters.
{
  const a = {
    get a() { return 5; }
  };
  const b = {
    get a() { return 6; }
  };
  assert.throws(
    () => assert.deepStrictEqual(a, b),
    {
      code: 'ERR_ASSERTION',
      name: 'AssertionError',
      // message: /a: \[Getter: 5]\n-   a: \[Getter: 6]\n  /
    }
  );

  // The descriptor is not compared.
  assertDeepAndStrictEqual(a, { a: 5 });
}
