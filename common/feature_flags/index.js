import _ from 'lodash';

export var FeatureFlags = {
  source: function() {
    throw new Error('Reserved for future use (FFS).');
  },

  value: function(key) {
    var featureFlags = _.get(window, 'socrata.featureFlags');
    if (featureFlags === undefined) {
      featureFlags = _.get(window, 'serverConfig.featureFlags');
    }
    if (featureFlags === undefined) {
      throw new Error(
        `FeatureFlags requires window.socrata.featureFlags or window.serverConfig.featureFlags to be defined.
        Please see README.md in frontend-utils.`
      );
    }
    if (Object.keys(featureFlags).indexOf(key) === -1) {
      throw new Error(`Invalid feature flag: ${key}`);
    } else {
      return featureFlags[key];
    }
  },

  // Intended usage in tests/specs:
  //   FeatureFlags.useTestFixture({ use_auth0: false });
  //   expect(FeatureFlags.value('use_auth0')).to.equal(false);
  useTestFixture: function(options) {
    window.socrata = window.socrata || {};
    window.socrata.featureFlags = options || {};
  },

  updateTestFixture: function(options) {
    window.socrata.featureFlags = _.merge(window.socrata.featureFlags, options);
  }
};

