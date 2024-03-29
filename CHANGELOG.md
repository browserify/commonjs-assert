# assert change log

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## 2.1.0

* [New] Implement `assert.match()` and `assert.doesNotMatch()`
* [Refactor] switching to a maintained Object.assign package
* [readme] Add description for usage with webpack and vite (#60)
* [readme] Remove duplicate line under usage section (#48)
* [Deps] update `is-nan`, `object-is`, `util`
* [Dev Deps] update `@babel/cli`, `@babel/core`, `@babel/preset-env`, `airtap`, `core-js`, `cross-eng`, `object.entries`, `object.getownpropertydescriptors`, `tape`

## 2.0.0

* Sync with Node.js master. ([@lukechilds](https://github.com/lukechilds) in [#44](https://github.com/browserify/commonjs-assert/pull/44))

**Note:** Support for IE9 and IE10 has been dropped. IE11 is still supported.

## 1.5.1
* [Deps] switch to `object.assign`, and unpin `util`

## 1.5.0
* Add strict mode APIs. ([@lukechilds](https://github.com/lukechilds) in [#41](https://github.com/browserify/commonjs-assert/pull/41))
