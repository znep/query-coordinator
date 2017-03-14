var FeatureFlags = require('../src/FeatureFlags');

describe('FeatureFlags', function() {

  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('returns the feature flag value', function() {
    FeatureFlags.useTestFixture({ useAuth0: false });
    assert.isFalse(FeatureFlags.value('useAuth0'));
  });

  it('throws when given an invalid feature flag key', function() {
    assert.throws(function() { FeatureFlags.value('foo'); });
  });

  it('throws when featureFlags data source is not on the window', function() {
    delete(window.socrata);
    assert.throws(function() { FeatureFlags.value('timeline'); });
  });

  it('throws when featureFlags data source cannot be found', function() {
    window.socrata = {};
    assert.throws(function() { FeatureFlags.value('enablePulse'); });
  });

});
