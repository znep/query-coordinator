# Socrata Utils

Utilities that we can share between frontend projects.

## Installation and usage

If you are contributing to this library, run `npm install && bower install` to set up your environment.

To install this library as dependency in another project, run `bower install git@github.com:socrata/frontend-utils.git#master --save`. To update, run the same command.

> **NOTE:** Because we are not yet using Git tags in this project, we can't specify semver ranges in the dependencies hash. This also means that a plain `bower install` will not work for this project; the path to this repo's master branch must be explicitly provided! For similar reasons, `bower update` also doesn't work.

This library depends on [Lodash](https://lodash.com). When using this library as a dependency in another project, you must also include Lodash in your dependencies because it will not be automatically installed by Bower.

To use, add `socrata.utils.js` via script tag or asset pipeline. This library expects Lodash to be loaded already.

This library exposes new capabilities in three ways:

1. Extending prototypes of native JS types
1. Adding new prototypes to global scope
1. Providing functions under a namespace

> **NOTE:** When contributing to this library, exercise caution when using either of the first two techniques! The namespace approach should be preferred in almost all cases.

## Testing

Run `npm test` to execute the test suite.

## Reference

### Extended prototypes

#### String.prototype.escapeSpaces()

Replaces whitespace characters (in the `\s` character class) with Unicode non-breaking space `\u00A0`, which prevents multiple spaces from being collapsed into a single space in HTML contexts.

**Returns**

_(String)_ The string with replaced whitespace characters.

#### String.prototype.format(obj)

Interpolates argument values into the source string and returns the result. Interpolation targets in the source string are wrapped in braces and named (e.g. `{thing}`).

**Arguments**

* `obj` _(Object)_: An object whose keys correspond to the interpolation target names and whose values will be substituted in. Entries whose keys do not correspond to interpolation targets are ignored, and interpolation targets that have no matching entry are not replaced.

**Returns**

_(String)_ The interpolated string.

#### String.prototype.format(args...)

Interpolates argument values into the source string and returns the result. Interpolation targets in the source string are wrapped in braces and numbered (e.g. `{0}`). Negative indices are not supported.

**Arguments**

* `args...` _(*)_: One or more values, provided in the order that corresponds to the interpolation target indices. Extraneous values at indices beyond those used in the source string are ignored, and interpolation targets will not be replaced if values do not exist at the corresponding indices.

**Returns**

_(String)_ The interpolated string.

### New prototypes

#### CustomEvent

A polyfill for [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent), to make up for IE's lack of support for the native constructor. `CustomEvent` is used by our visualizations for cross-browser eventing.

### Namespaced utility functions

All functions below are namespaced under `window.socrata.utils`.

#### assert(expression, message)

Throws an error with the given message if the given expression is not a truthy value.

**Arguments**

* `expression` _(*)_: A value asserted as being truthy.
* `message` _(String)_: An error message to use if the assertion fails.

#### assertEqual(value1, value2)

Throws an error with a standard message if the two given values are not strictly equal.

**Arguments**

* `value1` _(*)_: Any value.
* `value2` _(*)_: Any value.

#### assertHasProperty(object, name, [message])

Throws an error if `_.has` doesn't return `true` for the given property name when checked against the given object.

**Arguments**

* `object` _(Object)_: An object to check.
* `name` _(String)_: A property name asserted as existing on the given object.
* `[message]` _(String)_: An optional error message to use if the assertion fails. A default standard message will be used if this argument is not provided.

#### assertHasProperties(object, args...)

Throws an error with a standard message if `_.has` doesn't return `true` for all of the given property names when checked against the given object.

**Arguments**

* `object` _(Object)_: An object to check.
* `args...` _(String)_: One or more property names asserted as existing on the given object.

#### assertIsOneOfTypes(value, args...)

> **NOTE:** Maybe rename to `assertHasType`?

Throws an error with a standard message if the type of the given value (as reported by `typeof`) does not match any of the given acceptable types.

**Arguments**

* `value` _(*)_: A value to check.
* `args...` _(String)_: One or more types asserted as possible types for the given value.

#### commaify(value, [options])

Adds separators for numerical magnitude groups (thousands, millions, etc.) to the given value.

**Arguments**

* `value` _(Number|String)_: A number or numeric string to format.
* `[options]` _(Object)_: An options object supporting the following keys:
  * `decimalCharacter='.'` _(String)_: the character for delimiting the integer and decimal portions of numbers [which may be affected by localization]
  * `groupCharacter=','` _(String)_: the character for delimiting magnitude groups of numbers [which may be affected by localization]

**Returns**

_(String)_ A representation of the input number with group separators for readability.

#### formatNumber(value, [options])

> **NOTE:** This function needs a more precise name!

Transform a number to a representation with four or fewer alphanumeric characters. The output is not guaranteed to be exactly equivalent to the input, as loss of precision and rounding may occur. Large numbers will be expressed using magnitude group suffixes (K for thousands, M for millions, and so forth).

**Arguments**

* `value` _(Number|String)_: A number or numeric string to format.
* `[options]` _(Object)_: An options object supporting the following keys:
  * `decimalCharacter='.'` _(String)_: the character for delimiting the integer and decimal portions of numbers [which may be affected by localization]
  * `groupCharacter=','` _(String)_: the character for delimiting magnitude groups of numbers [which may be affected by localization]

**Returns**

_(String)_ A condensed-format representation of the input number.

#### valueIsBlank(value)

> **NOTE:** Should probably rename to `isBlank`.

Returns `true` if the given value is not `null`, `undefined`, or the empty string; returns false otherwise.

**Arguments**

* `value` _(*)_: The value to test.

**Returns**

_(Boolean)_ `true` for non-blank values, `false` otherwise.
