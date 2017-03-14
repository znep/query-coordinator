var FeatureFlags = require('../src/FeatureFlags');

describe('FeatureFlags', function() {

  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('should return the value for feature flag', function() {
    FeatureFlags.useTestFixture({ useAuth0: false });
    assert.isFalse(FeatureFlags.value('useAuth0'));
  });

  it('should throw when given an invalid feature flag key', function() {
    assert.throws(function() { FeatureFlags.value('foo'); });
  });

  it('should throw when featureFlags data source is not on the window', function() {
    delete(window.socrata);
    assert.throws(function() { FeatureFlags.value('timeline'); });
  });

  it('should throw when featureFlags data source cannot be found', function() {
    window.socrata = {};
    assert.throws(function() { FeatureFlags.value('enablePulse'); });
  });

});
