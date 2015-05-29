(function() {
  'use strict';

  function histogramDirective(HistogramVisualizationService) {
    return {
      restrict: 'E',
      scope: {
        cardData: '=',
        rowDisplayUnit: '=',
        isFiltered: '=',
        expanded: '='
      },
      template: '<div class="histogram"></div>',
      link: function($scope, element) {
        var service = HistogramVisualizationService;
        var container = element.find('.histogram')[0];

        // Setup
        var dom = service.setupDOM(container);
        var scale = service.setupScale();
        var axis = service.setupAxis(scale);
        var svg = service.setupSVG();
        var hover = service.setupHover(dom);

        // Observables
        var cardData$ = $scope.$observe('cardData').
          map(function(data) {
            if (_.isObject(data) && _.isPresent(data.error)) {
              dom = service.setupDOM(container);
              return null;
            }

            return data;
          }).
          filter(_.isPresent);

        var cardDimensions$ = element.closest('.card-visualization').observeDimensions().
          map(function(dimensions) {
            return {
              width: Math.max(dimensions.width - dom.margin.left - dom.margin.right, 0),
              height: Math.max(dimensions.height - dom.margin.top - dom.margin.bottom, 0)
            };
          }).
          filter(function(value) {
            return value.width !== 0 && value.height !== 0;
          }).
          distinctUntilChanged();

        // Combine Observables
        Rx.Observable.subscribeLatest(
          cardData$,
          cardDimensions$,
          function(data, dimensions) {
            var isFiltered = $scope.isFiltered;
            var rowDisplayUnit = $scope.rowDisplayUnit;

            scale = service.updateScale(scale, data, dimensions);
            svg = service.updateSVG(svg, data, scale);
            hover = service.updateHover(hover, data, isFiltered, rowDisplayUnit, dom, scale);

            service.render(dom, data, dimensions, scale, axis, svg);
          }
        );
      }
    }
  }

  angular.
    module('dataCards.directives').
    directive('histogram', histogramDirective);

})();
