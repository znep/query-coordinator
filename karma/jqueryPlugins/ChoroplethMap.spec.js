var rewire = require('rewire');
var SocrataChoroplethMap = rewire('../../src/ChoroplethMap');

describe('ChoroplethMap jQuery component', function() {

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
  var choroplethVIF = {
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
        NO_VALUE: 'No value',
        FLYOUT_UNFILTERED_AMOUNT_LABEL: 'Total',
        FLYOUT_FILTERED_AMOUNT_LABEL: 'Filtered',
        FLYOUT_SELECTED_NOTICE: 'This column is selected',
      },
      shapefile: {
        columns: {
          name: '__SOCRATA_HUMAN_READABLE_NAME__',
          unfiltered: '__SOCRATA_UNFILTERED_VALUE__',
          filtered: '__SOCRATA_FILTERED_VALUE__',
          selected: '__SOCRATA_FEATURE_SELECTED__'
        },
        geometryLabel: 'ward',
        primaryKey: '_feature_id',
        uid: 'snuk-a5kv'
      }
    },
    datasetUid: 'snuk-a5kv',
    domain: 'dataspace.demo.socrata.com',
    filters: [],
    unit: {
      one: 'crime',
      other: 'crimes'
    }
  };

  function destroyVisualization($container) {

    $container.destroySocrataChoroplethMap();
    $container.remove();
  }

  beforeEach(function() {

    $container = $('<div>').attr('id', 'test-choropleth').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {

      it('should throw an error', function() {

        assert.throws(function() { $container.socrataChoroplethMap(); });

        // missing columnName
        assert.throws(function() {
          var vif = _.cloneDeep(choroplethVIF);

          delete vif.columnName;

          $container.socrataChoroplethMap(vif);
        });

        // missing shapefile data
        assert.throws(function() {
          var vif = _.cloneDeep(choroplethVIF);

          delete vif.configuration.shapefile;

          $container.socrataChoroplethMap(vif);
        });

        // missing domain
        assert.throws(function() {
          var vif = _.cloneDeep(choroplethVIF);

          delete vif.domain;

          $container.socrataChoroplethMap(vif);
        });

        // missing datasetUid
        assert.throws(function() {
          var vif = _.cloneDeep(choroplethVIF);

          delete vif.datasetUid;

          $container.socrataChoroplethMap(vif);
        });

        // missing unit
        assert.throws(function() {
          var vif = _.cloneDeep(choroplethVIF);

          delete vif.unit;

          $container.socrataChoroplethMap(vif);
        });
      });
    });

    describe('given valid arguments', function() {
      var revertDataProviders;

      beforeEach(function() {

        GEOJSON_RESPONSE = window.choroplethTestData.multiPolygonData2;
        SHAPEFILE_METADATA_RESPONSE = window.choroplethTestData.shapefileMetadataResponse;
        FEATURE_EXTENT_RESPONSE = window.choroplethTestData.featureExtentResponse;

        // Mock data providers
        revertDataProviders = SocrataChoroplethMap.__set__({
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
        var stubChoroplethMap;

        beforeEach(function () {
          stubChoroplethMap = sinon.stub().returns({
            render: _.noop,
            renderError: _.noop,
            destroy: _.noop
          });

          revertVisualization = SocrataChoroplethMap.__set__({
            ChoroplethMap: stubChoroplethMap
          });
        });

        afterEach(function() {
          revertVisualization();
        });

        it('invokes socrata.visualization.ChoroplethMap', function() {
          $container.socrataChoroplethMap(choroplethVIF);
          assert.isTrue(stubChoroplethMap.called);
        });
      });
    });
  });

  describe('ChoroplethMap component', function() {
    var revertDataProviders;

    beforeEach(function() {

      GEOJSON_RESPONSE = window.choroplethTestData.multiPolygonData2;
      SHAPEFILE_METADATA_RESPONSE = window.choroplethTestData.shapefileMetadataResponse;
      FEATURE_EXTENT_RESPONSE = window.choroplethTestData.featureExtentResponse;

      // Mock data providers
      revertDataProviders = SocrataChoroplethMap.__set__({
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

    it('emits a flyout render event when the mouse is moved over the legend', function(done) {
      var vif = _.cloneDeep(choroplethVIF);

      $container.socrataChoroplethMap(vif);
      $container.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_EVENT', function(event) {
        if (event.originalEvent.detail !== null) {
          assert.isTrue(true, 'Flyout was rendered.');
          done();
        }
      });

      setTimeout(function() {
        $container.find('.choropleth-legend-color').trigger('mousemove');
      }, 0);
    });
  });
});
