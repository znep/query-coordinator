(function() {
  'use strict';

  function ColumnChartService(Filter) {

    function registerColumnChartEvents($scope, element) {
      element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', handleDatumSelect);
      element.on('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', handleExpandedToggle);

      function handleDatumSelect(event) {

        var payload = event.originalEvent.detail;

        if (payload.hasOwnProperty('name')) {

          var datumName = payload.name;

          var wantsFilterToNull = _.isUndefined(datumName) ||
            _.isNull(datumName) ||
            _.isNaN(datumName) ||
            (_.isNumber(datumName) && !_.isFinite(datumName)) ||
            (_.isString(datumName) && datumName.length === 0);

          var isFilteringOnClickedDatum = _.any($scope.model.getCurrentValue('activeFilters'), function(currentFilter) {
            if (currentFilter instanceof Filter.BinaryOperatorFilter) {
              return currentFilter.operand === datumName;
            } else if (currentFilter instanceof Filter.IsNullFilter) {
              return wantsFilterToNull;
            } else {
              throw new Error('CardVisualizationColumnChart does not understand the filter on its column: ' + currentFilter);
            }
          });

          // If we're already filtering on the datum that was clicked, we should toggle the filter off.
          // Otherwise, set up a new filter for the datum.
          if (isFilteringOnClickedDatum) {
            $scope.model.set('activeFilters', []);
          } else {

            var filter;

            if (wantsFilterToNull) {
              filter = new Filter.IsNullFilter(true);
            } else {
              filter = new Filter.BinaryOperatorFilter('=', datumName);
            }
            $scope.model.set('activeFilters', [filter]);
          }
        }
      }

      function handleExpandedToggle(event) {

        var payload = event.originalEvent.detail;

        if (payload.hasOwnProperty('expanded')) {
          $scope.model.page.toggleExpanded($scope.model);
        }
      }
    }

    return {
      registerColumnChartEvents: registerColumnChartEvents,
    };
  }

  angular.
    module('dataCards.services').
      factory('ColumnChartService', ColumnChartService);

})();
