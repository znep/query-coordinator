import { FeatureFlags } from 'common/feature_flags';

describe('FeatureFlags', function() {

  const validFeatureFlag = 'useAuth0';

  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('returns the feature flag value', function() {
    FeatureFlags.useTestFixture({ [validFeatureFlag]: false });
    assert.isFalse(FeatureFlags.value(validFeatureFlag));
  });

  it('throws when given an invalid feature flag key', function() {
    assert.throws(function() { FeatureFlags.value('foo'); });
  });

  it('throws when featureFlags data source is not on the window', function() {
    delete(window.socrata);
    assert.throws(function() { FeatureFlags.value(validFeatureFlag); });
  });

  it('throws when featureFlags data source cannot be found', function() {
    window.socrata = {};
    assert.throws(function() { FeatureFlags.value(validFeatureFlag); });
  });

});
