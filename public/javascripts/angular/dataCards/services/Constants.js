(function() {
  'use strict';

  function Constants() {

    var constants = {
      // Dataset field names and internal calculated values.
      'INTERNAL_DATASET_FEATURE_ID': '_feature_id',
      'UNFILTERED_VALUE_PROPERTY_NAME': '__SOCRATA_UNFILTERED_VALUE__',
      'FILTERED_VALUE_PROPERTY_NAME': '__SOCRATA_FILTERED_VALUE__',
      'HIGHLIGHTED_PROPERTY_NAME': '__SOCRATA_FEATURE_HIGHLIGHTED__',
      'HUMAN_READABLE_PROPERTY_NAME': '__SOCRATA_HUMAN_READABLE_NAME__',

      // Visualization
      'NULL_VALUE_LABEL': '(No Value)',

      // Choropleth visualization parameters.
      'MAXIMUM_NUMBER_OF_CLASSES_ALLOWED': 7,
      'CLASS_BREAK_THRESHOLD': 6
    };

    return {
      get: function(name) {
        if (!constants.hasOwnProperty(name)) {
          throw new Error('Cannot get non-existent constant "' + name + '".');
        }
        return constants[name];
      }
    };

  };

  angular.
    module('dataCards.services').
      factory('Constants', Constants);

})();
