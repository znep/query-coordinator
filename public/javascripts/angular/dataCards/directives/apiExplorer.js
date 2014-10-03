(function() {
  'use strict';

  function ApiExplorer(AngularRxExtensions, DatasetDataService) {
    return {
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/apiExplorer.html',
      scope: {
        datasetObservable: '=datasetObservable'
      },
      link: function($scope, element, attrs) {
        AngularRxExtensions.install($scope);

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
          }
        };

        /*
         * Streams
         */
        var selectedFormatStream = $scope.observe('selectedFormat');
        var datasetIdStream = $scope.datasetObservable.map(function(dataset) {
          if (dataset) {
            return dataset.id;
          } else {
            return null;
          }
        });
        var domainStream = $scope.datasetObservable.observeOnLatest('domain').map(function(domain) {
          if (domain) {
            return domain;
          } else {
            return null;
          }
        });
        var datasetJsonApiUrlStream = Rx.Observable.combineLatest(
          datasetIdStream,
          domainStream,
          safeUrlFormatFn('https://{0}/resource/{1}.json'));
        var geoJsonApiUrlStream = Rx.Observable.combineLatest(
          datasetIdStream,
          domainStream,
          safeUrlFormatFn('https://{0}/views/{1}/rows.geojson'));
        var datasetDocumentationUrlStream = Rx.Observable.combineLatest(
          datasetIdStream,
          domainStream,
          safeUrlFormatFn('http://dev.socrata.com/foundry/#/{0}/{1}'));
        var jsonAvailableStream = Rx.Observable.return(true);
        var geoJsonAvailableStream = datasetIdStream.
          filter(function(value) { return !_.isNull(value); }).
          flatMapLatest(function(id) {
            return Rx.Observable.fromPromise(DatasetDataService.getGeoJsonInfo(id, {params: {'$limit': 1}}));
          }).
          filter(function(response) {
            // Currently requests to the GeoJson endpoint for datasets that don't have geo data return a 200
            // But should return a 406, thus the additional check for an empty body
            return response.status === 200 && _.keys(response.data).length > 0;
          });

        var multipleFormatsAvailableStream = Rx.Observable.merge(jsonAvailableStream, geoJsonAvailableStream).
          filter(_.identity).
          scan(0, function(acc, x) {
            return acc + 1;
          }).
          map(function(value) { return value > 1; });

        var selectedUrlStream = selectedFormatStream.flatMapLatest(function(format) {
          switch (format) {
            case 'JSON':
              return datasetJsonApiUrlStream;
            case 'GeoJSON':
              return geoJsonApiUrlStream;
            default:
              return Rx.Observable.return('#');
          }
        });

        /*
         * Bind streams to scope
         */
        $scope.bindObservable('selectedUrl', selectedUrlStream);
        $scope.bindObservable('datasetDocumentationUrl', datasetDocumentationUrlStream);
        $scope.bindObservable('multipleFormatsAvailable', multipleFormatsAvailableStream);

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('apiExplorer', ApiExplorer);

})();
