(function() {
  'use strict';

  function ApiExplorer(DatasetDataService, WindowState) {
    return {
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/apiExplorer.html',
      scope: {
        datasetObservable: '=',
        editMode: '='
      },
      link: function($scope, element) {
        var destroy$ = $scope.$destroyAsObservable(element);

        /*
         * Scope variables
         */
        $scope.panelActive = false;
        $scope.selectedFormat = 'JSON';

        /*
         * Helper functions
         */

        /**
         * Given a template URL string, produces a function that accepts a datasetId and
         * domain and returns a formatted version of the URL, or '#' if the inputs are
         * invalid
         *
         * @param template Template URL
         * @returns {Function} formatting function
         */
        var safeUrlFormatFn = function(template) {
          return function(datasetId, domain) {
            if ($.isPresent(datasetId) && $.isPresent(domain)) {
              return template.format(domain, datasetId);
            } else {
              return '#';
            }
          };
        };

        // Observables

        var selectedFormat$ = $scope.$observe('selectedFormat');

        var datasetId$ = $scope.datasetObservable.map(function(dataset) {
          if (dataset) {
            return dataset.id;
          } else {
            return null;
          }
        });
        var domain$ = $scope.datasetObservable.observeOnLatest('domain').map(function(domain) {
          if (domain) {
            return domain;
          } else {
            return null;
          }
        });
        var datasetJsonApiUrl$ = Rx.Observable.combineLatest(
          datasetId$,
          domain$,
          safeUrlFormatFn('https://{0}/resource/{1}.json'));
        var geoJsonApiUrl$ = Rx.Observable.combineLatest(
          datasetId$,
          domain$,
          safeUrlFormatFn('https://{0}/resource/{1}.geojson'));
        var datasetDocumentationUrl$ = Rx.Observable.combineLatest(
          datasetId$,
          domain$,
          safeUrlFormatFn('http://dev.socrata.com/foundry/#/{0}/{1}'));
        var jsonAvailable$ = Rx.Observable.returnValue(true);
        var geoJsonAvailable$ = datasetId$.
          filter(function(value) { return !_.isNull(value); }).
          flatMapLatest(function(id) {
            return Rx.Observable.fromPromise(DatasetDataService.getGeoJsonInfo(id, {params: {'$limit': 1}}));
          }).
          filter(function(response) {
            // Currently requests to the GeoJson endpoint for datasets that don't have geo data return a 200
            // But should return a 406, thus the additional check for an empty body
            return response.status === 200 && _.keys(response.data).length > 0;
          });

        var multipleFormatsAvailable$ = Rx.Observable.merge(jsonAvailable$, geoJsonAvailable$).
          filter(_.identity).
          scan(0, function(acc) {
            return acc + 1;
          }).
          map(function(value) { return value > 1; });

        var selectedUrl$ = selectedFormat$.flatMapLatest(function(format) {
          switch (format) {
            case 'JSON':
              return datasetJsonApiUrl$;
            case 'GeoJSON':
              return geoJsonApiUrl$;
            default:
              return Rx.Observable.returnValue('#');
          }
        });

        // Hide the flannel when pressing escape or clicking outside the
        // tool-panel-main element.  Clicking on the button has its own
        // toggling behavior so it is excluded from this logic.
        WindowState.closeDialogEvent$.
          takeUntil(destroy$).
          filter(function(e) {
            if (!$scope.panelActive) { return false; }
            if (e.type === 'keydown') { return true; }

            var $target = $(e.target);
            var targetInsideFlannel = $target.closest('.tool-panel-main').length > 0;
            var targetIsButton = $target.is($(element).find('.tool-panel-toggle-btn'));
            return !targetInsideFlannel && !targetIsButton;
          }).
          subscribe(function() {
            $scope.$safeApply(function() {
              $scope.panelActive = false;
            });
          });

        /*
         * Bind streams to scope
         */
        $scope.$bindObservable('selectedUrl', selectedUrl$);
        $scope.$bindObservable('datasetDocumentationUrl', datasetDocumentationUrl$);
        $scope.$bindObservable('multipleFormatsAvailable', multipleFormatsAvailable$);


        // Clean up
        destroy$.subscribe(function() {
          $scope.$emit('cleaned-up');
        });

        // Temporary for v2 migration
        // We need to check if we're on a v2 or v1 data lens page to know which
        // button styling and tooltip panel classes to apply
        $scope.v2DataLens = element.closest('div.activities').length > 0;
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('apiExplorer', ApiExplorer);

})();
