import _ from 'lodash';
import $ from 'jquery';
import choroplethTestData from '../choroplethTestData/choroplethTestData';
import { __RewireAPI__ as SocrataChoroplethMapAPI } from 'common/visualizations/ChoroplethMap';

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
        flyout_selected_notice: 'The page is currently filtered by this value, click to clear it',
        flyout_unfiltered_amount_label: 'Total',
        flyout_filtered_amount_label: 'Filtered',
        no_value: '(No Value)',
        clear_filter_label: 'Clear filter',
        flyout_locate_user_error_title: 'There was an error determining your location',
        flyout_locate_user_error_notice: 'Click to try again',
        user_current_position: 'Your current location (estimated)'
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
          $container.socrataChoroplethMap();
        });

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

      beforeEach(function() {

        GEOJSON_RESPONSE = choroplethTestData.multiPolygonData2;
        SHAPEFILE_METADATA_RESPONSE = choroplethTestData.shapefileMetadataResponse;
        FEATURE_EXTENT_RESPONSE = choroplethTestData.featureExtentResponse;

        // Mock data providers
        SocrataChoroplethMapAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = function() {
            return new Promise(function(resolve, reject) { return resolve(SHAPEFILE_METADATA_RESPONSE); });
          };
        });

        SocrataChoroplethMapAPI.__Rewire__('GeospaceDataProvider', function() {
          this.getShapefile = function() {
            return new Promise(function(resolve, reject) { return resolve(GEOJSON_RESPONSE); });
          };
          this.getFeatureExtent = function() {
            return new Promise(function(resolve, reject) { return resolve(FEATURE_EXTENT_RESPONSE); });
          };
        });

        SocrataChoroplethMapAPI.__Rewire__('SoqlDataProvider', function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(SOQL_RESPONSE); });
          };
        });
      });

      afterEach(function() {

        // Restore old data providers
        SocrataChoroplethMapAPI.__ResetDependency__('MetadataProvider');
        SocrataChoroplethMapAPI.__ResetDependency__('GeospaceDataProvider');
        SocrataChoroplethMapAPI.__ResetDependency__('SoqlDataProvider');

        // Remove visualizaton
        destroyVisualization($container);
      });

      describe('on initialization', function() {

        var stubChoroplethMap;

        beforeEach(function() {
          stubChoroplethMap = sinon.stub().returns({
            render: _.noop,
            renderError: _.noop,
            destroy: _.noop,
            updateTileLayer: _.noop
          });

          SocrataChoroplethMapAPI.__Rewire__('ChoroplethMap', stubChoroplethMap);
        });

        afterEach(function() {
          SocrataChoroplethMapAPI.__ResetDependency__('ChoroplethMap');
        });

        it('invokes socrata.visualization.ChoroplethMap', function() {
          $container.socrataChoroplethMap(choroplethVIF);
          assert.isTrue(stubChoroplethMap.called);
        });
      });
    });
  });

  describe('ChoroplethMap component', function() {
    beforeEach(function() {

      GEOJSON_RESPONSE = choroplethTestData.multiPolygonData2;
      SHAPEFILE_METADATA_RESPONSE = choroplethTestData.shapefileMetadataResponse;
      FEATURE_EXTENT_RESPONSE = choroplethTestData.featureExtentResponse;

      // Mock data providers
      SocrataChoroplethMapAPI.__Rewire__('MetadataProvider', function() {
        this.getDatasetMetadata = function() {
          return new Promise(function(resolve, reject) { return resolve(SHAPEFILE_METADATA_RESPONSE); });
        };
      });

      SocrataChoroplethMapAPI.__Rewire__('GeospaceDataProvider', function() {
        this.getShapefile = function() {
          return new Promise(function(resolve, reject) { return resolve(GEOJSON_RESPONSE); });
        };
        this.getFeatureExtent = function() {
          return new Promise(function(resolve, reject) { return resolve(FEATURE_EXTENT_RESPONSE); });
        };
      });

      SocrataChoroplethMapAPI.__Rewire__('SoqlDataProvider', function() {
        this.query = function() {
          return new Promise(function(resolve, reject) { return resolve(SOQL_RESPONSE); });
        };
      });
    });

    afterEach(function() {

      // Restore old data providers
      SocrataChoroplethMapAPI.__ResetDependency__('MetadataProvider');
      SocrataChoroplethMapAPI.__ResetDependency__('GeospaceDataProvider');
      SocrataChoroplethMapAPI.__ResetDependency__('SoqlDataProvider');

      // Remove visualizaton
      destroyVisualization($container);
    });

    it('emits a flyout render event when the mouse is moved over the legend', function(done) {
      var vif = _.cloneDeep(choroplethVIF);

      $container.socrataChoroplethMap(vif);
      $container.on('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT', function(event) {
        if (event.originalEvent.detail !== null) {

          assert.isTrue(true, 'Flyout was rendered.');
          done();
        }
      });

      setTimeout(function() {
        $container.find('.choropleth-legend-color').trigger('mousemove');
      }, 0);
    });

    it('emits a ...VIF_UPDATED event with a new filter when a region is clicked (simulated with a ...SELECT_REGION event)', function(done) {
      var vif = _.cloneDeep(choroplethVIF);

      vif.configuration.interactive = true;

      assert.equal(vif.filters.length, 0);

      $container.socrataChoroplethMap(vif);
      $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {

        assert.isTrue(true, 'SOCRATA_VISUALIZATION_VIF_UPDATED event was received.');
        assert.equal(event.originalEvent.detail.filters.length, 1);
        done();
      });

      setTimeout(function() {
        $container.find('.choropleth-map-container')[0].dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION',
            {
              detail: { shapefileFeatureId: 'test' },
              bubbles: true
            }
          )
        );
      }, 0);
    });
  });
});
