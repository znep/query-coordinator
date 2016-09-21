(function($) {
  blist.openLayers.ExternalESRILayer = OpenLayers.Class(OpenLayers.Layer.ArcGIS93Rest, { //eslint-disable-line new-cap
    initialize: function(name, url, params) {
      var layer = this;

      this.secure = /^https/.test(url);
      if (!this.secure) {
        var errString = name + ' is an insecure \'http\' URL, resulting in a degraded experience.';
        if (window.console && _.isFunction(console.error)) {
          console.error(errString);
        } else if (_.isFunction($.debug)) {
          $.debug(errString);
        }
      }

      var properties = ['externalMapProjection', 'internalMapProjection', 'onloadCallback'];
      _.each(properties, function(property) {
        layer[property] = params[property];
        delete params[property];
      });
      this.layerId = params.layers.split(':')[1];

      // Hopefully, this can be taken out one day.
      if (url.match(/nycopendata.esri.com/)) {
        this.projection = this.internalMapProjection;
      }

      if (this.secure) {
        dojo.require('esri.layers.FeatureLayer');
        dojo.addOnLoad(function() {
          var path = url.replace(/\/export$/, '');
          layer.featureLayer = new esri.layers.FeatureLayer(path + '/' + layer.layerId);

          // If the customer's endpoint sends back a 4xx/5xx error,
          // Dojo will helpfully twiddle its thumbs for a full minute.
          //
          // This value is configurable @ esri.config.defaults.io.timeout —
          // https://developers.arcgis.com/javascript/jsapi/esri.config.html —
          // but that would affect all requests and there's a fine line
          // between waiting too long without reacting and not waiting
          // long enough for the server to respond.
          //
          // The onLoad error below won't be triggered until that time
          // has elapsed, so we need to show something else that lets
          // the user know we didn't just walk away.
          var errorOverlay = $.tag({
            tagName: 'div',
            'class': 'esriConnectorWarning',
            contents: [{
              tagName: 'div',
              contents: $.t('controls.map.unable_to_load_map_html')
            }, {
              tagName: 'div',
              'class': 'loadingSpinner minimal'
            }]
          });
          var errorOverlayTimer = setTimeout(function() {
            $('.visualizationArea').prepend(errorOverlay);
          }, 2000);

          dojo.connect(layer.featureLayer, 'onError', function() {
            // Something went wrong with the request for the customer's endpoint.
            // This could be a 404/500 error, or it could be a 200
            // with an embedded error code/detail in the response.
            errorOverlay.find('.loadingSpinner').remove();
          });

          dojo.connect(layer.featureLayer, 'onLoad', function() {
            clearTimeout(errorOverlayTimer);
            errorOverlay.remove();

            layer.showNoFeaturesWarning();

            layer.map.events.register('zoomend', null, function() {
              layer.showNoFeaturesWarning();
            });

            if ($.subKeyDefined(layer, 'featureLayer.renderer.infos')) {
              layer._suggestedTolerance = Math.round(Math.max.apply(null,
                _.chain(layer.featureLayer.renderer.infos).
                map(function(info) {
                  return [info.symbol.height, info.symbol.width];
                }).
                flatten().compact().value()));

              // Sometimes there are renderer.infos but no height/widths.
              // In such a case, the above evaluates to negative infinity.
              if (!isFinite(layer._suggestedTolerance)) {
                delete layer._suggestedTolerance;
              }
            }

            layer.name = layer.featureLayer.name;
            if ($.subKeyDefined(layer.dataObj, '_parent._controls.Overview.redraw')) {
              layer.dataObj._parent._controls.Overview.redraw();
            }

            var objectIdField = _.detect(layer.featureLayer.fields, function(field) {
              return field.type == 'esriFieldTypeOID';
            });
            if (objectIdField) {
              layer.objectIdField = objectIdField;
              layer.objectIdKey = objectIdField.alias || objectIdField.name;
            }

            if (layer._metadataReady) {
              layer.onloadCallback();
            } else {
              layer._featureLayerReady = true;
            }
          });
        });
      }

      OpenLayers.Layer.ArcGIS93Rest.prototype.initialize.apply(this, arguments);
    },

    setMetadata: function(metadata) {
      var layer = this;
      this.metadata = metadata;
      if (!this.externalMapProjection.proj.readyToUse) {
        this.externalMapProjection.proj.queue.push(function() {
          layer.setInitialExtent();
        });
      } else {
        this.setInitialExtent();
      }
    },

    setInitialExtent: function() {
      this.initialExtent = this.metadata.initialExtent.
        transform(blist.openLayers.geographicProjection, this.internalMapProjection);
      if (this._featureLayerReady || !this.secure) {
        this.onloadCallback();
      } else {
        this._metadataReady = true;
      }
    },

    convertEsriToOpenLayers: function(bounds) {
      return new OpenLayers.Bounds(bounds.xmin, bounds.ymin, bounds.xmax, bounds.ymax).
        transform(this.externalMapProjection, this.internalMapProjection);
    },

    getInitialExtent: function() {
      return this.initialExtent;
    },

    filterWith: function(view) {
      var layer = this;
      if (!this.secure) {
        return;
      }
      view.bind('query_change', function() {
        layer.setLayerFilter(layer.layerId,
          transformFilterToLayerDefinition(view, layer.featureLayer));
        layer.redraw();
      });
    },

    getURL: function(bounds) {
      bounds = this.adjustBounds(bounds);

      // TODO: Remove this transformation and kill_esri_reprojection_and_pass_different_webm
      // feature flag when we remove kill_snowflake_map_projections
      var allowEsriReprojection = blist.feature_flags.kill_esri_reprojection_and_pass_different_webm !== true &&
        blist.feature_flags.kill_snowflake_map_projections !== true;
      if (allowEsriReprojection) {
        bounds = bounds.transform(this.projection, this.externalMapProjection);
      }

      // ArcGIS Server only wants the numeric portion of the projection ID.
      var projWords = this.projection.getCode().split(':');
      var srid = projWords[projWords.length - 1];
      var imageSize = this.getImageSize();
      var newParams = {
        'BBOX': bounds.toBBOX(),
        'SIZE': imageSize.w + ',' + imageSize.h,
        'F': 'image'
      };

      // TODO: Add BBOXSR and IMAGESR to the newParams above and remove include_sr_in_esri
      // feature flag when we remove kill_snowflake_map_projections.
      var includeSpatialReference = blist.feature_flags.include_sr_in_esri ||
        blist.feature_flags.kill_snowflake_map_projections;
      if (includeSpatialReference) {
        $.extend(newParams, {
          'BBOXSR': srid,
          'IMAGESR': srid
        });
      }

      // TODO: Remove this when we remove kill_snowflake_map_projections
      if (blist.feature_flags.kill_esri_reprojection_and_pass_different_webm === true) {
        $.extend(newParams, {
          'BBOXSR': 3857,
          'IMAGESR': 3857
        });
      }

      // Now add the filter parameters.
      if (this.layerDefs) {
        var layerDefStrList = [];
        var layerID;
        for (layerID in this.layerDefs) {
          if (this.layerDefs.hasOwnProperty(layerID)) {
            if (this.layerDefs[layerID]) {
              layerDefStrList.push(layerID);
              layerDefStrList.push(':');
              layerDefStrList.push(this.layerDefs[layerID]);
              layerDefStrList.push(';');
            }
          }
        }
        if (layerDefStrList.length > 0) {
          newParams.LAYERDEFS = layerDefStrList.join('');
        }
      }
      return this.getFullRequestString(newParams);
    },

    showNoFeaturesWarning: function() {
      var layer = this;

      // If the map's current zoom level is beyond the layer's minScale or maxScale
      // (as set in ESRI) display an error message informing the user that ESRI
      // isn't returning any features for that layer at that zoom level.
      var esriMinScale = layer.featureLayer.minScale;
      var esriMaxScale = layer.featureLayer.maxScale;

      // If the scales is not 0 or NaN, it's actually set
      var esriMinSet = !_.isNaN(esriMinScale) && esriMinScale !== 0;
      var esriMaxSet = !_.isNaN(esriMaxScale) && esriMaxScale !== 0;

      var currentScale = layer.map.getScale();

      var noFeaturesWarningOverlay = $.tag2({
        _: 'div',
        'class': 'esriConnectorWarning',
        'id': 'noFeaturesWarning',
        contents: $.t('controls.map.unable_to_display_features_html')
      });

      // Note that the scale gets bigger as you zoom in and smaller as you zoom out
      if ((esriMinSet && currentScale > esriMinScale) || (esriMaxSet && currentScale < esriMaxScale)) {
        if ($('.visualizationArea #noFeaturesWarning').length == 0) {
          $('.visualizationArea').prepend(noFeaturesWarningOverlay);
        }
      } else {
        $('.visualizationArea #noFeaturesWarning').remove();
      }
    }
  });

  $.Control.registerMixin('arcgis', {
    initializeLayer: function() {
      var layerObj = this;

      var layerUrl = layerObj._view.metadata.custom_fields.Basic.Source;
      var tmp = layerUrl.split('/');
      var layerId = tmp.pop();
      var exportUrn = tmp.join('/') + '/export';

      var singleTile = _.isUndefined(layerObj._displayFormat.singleTile) ?
        true : layerObj._displayFormat.singleTile;

      var layer = layerObj._displayLayer = new blist.openLayers.ExternalESRILayer(layerUrl, exportUrn, {
        layers: 'show:' + layerId,
        transparent: true,
        internalMapProjection: layerObj._mapProjection,
        externalMapProjection: layerObj.extractSpatialReference(),
        onloadCallback: function() {
          if (layerObj._identifyParameters && layer._suggestedTolerance) {
            layerObj._identifyParameters.tolerance = layer._suggestedTolerance;
          }
          layer.filterWith(layerObj._view);
          layerObj.zoomToPreferred();
        }
      }, {
        opacity: layerObj.extractOpacity(),
        ratio: 1,
        singleTile: singleTile,
        isBaseLayer: false
      });
      layerObj._map.addLayer(layerObj._displayLayer);
      layer.dataObj = this;

      // We pull in a suitable spatial extent on load; that is more reliable than
      // pulling it in from the layer metadata.
      if (layerObj._view.northWest) {
        layer.setMetadata({
          initialExtent: OpenLayers.Bounds.fromDatasetMetadata(layerObj._view)
        });
      } else {
        layerObj._view.getParentView(function(parentView) {
          if (!_.isEmpty(parentView)) {
            layer.setMetadata({
              initialExtent: OpenLayers.Bounds.fromDatasetMetadata(parentView)
            });
          }
        });
      }

      if (layer.secure) {
        layerObj.buildIdentifyParameters();
        layerObj.buildAttributeMap();
        layerObj._map.events.register('click', layerObj, layerObj.clickFeature);
      }

      layer.events.register('loadend', layerObj._parent, function() {
        if (!layerObj._dataLoaded) {
          layerObj._dataLoaded = true;
          layer.redraw();
        }
        this.mapElementLoaded(layer);
      });
    },

    destroy: function() {
      this._super();
      this._displayLayer.destroy();
      this._map.events.unregister('click', this, this.clickFeature);
    },

    dataLayers: function() {
      return this._displayLayer;
    },

    calculateSymbolSize: function() {
      var view = this._view;

      var symbolSize = 3;
      if (view.metadata.custom_fields['drawingInfo.renderer']) {
        var symbolDimensions = [symbolSize];
        if (view.metadata.custom_fields['drawingInfo.renderer']['symbol.width']) {
          symbolDimensions.push(parseInt(
            view.metadata.custom_fields['drawingInfo.renderer']['symbol.width']), 10);
        }
        if (view.metadata.custom_fields['drawingInfo.renderer']['symbol.height']) {
          symbolDimensions.push(parseInt(
            view.metadata.custom_fields['drawingInfo.renderer']['symbol.height']), 10);
        }
        symbolSize = Math.max.apply(null, symbolDimensions);
      }
      if (this._displayLayer._suggestedTolerance) {
        symbolSize = Math.max(symbolSize, this._displayLayer._suggestedTolerance);
      }

      return Math.round(symbolSize);
    },

    buildIdentifyParameters: function() {
      var layerObj = this;

      layerObj._identifyParameters = new esri.tasks.IdentifyParameters();
      layerObj._identifyParameters.tolerance = layerObj.calculateSymbolSize();
      layerObj._identifyParameters.returnGeometry = true;
      layerObj._identifyParameters.layerOption =
        esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
      layerObj._identifyParameters.width = layerObj._map.getSize().w;
      layerObj._identifyParameters.height = layerObj._map.getSize().h;
      layerObj._identifyParameters.layerIds = [layerObj._displayLayer.layerId];
    },

    buildAttributeMap: function() {
      var layerObj = this;

      layerObj._attrMap = {};
      _.each(layerObj._view.realColumns, function(col) {
        layerObj._attrMap[col.name] = col.lookup;
        layerObj._attrMap[col.description] = col.lookup;
      });
    },

    clickFeature: function(evt) {
      var layerObj = this;
      var layer = layerObj._displayLayer;
      if (layer.visibility === false || layer.opacity === 0) {
        return;
      } // Don't request data for invisible layer.

      var pixel = layerObj._map.events.getMousePosition(evt);
      var sr = new esri.SpatialReference({
        wkid: layerObj._mapProjection.projCode.split(':')[1]
      });
      var lonlat = layer.getLonLatFromViewPortPx(pixel);
      var geometry = new esri.geometry.Point(lonlat.lon, lonlat.lat, sr);

      // On first load, the map is offset somehow.
      pixel.y = layerObj._map.getSize().h / 2;
      var offsetLat = layer.getLonLatFromViewPortPx(pixel).lat - layerObj._map.getCenter().lat;
      layerObj._offsetLat = offsetLat;
      geometry.y -= offsetLat;
      var extent = layer.getExtent();
      extent = new esri.geometry.Extent(extent.left, extent.bottom + offsetLat,
        extent.right, extent.top + offsetLat);

      var layerDefs = [];
      if (layer.layerDefs) {
        for (var i in layer.layerDefs) {
          layerDefs[i] = layer.layerDefs[i];
        }
      }

      layerObj._identifyParameters.geometry = geometry;
      layerObj._identifyParameters.mapExtent = extent;
      layerObj._identifyParameters.layerDefinitions = layerDefs;

      lonlat.lat -= offsetLat;
      layerObj.flyoutHandler().sayLoading(lonlat);

      new esri.tasks.IdentifyTask(layer.url.replace(/\/export$/, '')).
        execute(layerObj._identifyParameters, function(idResults) {
            if (_.isEmpty(idResults)) {
              layerObj.flyoutHandler().cancel();
              return;
            }

            var objectIdKey = layerObj._displayLayer.objectIdKey || 'OBJECTID';
            var objectids = _.map(idResults, function(feature) {
              return feature.feature ? feature.feature.attributes[objectIdKey] :
                feature.attributes[objectIdKey];
            });

            var objectIdFieldName = (_.detect(layerObj._view.realColumns, function(col) {
              return col.name == (layerObj._displayLayer.objectIdField || {}).name;
            }) || {}).fieldName || objectIdKey;

            // Yes, this is a Core request inside a callback from an ESRI request.
            // That is how awesome our ESRI integration is.
            layerObj._view.makeRequest({
              url: '/resource/' + layerObj._view.id + '.json',
              isSODA: true,
              params: {
                '$$exclude_system_fields': false,
                '$where': 'any_of(' + objectIdFieldName + ', ' + objectids.join(',') + ')'
              },
              success: function(results) {
                var flyoutContent = layerObj.getFlyout(idResults, results);
                if (flyoutContent) {
                  flyoutContent = flyoutContent[0].innerHTML;
                }

                layerObj.flyoutHandler().add(layerObj, lonlat, flyoutContent);
              },
              error: function() {
                layerObj.flyoutHandler().cancel();
              }
            });
          },
          function(error) {
            if (error.dojoType == 'timeout') {
              layerObj.flyoutHandler().add(layerObj, lonlat, $.t('controls.map.request_timed_out'));
            }
          });
    },

    // TODO: This still relies on view.displayFormat on the original view.
    // It actually makes a lot of sense for this case, so I'm not changing it until it's needed.
    extractSpatialReference: function() {
      var layerObj = this;
      var view = layerObj._view;

      if (view.metadata.custom_fields.Basic['Spatial Reference wkid']) {
        return new OpenLayers.Projection('EPSG:' +
          view.metadata.custom_fields.Basic['Spatial Reference wkid']);
      } else if (view.metadata.custom_fields.Basic['Spatial Reference wkt']) {
        if (view.displayFormat.projection) {
          layerObj._displayLayer.externalMapProjection = new OpenLayers.Projection('EPSG:' + view.displayFormat.projection);
        } else {
          var url = '/proxy/wkt_to_wkid?wkt=' +
            encodeURI(blist.dataset.metadata.custom_fields.Basic['Spatial Reference wkt']);
          $.getJSON(url, function(data) {
            if (data.exact) {
              layerObj._displayLayer.externalMapProjection = new OpenLayers.Projection('EPSG:' + data.codes[0].code);
              view.update({
                displayFormat: $.extend({}, view.displayFormat, {
                  projection: data.codes[0].code
                })
              }, false, false);
              view.save();
            }
          });
        }
      }

      return null;
    },

    extractOpacity: function() {
      var view = this._view;

      var opacity;
      if (_.isNumber((this._displayFormat || {}).opacity)) {
        opacity = this._displayFormat.opacity;
      } else if ($.subKeyDefined(view, 'metadata.custom_fields.drawingInfo.transparency')) {
        opacity = parseInt(view.metadata.custom_fields.drawingInfo.transparency, 10) / 100;
        // ArcGIS Server defaults transparency to 0, resulting in many datasets
        // created with this default when they don't mean it.
        if (opacity == 0) {
          opacity = 1;
        }
      }
      return opacity;
    },

    getFlyout: function(features, complementRows) {
      var layerObj = this;
      var objectIdKey = layerObj._displayLayer.objectIdKey || 'OBJECTID';

      if (features[0].feature) {
        features = _.pluck(features, 'feature');
      }

      var rows = _.map(features, function(feature) {
        var dsRow = _.detect(complementRows, function(cRow) {
          return cRow[':id'] == feature.attributes[objectIdKey];
        }) || {};

        var row = {
          data: {},
          id: dsRow[':id']
        };
        _.each(feature.attributes, function(val, attr) {
          row.data[layerObj._attrMap[attr]] = val;
        });
        return row;
      });

      return this._super(rows);
    },

    preferredExtent: function() {
      return this._displayLayer.getInitialExtent();
    }
  }, {
    showRowLink: false
  }, 'socrataDataLayer', 'tiledata');

  var transformFilterToLayerDefinition = function(view, featureLayer) {
    var applyFilters = function() {
      var filterCond = view.cleanFilters(true);
      if (_.isEmpty(filterCond)) {
        return '1=1';
      }

      var template = {
        'EQUALS': '<%= field %> = <%= val1 %>',
        'NOT_EQUALS': '<%= field %> != <%= val1 %>',
        'STARTS_WITH': '<%= field %> LIKE \'<%= val1 %>%\'',
        'CONTAINS': '<%= field %> LIKE \'%<%= val1 %>%\'',
        'NOT_CONTAINS': '<%= field %> NOT LIKE \'%<%= val1 %>%\'',
        'IS_NOT_BLANK': '<%= field %> IS NOT NULL',
        'IS_BLANK': '<%= field %> IS NULL',
        'LESS_THAN': '<%= field %> < <%= val1 %>',
        'LESS_THAN_OR_EQUALS': '<%= field %> <= <%= val1 %>',
        'GREATER_THAN': '<%= field %> > <%= val1 %>',
        'GREATER_THAN_OR_EQUALS': '<%= field %> >= <%= val1 %>',
        'BETWEEN': '<%= field %> BETWEEN <%= val1 %> AND <%= val2 %>'
      };
      var transformFilterToSQL = function(filter) {
        var fieldName = processFilter(filter.children[0]);
        var field = _.detect(featureLayer.fields,
          function(fieldToCheck) {
            return fieldToCheck.name == fieldName;
          });

        var value = [];
        value.push(processFilter(filter.children[1]));
        value.push(processFilter(filter.children[2]));
        value = _.compact(value);

        // From http://help.arcgis.com/EN/webapi/javascript/arcgis/help/jsapi/field.htm#type
        // Can be one of the following:
        // "esriFieldTypeSmallInteger", "esriFieldTypeInteger",
        // "esriFieldTypeSingle",       "esriFieldTypeDouble",
        // "esriFieldTypeString",       "esriFieldTypeDate",
        // "esriFieldTypeOID",          "esriFieldTypeGeometry",
        // "esriFieldTypeBlob",         "esriFieldTypeRaster",
        // "esriFieldTypeGUID",         "esriFieldTypeGlobalID",
        // "esriFieldTypeXML"

        // TODO: Need to figure out which types are PostgreSQL strings.
        if (_.include(['String'], field.type.substr(13)) &&
          !_.include(['STARTS_WITH', 'CONTAINS', 'NOT_CONTAINS'],
            filter.value)) {
          value = _.map(value, function(v) {
            return "'" + v.toString().replace(/'/g, "\\'") + "'";
          });
        } else {
          value = _.map(value, function(v) {
            return v.toString().replace(/;.*$/, '');
          });
        }

        return _.template(template[filter.value], {
          field: fieldName,
          val1: value[0],
          val2: value[1]
        });
      };
      var processFilter = function(filter) {
        if (!filter) {
          return null;
        }
        switch (filter.type) {
          case 'operator':
            switch (filter.value) {
              case 'AND':
                return _.compact(_.map(filter.children, function(childFilter) {
                  return processFilter(childFilter);
                })).join(' AND ');
              case 'OR':
                return _.compact(_.map(filter.children, function(childFilter) {
                  return processFilter(childFilter);
                })).join(' OR ');
              default:
                return transformFilterToSQL(filter);
            }
          case 'column':
            return blist.dataset.columnForIdentifier(filter.columnFieldName).name;
          case 'literal':
            return filter.value;
        }
      };
      return processFilter(filterCond);
    };
    return applyFilters();
  };

})(jQuery);
