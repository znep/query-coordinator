(function() {

  var GeoHelpers = {
    isArcGISDataset: function(view) {

      if (ReadOnlyView.isReadOnlyView(view)) {
        view = view.serialize();
      }

      return !_.isNull(_.get(view, 'metadata.custom_fields.Basic.Source', null));
    },
    isGeoDataset: function(view) {

      if (ReadOnlyView.isReadOnlyView(view)) {
        view = view.serialize();
      }

      return !_.isNull(_.get(view, 'metadata.geo', null));
    },
    isArcGISOrGeoDataset: function(view) {

      if (ReadOnlyView.isReadOnlyView(view)) {
        view = view.serialize();
      }

      return this.isArcGISDataset(view) || this.isGeoDataset(view);
    }
  };

  if (blist.inBrowser) {
    this.GeoHelpers = GeoHelpers;
  } else {
    module.exports = GeoHelpers;
  }
})();
