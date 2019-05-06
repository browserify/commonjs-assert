# assert

> The [`assert`](https://nodejs.org/api/assert.html) module from Node.js, for the browser.

[![Build Status](https://travis-ci.org/browserify/commonjs-assert.svg?branch=master)](https://travis-ci.org/browserify/commonjs-assert)
[![npm](https://img.shields.io/npm/dm/commonjs-assert.svg)](https://www.npmjs.com/package/commonjs-assert)
[![npm](https://img.shields.io/npm/v/commonjs-assert.svg)](https://www.npmjs.com/package/commonjs-assert)

With browserify, simply `require('assert')` or use the `assert` global and you will get this module.

The goal is to provide an API that is as functionally identical to the [Node.js `assert` API](https://nodejs.org/api/assert.html) as possible. Read the [official docs](https://nodejs.org/api/assert.html) for API documentation.

## Install

To use this module directly (without browserify), install it as a dependency:

```
npm install assert
```

## Usage

The goal is to provide an API that is as functionally identical to the [Node.js `assert` API](https://nodejs.org/api/assert.html) as possible. Read the [official docs](https://nodejs.org/api/assert.html) for API documentation.

### Inconsistencies with Node.js `assert`

Due to differences between browsers, some error properties such as `message` and `stack` will be inconsistent. However the assertion behaviour is as close as possible to Node.js and the same error `code` will always be used.

## Contributing

// TODO

## Running Tests

// TODO

## License

MIT © Joyent, Inc. and other Node contributors
