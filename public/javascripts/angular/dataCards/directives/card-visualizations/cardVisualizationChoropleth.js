angular.module('dataCards.directives').directive('cardVisualizationChoropleth', function(AngularRxExtensions, $http) {

  return {
    restrict: 'E',
    scope: { 'model': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').pluckSwitch('dataset');

      var geoJsonRegionData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            var geojsonFileName = 'testing_sample';
            var regionDataPromise = $http.get('/datasets/geojson/'+geojsonFileName+'.json').then(function(result) {
              // GeoJson was reprojected and converted to Geojson with http://converter.mygeodata.eu/vector
              // reprojected to WGS 84 (SRID: 4326)
              return result.data;
              // TODO: invalid geojsonData --> ???
            });
            return Rx.Observable.fromPromise(regionDataPromise);
          }).switchLatest();

      $scope.bindObservable('regions', geoJsonRegionData);
    }
  };

});
