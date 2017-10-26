import _ from 'lodash';
import $ from 'jquery';
import choroplethTestData from '../choroplethTestData/choroplethTestData';
import svgRegionMapTestData from '../svgRegionMapTestData/svgRegionMapTestData';
import { soqlVifValidator } from 'common/visualizations/dataProviders/SoqlVifValidator';
import { __RewireAPI__ as SocrataSvgRegionMapAPI } from 'common/visualizations/SvgRegionMap';

describe('SvgRegionMap jQuery component', function() {
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
      // If you change to true, make sure to mock out the resultant MetadataProvider request.
      viewSourceDataLink: false,
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
        flyout_selected_notice: 'This column is selected'
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
      });
    });

    describe('given valid arguments', function() {
      beforeEach(function() {

        GEOJSON_RESPONSE = svgRegionMapTestData.multiPolygonData2;
        SHAPEFILE_METADATA_RESPONSE = svgRegionMapTestData.shapefileMetadataResponse;
        FEATURE_EXTENT_RESPONSE = svgRegionMapTestData.featureExtentResponse;

        // Mock data providers
        SocrataSvgRegionMapAPI.__Rewire__('getSoqlVifValidator', function(vif) {
          const mock = {
            requireAtLeastOneSeries: () => mock,
            requireMeasureAggregation: () => mock,
            requirePointDimension: () => mock,
            toPromise: () => new Promise(() => {
              // IMPORTANT: We never resolve the soqlVifValidator promise here in tests
              // because otherwise, we'd have to know when to reset the DataProvider
              // mocks (this isn't easy - the map makes many chained requests which
              // must _all_ finish before we can reset the dependency).
            })
          };

          return Promise.resolve(mock);
        });

        SocrataSvgRegionMapAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = function() {
            return new Promise(function(resolve, reject) { return resolve(SHAPEFILE_METADATA_RESPONSE); });
          };
        });

        SocrataSvgRegionMapAPI.__Rewire__('GeospaceDataProvider', function() {
          this.getShapefile = function() {
            return new Promise(function(resolve, reject) { return resolve(GEOJSON_RESPONSE); });
          };
          this.getFeatureExtent = function() {
            return new Promise(function(resolve, reject) { return resolve(FEATURE_EXTENT_RESPONSE); });
          };
        });

        SocrataSvgRegionMapAPI.__Rewire__('SoqlDataProvider', function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(SOQL_RESPONSE); });
          };
        });
      });

      afterEach(function() {

        // Restore old data providers
        SocrataSvgRegionMapAPI.__ResetDependency__('getSoqlVifValidator');
        SocrataSvgRegionMapAPI.__ResetDependency__('MetadataProvider');
        SocrataSvgRegionMapAPI.__ResetDependency__('GeospaceDataProvider');
        SocrataSvgRegionMapAPI.__ResetDependency__('SoqlDataProvider');

        // Remove visualizaton
        destroyVisualization($container);
      });

      describe('on initialization', function() {
        var stubRegionMap;

        beforeEach(function() {
          stubRegionMap = sinon.stub().returns({
            render: _.noop,
            renderError: _.noop,
            showBusyIndicator: _.noop,
            hideBusyIndicator: _.noop,
            destroy: _.noop,
            shouldDisplayFilterBar: _.constant(false)
          });

          SocrataSvgRegionMapAPI.__Rewire__('SvgRegionMap', stubRegionMap);
        });

        afterEach(function() {
          SocrataSvgRegionMapAPI.__ResetDependency__('SvgRegionMap');
        });

        it('invokes $.fn.socrataSvgRegionMap', function() {
          $container.socrataSvgRegionMap(regionMapVif);
          sinon.assert.calledOnce(stubRegionMap);
        });
      });
    });
  });
});
