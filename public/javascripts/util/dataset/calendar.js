(function() {

  Dataset.modules.calendar = {
    supportsSnapshotting: function() {
      return true;
    },

    _setupSnapshotting: function() {
      this._setupDefaultSnapshotting(0);
    },

    _checkValidity: function() {
      if ($.isBlank(this.displayFormat.startDateTableId) ||
        $.isBlank(this.displayFormat.titleTableId)) {
        return false;
      }

      var startCol = this.columnForTCID(this.displayFormat.startDateTableId);
      var titleCol = this.columnForTCID(this.displayFormat.titleTableId);

      return !$.isBlank(startCol) && !$.isBlank(titleCol);
    },

    _convertLegacy: function() {
      var view = this;
      _.each(['startDate', 'endDate', 'title', 'description'], function(n) {
        if ($.isBlank(view.displayFormat[n + 'TableId']) &&
          !$.isBlank(view.displayFormat[n + 'Id'])) {
          var c = view.columnForID(view.displayFormat[n + 'Id']);
          if (!$.isBlank(c)) {
            view.displayFormat[n + 'TableId'] = c.tableColumnId;
          }
          delete view.displayFormat[n + 'Id'];
        }
      });

      if (!$.isBlank(view.displayFormat.descriptionTableId)) {
        view.displayFormat.descriptionColumns = [{
          tableColumnId: view.displayFormat.descriptionTableId
        }];
        delete view.displayFormat.descriptionTableId;
      }
    }
  };

})();
