(function($) {
  var cannotHeatmap = $.browser.msie && parseInt($.browser.version) < 9;

  $.Control.registerMixin('heatmap', {
    initializeLayer: function() {
      var layerObj = this;

      if (cannotHeatmap) {
        throw new Error('IE8 - no canvas for heat map');
      }

      layerObj._displayLayer = new OpenLayers.Layer.Heatmap(layerObj._view.name,
        layerObj._map, {
          'element': layerObj._parent.currentDom,
          'radius': 25,
          'visible': true
        });
      layerObj._map.addLayer(layerObj._displayLayer);

      if (_.isNumber(layerObj._displayFormat.opacity)) {
        layerObj._displayLayer.setOpacity(layerObj._displayFormat.opacity);
      }

      layerObj._dataStore = [];
      layerObj._bounds = null;

      layerObj.viewportHandler().
        events.register('viewportchanged', layerObj, layerObj.onViewportChange);
      layerObj.viewportHandler().
        events.register('resize', layerObj, layerObj.onResize);
    },

    initializeFlyouts: function() {}, // No flyouts

    destroy: function() {
      this._displayLayer.destroy();
      delete this._dataStore;
      delete this._bounds;
      delete this._idList;
      this.viewportHandler().events.
        unregister('viewportchanged', this, this.onViewportChange);
      this.viewportHandler().events.
        unregister('resize', this, this.onResize);

      this.$dom().remove();
      this._view.unbind(null, null, this);
      if (this._parent._primaryView) {
        this._view.unbind(null, null, this._parent._primaryView);
      }
    },

    // There is a fixed-size canvas created that doesn't flex with new map sizes.
    // The simplest solution was to just tear down and re-create at minimal cost.
    onResize: function() {
      this._displayLayer.destroy();
      this._displayLayer = new OpenLayers.Layer.Heatmap(this._view.name,
        this._map, {
          'element': this._parent.currentDom,
          'radius': 25,
          'visible': true
        });
      this._map.addLayer(this._displayLayer);
      this._displayLayer.setDataSet({
        max: 50,
        data: this._dataStore
      });
    },

    preferredExtent: function() {
      return this._bounds;
    },

    clearData: function() {
      this._bounds = new OpenLayers.Bounds();
      this._dataStore = [];
      this._idList = {};
    },

    handleDataLoaded: function() {
      this._super.apply(this, arguments);

      this._displayLayer.setDataSet({
        max: 50,
        data: this._dataStore
      });
    },

    prepareRowRender: function(rowOrCluster) {
      var layerObj = this;

      if (!layerObj._idList) {
        layerObj._idList = {};
      }

      if (layerObj._renderType == 'clusters') {
        layerObj.prepareHeatAsCluster(rowOrCluster);
      } else {
        layerObj.prepareHeatAsRow(rowOrCluster);
      }
    },

    extendBounds: function(lonlat) {
      if (!this._bounds) {
        this._bounds = lonlat.toGeometry().getBounds();
      } else {
        this._bounds.extend(lonlat);
      }
    },

    prepareHeatAsCluster: function(cluster) {
      var layerObj = this;

      if (layerObj._idList['cluster' + cluster.id]) {
        return;
      }

      // A cluster should either have children or points.
      if (!_.isEmpty(cluster.points)) {
        _.each(cluster.points, function(child) {
          var lonlat = new OpenLayers.LonLat(child.lon, child.lat).
            transform(blist.openLayers.geographicProjection, layerObj._mapProjection);
          layerObj._dataStore.push({
            lonlat: lonlat
          });
          layerObj.extendBounds(lonlat);
        });
      } else if (!_.isEmpty(cluster.children)) {
        _.each(cluster.children, function(child) {
          var lonlat = new OpenLayers.LonLat(child.centroid.lon, child.centroid.lat).
            transform(blist.openLayers.geographicProjection,
              layerObj._mapProjection);
          layerObj._dataStore.push({
            lonlat: lonlat,
            count: child.size
          });
          layerObj.extendBounds(lonlat);
        });
      }

      layerObj._idList['cluster' + cluster.id] = true;
    },

    prepareHeatAsRow: function(row) {
      var layerObj = this;

      var geometry = layerObj.extractGeometryFromRow(row);
      if (_.isBoolean(geometry) || _.isString(geometry)) {
        return null;
      }

      var dupKey = geometry.toString();

      if (layerObj._idList[dupKey]) {
        return;
      }

      var lonlat = geometry.toLonLat();
      layerObj._dataStore.push({
        lonlat: lonlat
      });
      layerObj.extendBounds(lonlat);

      layerObj._idList[dupKey] = true;
    },

    renderDatum: function() {
      // Pft. Rendering.
    }
  }, {}, 'socrataDataLayer', 'clusters');

})(jQuery);
