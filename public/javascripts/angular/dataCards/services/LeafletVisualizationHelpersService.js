const angular = require('angular');
var EXPAND_CARD_EVENT_ID = 'card-expanded';
var EXTENT_EVENT_ID = 'set-extent';
var EXTENT_MODEL_PROPERTY_NAME = 'mapExtent';

function leafletEventToObservable(map, eventName, Rx) {
  return Rx.Observable.
    fromEventPattern(function addHandler(handler) {
      map.on(eventName, handler);
    }, function removeHandler(handler) {
      map.off(eventName, handler);
    });
}

function LeafletVisualizationHelpersService(LeafletHelpersService, $rootScope, rx) {
  const Rx = rx;

  /**
   * Mixin helper for card visualizations that wrap a leaflet map that can
   * save its user-modified extent to the card model
   * @param {$rootScope.Scope} $scope
   * @param {Card} model
   * @returns {*}
   */
  this.setObservedExtentOnModel = function setObservedExtentOnModel($scope, model) {
    model.page.observe('hasExpandedCard').subscribe(function(value) {
      $rootScope.$emit(EXPAND_CARD_EVENT_ID, value);
    });

    var extentChanges$ = $scope.$eventToObservable(EXTENT_EVENT_ID).
      skip(1). // skip initial setup zoom
      map(_.property('additionalArguments[0]'));

    extentChanges$.subscribe(_.bind(model.setOption, model, EXTENT_MODEL_PROPERTY_NAME, _));
    return extentChanges$;
  };

  /**
   * Mixin helper for map directives that use leaflet.  Emits an event when
   * user zooms or pans
   * @param {$rootScope.Scope} $scope
   * @param {L.Map} map
   */
  this.emitExtentEventsFromMap = function emitExtentEventsFromMap($scope, map) {
    var expandedCard$ = $rootScope.$eventToObservable(EXPAND_CARD_EVENT_ID).
      map(_.property('additionalArguments[0]')).
      filter(_.isPresent).
      distinctUntilChanged();

    var mapResize$ = expandedCard$.
      flatMapLatest(function() {
        return leafletEventToObservable(map, 'resize', Rx).take(1);
      });

    var mapZoomDrag$ = leafletEventToObservable(map, 'zoomend dragend', Rx);

    var mapExtents$ = mapZoomDrag$.merge(mapResize$).map(function() {
      return LeafletHelpersService.buildExtents(map.getBounds());
    });

    mapExtents$.subscribe(function(mapExtents) {
      $scope.$emit(EXTENT_EVENT_ID, mapExtents);
    });
  };
}

angular.
  module('dataCards.services').
  service('LeafletVisualizationHelpersService', LeafletVisualizationHelpersService);
