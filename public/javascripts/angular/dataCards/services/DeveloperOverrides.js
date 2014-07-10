angular.module('dataCards.services').factory('DeveloperOverrides', function() {

  // Shamelessly lifted from http://www.joezimjs.com/javascript/3-ways-to-parse-a-query-string-in-a-url/
  var parseQueryString = function( queryString ) {
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }

    return params;
  };

  var queryObject = parseQueryString(decodeURIComponent(window.location.search.substr(1)));

  var datasetDataOverrides = {};
  return {
    init: function() {
      // Dataset data override. Use this if you want to override
      // the data for a particular dataset with data from another dataset.
      // For example, this causes requests for dead-beef's data to return
      // data from pure-gold.
      // /fake-page?override_dataset_data=dead-beef->pure-gold
      // You can specify multiple overrides by separating with a comma.
      //
      // Obviously, this charade will go bananas if the schema doesn't match.
      if (queryObject['override_dataset_data']) {
        var overrides = queryObject['override_dataset_data'].split(',');
        _.each(overrides, function(override) {
          var parts = override.match(/^(\w{4}-\w{4})->(\w{4}-\w{4})$/);
          if (!parts || parts.length != 3) {
            console.error('Invalid override: ' + override + ', correct syntax is A->B, where A and B are 4x4s');
            return
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
