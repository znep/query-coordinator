# Feature flags

The purpose of this module is to provide safe access to requested feature flag keys. An error will be thrown
if the requested feature flag does not exist.

Support for feature flags requires that `window.socrata.featureFlags` or `window.serverConfig.featureFlags`
be defined at page load time. This is easily done in frontend via the `render_feature_flags_for_javascript`
helper. Other projects should adopt similar helpers, please read the frontend version for inspiration.

This is expected to be a simple object containing keys for all defined feature flags. Usage example:

```javascript
import { FeatureFlags } from 'common/feature_flags';
console.log('someFlag = ' + FeatureFlags.value('some_flag'));
```

## In tests

In tests, the FeatureFlags module provides a test fixture and means over providing
test-specific override values for one or more feature flags.

Usage example:

```javascript
import { FeatureFlags } from 'common/feature_flags';
describe('FeatureFlags', function() {
  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('should return the value for feature flag', function() {
    expect(FeatureFlags.value('some_flag')).to.equal(false);
  });

  it('allows values to be overridden in the test fixture', function() {
    FeatureFlags.useTestFixture({ some_flag: true });
    expect(FeatureFlags.value('some_flag')).to.equal(true);
  });
});
```

## Example featureFlag JSON data expected to be on window.

```json
featureFlags: {
    "allow_data_lens_owner_change": true,
    "some_other_flag": false,
   ... Removed for brevity. See common/FeatureFlags/index.js for more.
}
```

