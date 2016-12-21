var FeatureFlags = require('../src/FeatureFlags');

describe('FeatureFlags', function() {

  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('should return the value for feature flag', function() {
    expect(FeatureFlags.value('useAuth0')).to.equal(false);
  });

  it('should allow override values in the test fixture data', function() {
    FeatureFlags.useTestFixture({ useAuth0: true });
    expect(FeatureFlags.value('useAuth0')).to.equal(true);
  });

  it('should throw when given an invalid feature flag key', function() {
    expect(function() { FeatureFlags.value('foo'); }).to.throw();
  });

  it('should throw when featureFlags data source is not on the window', function() {
    delete(window.socrata);
    expect(function() { FeatureFlags.value('timeline'); }).to.throw();
  });

  it('should throw when featureFlags data source cannot be found', function() {
    window.socrata = {};
    expect(function() { FeatureFlags.value('enablePulse'); }).to.throw();
  });

});
