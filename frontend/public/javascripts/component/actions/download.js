$.component.Component.extend('Download', 'actions', {
  _getAssets: function() {
    return {
      javascripts: [{assets: 'download-inline'}]
    };
  },

  _initDom: function() {
    this._super.apply(this, arguments);

    if ($.isBlank(this.$link)) {
      this.$link = this.$contents.children('a.button');

      if (this.$link.length < 1) {
        this.$link = $.tag({tagName: 'a', 'class': 'button', rel: 'external'});
        this.$contents.append(this.$link);
      }
    }
  },

  _render: function() {
    var cObj = this;

    if (!cObj._super.apply(cObj, arguments)) {
      return false;
    }

    cObj._updateDataSource(cObj._properties, function() {
      if ($.isBlank(cObj._dataContext) || $.isBlank(cObj._dataContext.dataset)) {
        return;
      }

      var ds = cObj._dataContext.dataset;
      cObj.$link.text(cObj._stringSubstitute(cObj._properties.text) || 'Download this data');
      cObj.$link.attr('href', ds.downloadUrl('csv'));

      if (!GeoHelpers.isGeoDataset(ds) && !cObj._properties.disableInlineDownload) {
        cObj.$link.downloadToFormCatcher(ds);
      }
    });
  },

  _propWrite: function(properties) {
    this._super.apply(this, arguments);
    if (!_.isEmpty(properties)) {
      this._render();
    }
  }
});
