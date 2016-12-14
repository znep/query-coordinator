'use strict';

var FeatureFlags = {
  source: function(key) {
    throw new Error('Not yet implemented');
  },

  value: function(key) {
    if (window.socrata.featureFlags === undefined) {
      throw new Error(
        'FeatureFlags requires window.socrata.featureFlags to be defined. Please see README.md in frontend-utils.'
      );
    }
    if (Object.keys(window.socrata.featureFlags).indexOf(key) === -1) {
      throw new Error('Invalid feature flag: ' + key);
    } else {
      return window.socrata.featureFlags[key];
    }
  }
};

module.exports = FeatureFlags;
