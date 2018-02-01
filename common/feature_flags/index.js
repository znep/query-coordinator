import { get, merge, isNil } from 'lodash';

export const FeatureFlags = {
  source: function() {
    throw new Error('Reserved for future use (FFS).');
  },

  value: function(key) {
    const flagValue =
      get(window, `socrata.featureFlags.${key}`,
        get(window, `serverConfig.featureFlags.${key}`,
          get(window, `blist.feature_flags.${key}`)
        )
      );

    if (isNil(flagValue)) {
      throw new Error(`Invalid feature flag: ${key} (check that window.socrata.featureFlags or window.serverConfig.featureFlags is defined; Please see README.md in common/feature_flags.)`);
    }

    return flagValue;
  },

  // Intended usage in tests/specs:
  //   FeatureFlags.useTestFixture({ some_flag: false });
  //   expect(FeatureFlags.value('some_flag')).to.equal(false);
  useTestFixture: (options) => {
    window.socrata = window.socrata || {};
    window.socrata.featureFlags = options || {};
  },

  updateTestFixture: (options) => {
    window.socrata = window.socrata || {};
    window.socrata.featureFlags = merge(window.socrata.featureFlags || {}, options);
  }
};

export default FeatureFlags;

