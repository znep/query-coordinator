# JS Utils

Collection of helper functions. Please have a discussion before adding to them. There
may be a more logical home for your helper already.

*WARNING!* Extends the String prototype.

### Extended prototypes

#### String.prototype.escapeSpaces()

Replaces whitespace characters (in the `\s` character class) with Unicode non-breaking
space `\u00A0`, which prevents multiple spaces from being collapsed into a single space
in HTML contexts.

**Returns**

_(String)_ The string with replaced whitespace characters.

#### String.prototype.format(obj)

Interpolates argument values into the source string and returns the result. Interpolation targets
in the source string are wrapped in braces and named (e.g. `{thing}`).

**Arguments**

* `obj` _(Object)_: An object whose keys correspond to the interpolation target names and whose
* values will be substituted in. Entries whose keys do not correspond to interpolation targets
* are ignored, and interpolation targets that have no matching entry are not replaced.

**Returns**

_(String)_ The interpolated string.

#### String.prototype.format(args...)

Interpolates argument values into the source string and returns the result. Interpolation targets
in the source string are wrapped in braces and numbered (e.g. `{0}`). Negative indices are not
supported.

**Arguments**

* `args...` _(*)_: One or more values, provided in the order that corresponds to the interpolation
target indices. Extraneous values at indices beyond those used in the source string are ignored,
and interpolation targets will not be replaced if values do not exist at the corresponding indices.

**Returns**

_(String)_ The interpolated string.

### New prototypes

#### CustomEvent

A polyfill for [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent), to
make up for IE's lack of support for the native constructor. `CustomEvent` is used by our
visualizations for cross-browser eventing.

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

Throws an error if `_.has` doesn't return `true` for the given property name when checked against
the given object.

**Arguments**

* `object` _(Object)_: An object to check.
* `name` _(String)_: A property name asserted as existing on the given object.
* `[message]` _(String)_: An optional error message to use if the assertion fails. A default standard message will be used if this argument is not provided.

#### assertHasProperties(object, args...)

Throws an error with a standard message if `_.has` doesn't return `true` for all of the given
property names when checked against the given object.

**Arguments**

* `object` _(Object)_: An object to check.
* `args...` _(String)_: One or more property names asserted as existing on the given object.

#### assertIsOneOfTypes(value, args...)

> **NOTE:** Maybe rename to `assertHasType`?

Throws an error with a standard message if the type of the given value (as reported by `typeof`)
does not match any of the given acceptable types.

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

#### getCurrency(locale)

Gets currency name used while formatting numbers for given locale.

**Arguments**

* `locale` _(String)_: A locale for which to find currency name. (e.g. `en`)

**Returns**

_(String)_ Currency name corresponding to given locale, defaults to `USD`.

#### getGroupCharacter(locale)

Gets grouping character used while formatting numbers for given locale.

**Arguments**

* `locale` _(String)_: A locale for which to find grouping character. (e.g. `en`)

**Returns**

_(String)_ Grouping character corresponding to given locale, defaults to `comma (,)`.

#### getDecimalCharacter(locale)

Gets decimal character used while formatting numbers for given locale.

**Arguments**

* `locale` _(String)_: A locale for which to find decimal character. (e.g. `en`)

**Returns**

_(String)_ Decimal character corresponding to given locale, defaults to `period (.)`.

#### getLocale(global)

Gets locale from a global object (usually window). Looks for `serverConfig.locale`, `blist.locale` and `socrataConfig.locales.currentLocale` respectively.

**Arguments**

* `global` _(Object)_: Global object from which to get locale

**Returns**

_(String)_ Current locale read from given global object, defaults to `en`.

#### formatNumber(value, [options])

> **NOTE:** This function needs a more precise name!

Transform a number to a representation with four or fewer alphanumeric characters. The output
is not guaranteed to be exactly equivalent to the input, as loss of precision and rounding may
occur. Large numbers will be expressed using magnitude group suffixes (K for thousands, M for
millions, and so forth).

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

#### parseJsonOrEmpty(json)

Returns an empty Object if the given JSON is not parseable; returns the parsed JSON otherwise.

**Arguments**

* `json` _(String)_: The json to parse.

**Returns**

_(Object)_ Empty object if JSON is unparseable, parsed JSON object otherwise.
