(function() {
  // NOTE: This functionality is for snapshotting ONLY
  // If you add something here that should be specific to grouped/non-grouped
  // datasets, we should separate these into separate files

  var snapshotCapabilities = {
    supportsSnapshotting: function() {
      return true;
    },

    _setupSnapshotting: function() {
      // Give more time for the browser to render images
      var slowTypes = ['checkbox', 'percent', 'stars', 'flag', 'photo'];
      var requiresLargerDelay = _.any(this.columns, function(col) {
        return _.include(slowTypes, col.dataTypeName);
      });

      var timeout = requiresLargerDelay ? 1500 : 500;
      this._setupDefaultSnapshotting(timeout);
    }
  };

  Dataset.modules.grouped = snapshotCapabilities;
  Dataset.modules.filter = snapshotCapabilities;
  Dataset.modules.blist = snapshotCapabilities;
  Dataset.modules.table =  snapshotCapabilities;
})();
