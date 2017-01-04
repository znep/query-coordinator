# Socrata Utils

Useful utility functions and modules that we can share between different projects such as `frontend`, `storyteller`, `socrata_site_chrome`, `frontend-visualizations`, etc.

## Installation and usage

The `socrata-utils` package is available in the artifactory npm registry.
> Note that in github it the project is called `frontend-utils`.

To configure `npm` to use the appropriate registry, run the following command:

    npm config set registry https://socrata.artifactoryonline.com/socrata/api/npm/npm-virtual

Then install using npm:

    npm install --save socrata-utils

The `npm` distribution includes a `dist` folder with `socrata.utils.js`. It should be included
on the page using `script` tag or using your favorite client-side build system.

This library depends on [Lodash](https://lodash.com). When using this library as a dependency
in another project, you must also include Lodash in your dependencies because it will not be
automatically installed.

This library exposes new capabilities in three ways:

1. Extending prototypes of native JS types
1. Adding new prototypes to global scope
1. Providing functions under a namespace

> **NOTE:** When contributing to this library, exercise caution when using either of the first
> two techniques! The namespace approach should be preferred in almost all cases.

## Testing locally with npm link

If you're developing locally and want to try out your changes using another project, say the `frontend` for example, you can use `npm link` to link your work with the project you're testing it in. For example, do link this package with the `frontend` you'd do something like this:

    cd frontend-utils
    npm link
    cd ../frontend
    npm link socrata-utils

#### Command Quick Index

- `npm run test` to run the tests ("npm test" also works).
- `npm run watch` to automatically run the tests when files change. The tests can be debugged in
  a browser by visiting [http://localhost:9876/debug.html](http://localhost:9876/debug.html).
- `npm run build` to run webpack and generate output files in `dist`.
- `npm run release` to tag and publish a new version to the npm registry (after bumping the
  version in `package.json`).

## Contributing

If you are contributing to this library, run `npm install` to set up your environment.

## Reference

### Feature flags

Support for feature flags requires that `window.socrata.featureFlags` be
defined at page load time. This is expected to be a simple object
containing keys for all defined feature flags. The purpose of this module is
provide validation of requested feature flag keys.

Usage example:

    import { FeatureFlags } from 'socrata-utils';
    console.log('useAuth0 = ' + FeatureFlags.value('useAuth0'));

#### In tests

In tests, the FeatureFlags module provides a test fixture and means over providing
test-specific override values for one or more feature flags.

Usage example:

```javascript
import { FeatureFlags } from 'socrata-utils';
describe('FeatureFlags', function() {
  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('should return the value for feature flag', function() {
    expect(FeatureFlags.value('useAuth0')).to.equal(false);
  });

  it('allows values to be overridden in the test fixture', function() {
    FeatureFlags.useTestFixture({ useAuth0: true });
    expect(FeatureFlags.value('useAuth0')).to.equal(true);
  });
});
```

#### Example featureFlag JSON data expected to be on window.

```json
featureFlags: {
    "allowDataLensOwnerChange": true,
    "auth0Social": false,
    "browseAutocomplete": false,
    "bubble": "old",
    "ceteraProfileSearch": false,
    "ceteraSearch": true,
    "createV2DataLens": true,
    "currentPageMetadataVersion": 1,
    "dataLensTransitionState": "post_beta",
    "debugDataLens": false,
    "debugLabjs": false,
    "disableAuthorityBadge": "none",
    "disableLegacyTypes": false,
    "disableNbeRedirectionWarningMessage": false,
    "disableObeRedirection": false,
    "disableSiteChromeHeaderFooterOnDataslatePages": false,
    "displayDatasetLandingPageNotice": false,
    "displayDatasetLandingPagePreviewImages": false,
    "embetterAnalyticsBrowserViewsOnly": false,
    "embetterAnalyticsPage": false,
    "enableApiFoundryPane": false,
    "enableCatalogConnector": true,
    "enableDataLensPageMetadataMigrations": true,
    "enableDataLensProvenance": true,
    "enableDatasetLandingPageTour": true,
    "enableDatasetManagementUi": false,
    "enableEmbedWidgetForNbe": false,
    "enableIngressGeometryTypes": false,
    "enableNewAccountVerificationEmail": false,
    "enableOpendataGaTracking": null,
    "enablePulse": false,
    "enableStandardGaTracking": false,
    "enableStorytellerMixpanel": false,
    "enableThirdPartySurveyQualtrics": false,
    "enableVisualizationCanvas": false,
    "featureMapDefaultExtent": "",
    "govstatProgressSettings": true,
    "hideInterpolatedNulls": false,
    "hideSocrataId": false,
    "includeSrInEsri": false,
    "ingressReenter": false,
    "ingressStrategy": "obe",
    "internalPanelRedesign": "all",
    "killEsriReprojectionAndPassDifferentWebm": false,
    "killSnowflakeMapProjections": false,
    "nbeBucketSize": true,
    "notifyImportResult": false,
    "openPerformanceEnableGoalManagementAdminPane": true,
    "openPerformanceNarrativeEditor": "classic",
    "reenableUiForNbe": false,
    "removeViewsFromDiscussPane": false,
    "reportBuilderEnabled": false,
    "routeDataslateWithoutCaching": true,
    "sendSoqlVersion": false,
    "showAuth0Identifiers": false,
    "showFederatedSiteNameInsteadOfCname": false,
    "showProvenanceBadgeInCatalog": true,
    "showProvenanceFacetInCatalog": true,
    "siteAppearanceVisible": false,
    "siteChromeLanguageSwitcher": false,
    "storiesEnabled": true,
    "storiesShowFacetInCatalog": true,
    "timeline": "old",
    "useAuth0": false,
    "useAuth0Component": false,
    "useAuth0LoginFlow": false,
    "useDataLensChoroplethCustomBoundary": false,
    "useEphemeralBootstrap": true,
    "useMergedStyles": false,
    "useSoda2": "never",
    "validateFragmentCacheBeforeRender": true,
    "zealousDataslateCacheExpiry": false
}
```

### Extended prototypes

#### String.prototype.escapeSpaces()

Replaces whitespace characters (in the `\s` character class) with Unicode non-breaking space `\u00A0`, which prevents multiple spaces from being collapsed into a single space in HTML contexts.

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
