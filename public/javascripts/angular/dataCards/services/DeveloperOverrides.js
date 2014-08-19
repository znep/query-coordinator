angular.module('dataCards.services').factory('DeveloperOverrides', function() {
  var datasetDataOverrides = {};
  return {
    setOverridesFromString: function(overridesString) {
      // Dataset data override. Use this if you want to override
      // the data for a particular dataset with data from another dataset.
      // For example, this causes requests for dead-beef's data to return
      // data from pure-gold.
      // /fake-page?override_dataset_data=dead-beef->pure-gold
      // You can specify multiple overrides by separating with a comma.
      //
      // Obviously, this charade will go bananas if the schema doesn't match.
      datasetDataOverrides = {};
      if (overridesString) {
        var overrides = overridesString.split(',');
        _.each(overrides, function(override) {
          var parts = override.match(/^(\w{4}-\w{4})->(\w{4}-\w{4})$/);
          if (!parts || parts.length != 3) {
            throw new Error('Invalid override: ' + override + ', correct syntax is A->B, where A and B are 4x4s');
          }
          datasetDataOverrides[parts[1]] = parts[2];
        });
      }
    },

    // Gets the data override for a particular dataset id, if any (see override_dataset_data).
    // If none exists, returns undefined.
    dataOverrideForDataset: function(datasetId) {
      return datasetDataOverrides[datasetId];
    }
  };
});
