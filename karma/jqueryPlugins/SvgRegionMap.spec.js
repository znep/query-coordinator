var _ = require('lodash');
var $ = require('jquery');
var rewire = require('rewire');
var SocrataSvgRegionMapAPI = rewire('../../src/SvgRegionMap');
var SoqlVifValidator = rewire('../../src/dataProviders/SoqlVifValidator');

describe('SvgRegionMap jQuery component', function() {

  'use strict';

  var GEOJSON_RESPONSE;
  var SHAPEFILE_METADATA_RESPONSE;
  var FEATURE_EXTENT_RESPONSE;
  var SOQL_RESPONSE = {
    rows: [
      ['TEST NAME 1', 100],
      ['TEST NAME 2', 200]
    ]
  };
  var $container;
  var regionMapVif = {
    format: {
      type: 'visualization_interchange_format',
      version: 1
    },
    aggregation: {
      columnName: null,
      'function': 'count'
    },
    columnName: 'ward',
    configuration: {
      computedColumnName: ':@wards',
      defaultExtent : {
        southwest: [41.45919537950706, -90.24169921875],
        northeast: [42.20817645934742, -85.242919921875]
      },
      legend: {
        type: 'discrete'
      },
      localization: {
        no_value: 'No value',
        flyout_unfiltered_amount_label: 'Total',
        flyout_filtered_amount_label: 'Filtered',
        flyout_selected_notice: 'This column is selected',
      },
      shapefile: {
        geometryLabel: 'ward',
        primaryKey: '_feature_id',
        uid: 'snuk-a5kv'
      }
    },
    datasetUid: 'snuk-a5kv',
    domain: 'dataspace.demo.socrata.com',
    filters: [],
    type: 'choroplethMap',
    unit: {
      one: 'crime',
      other: 'crimes'
    }
  };

  function destroyVisualization($container) {
    $container.trigger('SOCRATA_VISUALIZATION_DESTROY');
    $container.remove();
  }

  beforeEach(function() {
    $container = $('<div>').attr('id', 'test-choropleth').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  afterEach(function() {
    $('#test-choropleth').remove();
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {
      it('should throw an error', function() {

        assert.throws(function() {
          $container.socrataSvgRegionMap();
        });

        // missing columnName
        assert.throws(function() {
          var vif = _.cloneDeep(regionMapVif);

          delete vif.columnName;

          $container.socrataSvgRegionMap(vif);
        });

        // missing shapefile data
        assert.throws(function() {
          var vif = _.cloneDeep(regionMapVif);

          delete vif.configuration.shapefile;

          $container.socrataSvgRegionMap(vif);
        });

        // missing domain
        assert.throws(function() {
          var vif = _.cloneDeep(regionMapVif);

          delete vif.domain;

          $container.socrataSvgRegionMap(vif);
        });

        // missing datasetUid
        assert.throws(function() {
          var vif = _.cloneDeep(regionMapVif);

          delete vif.datasetUid;

          $container.socrataSvgRegionMap(vif);
        });

        // missing unit
        assert.throws(function() {
          var vif = _.cloneDeep(regionMapVif);

          delete vif.unit;

          $container.socrataSvgRegionMap(vif);
        });
      });
    });

    describe('given valid arguments', function() {
      var revertDataProviders;

      beforeEach(function() {

        GEOJSON_RESPONSE = window.svgRegionMapTestData.multiPolygonData2;
        SHAPEFILE_METADATA_RESPONSE = window.svgRegionMapTestData.shapefileMetadataResponse;
        FEATURE_EXTENT_RESPONSE = window.svgRegionMapTestData.featureExtentResponse;

        // Mock data providers
        revertDataProviders = SocrataSvgRegionMapAPI.__set__({
          getSoqlVifValidator: function(vif) {
            const validator = SoqlVifValidator.soqlVifValidator(vif, [{
              columns: [{
                fieldName: 'ward',
                dataTypeName: 'point'
              }]
            }]);
            return Promise.resolve(
              validator
            );
          },
          MetadataProvider: function() {
            this.getDatasetMetadata = function() {
              return new Promise(function(resolve, reject) { return resolve(SHAPEFILE_METADATA_RESPONSE); });
            };
          },
          GeospaceDataProvider: function() {
            this.getShapefile = function() {
              return new Promise(function(resolve, reject) { return resolve(GEOJSON_RESPONSE); });
            };
            this.getFeatureExtent = function() {
              return new Promise(function(resolve, reject) { return resolve(FEATURE_EXTENT_RESPONSE); });
            };
          },
          SoqlDataProvider: function() {
            this.query = function() {
              return new Promise(function(resolve, reject) { return resolve(SOQL_RESPONSE); });
            };
          }
        });
      });

      afterEach(function() {

        // Restore old data providers
        revertDataProviders();

        // Remove visualizaton
        destroyVisualization($container);
      });

      describe('on initialization', function() {

        var revertVisualization;
        var stubRegionMap;

        beforeEach(function () {
          stubRegionMap = sinon.stub().returns({
            render: _.noop,
            renderError: _.noop,
            showBusyIndicator: _.noop,
            hideBusyIndicator: _.noop,
            destroy: _.noop
          });

          revertVisualization = SocrataSvgRegionMapAPI.__set__({
            SvgRegionMap: stubRegionMap
          });
        });

        afterEach(function() {
          revertVisualization();
        });

        it('invokes $.fn.socrataSvgRegionMap', function() {
          $container.socrataSvgRegionMap(regionMapVif);
          assert.isTrue(stubRegionMap.called);
        });
      });
    });
  });

  describe('events', function() {
    var revertDataProviders;

    beforeEach(function() {

      GEOJSON_RESPONSE = window.choroplethTestData.multiPolygonData2;
      SHAPEFILE_METADATA_RESPONSE = window.choroplethTestData.shapefileMetadataResponse;
      FEATURE_EXTENT_RESPONSE = window.choroplethTestData.featureExtentResponse;

      // Mock data providers
      revertDataProviders = SocrataSvgRegionMapAPI.__set__({
        getSoqlVifValidator: function(vif) {
          const validator = SoqlVifValidator.soqlVifValidator(vif, [{
            columns: [{
              fieldName: 'ward',
              dataTypeName: 'point'
            }]
          }]);
          return Promise.resolve(
            validator
          );
        },
        MetadataProvider: function() {
          this.getDatasetMetadata = function() {
            return new Promise(function(resolve, reject) { return resolve(SHAPEFILE_METADATA_RESPONSE); });
          };
        },
        GeospaceDataProvider: function() {
          this.getShapefile = function() {
            return new Promise(function(resolve, reject) { return resolve(GEOJSON_RESPONSE); });
          };
          this.getFeatureExtent = function() {
            return new Promise(function(resolve, reject) { return resolve(FEATURE_EXTENT_RESPONSE); });
          };
        },
        SoqlDataProvider: function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(SOQL_RESPONSE); });
          };
        }
      });
    });

    afterEach(function() {

      // Restore old data providers
      revertDataProviders();

      // Remove visualizaton
      destroyVisualization($container);
    });
  });
});
