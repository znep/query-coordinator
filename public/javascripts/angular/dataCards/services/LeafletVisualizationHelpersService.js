(function() {

  var EXTENT_EVENT_ID = 'set-extent';
  var EXTENT_MODEL_PROPERTY_NAME = 'mapExtent';

  function LeafletVisualizationHelpersService(LeafletHelpersService) {

    /**
     * Mixin helper for card visualizations that wrap a leaflet map that can
     * save its user-modified extent to the card model
     * @param {$rootScope.Scope} scope
     * @param {Card} model
     * @returns {*}
     */
    this.setObservedExtentOnModel = function setObservedExtentOnModel(scope, model) {
      var extentChanges$ = scope.$eventToObservable(EXTENT_EVENT_ID).
        skip(1). // skip initial setup zoom
        map(_.property('additionalArguments[0]'));

      extentChanges$.subscribe(_.bind(model.setOption, model, EXTENT_MODEL_PROPERTY_NAME, _));
      return extentChanges$;
    };

    /**
     * Mixin helper for map directives that use leaflet.  Emits an event when
     * user zooms or pans
     * @param {$rootScope.Scope} scope
     * @param {L.Map} map
     */
    this.emitExtentEventsFromMap = function emitExtentEventsFromMap(scope, map) {
      map.on('zoomend dragend resize', function(e) {
        scope.$emit(
          EXTENT_EVENT_ID,
          LeafletHelpersService.buildExtents(e.target.getBounds())
        );
      });
    };

  }

  angular.
    module('dataCards.services').
    service('LeafletVisualizationHelpersService', LeafletVisualizationHelpersService);

})();
