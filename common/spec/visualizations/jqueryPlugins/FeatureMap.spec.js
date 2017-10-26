import _ from 'lodash';
import $ from 'jquery';
import { __RewireAPI__ as SocrataFeatureMapAPI } from 'common/visualizations/FeatureMap';

describe('FeatureMap jQuery component', function() {

  'use strict';

  var isNotPhantom = !(/PhantomJS\/([0-9.]+)/.exec(navigator.userAgent));
  var NAME_ALIAS = '__NAME_ALIAS__';
  var VALUE_ALIAS = '__VALUE_ALIAS__';

  var EXPECTED_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  var EXPECTED_ROWS = [
    ['TEST NAME 1', 100],
    ['TEST NAME 2', 200]
  ];

  var QUERY_RESPONSE = {
    columns: EXPECTED_COLUMNS,
    rows: EXPECTED_ROWS
  };

  var TEST_DATASET_METADATA = { 'name':'Case Data from San Francisco 311', 'updatedAt':'2014-08-22T22:36:10.000Z', 'defaultPage':'cs5s-apnb', 'description':'Cases created since 7/1/2008 with location information', 'domain':'dataspace.demo.socrata.com', 'rowDisplayUnit':'Case', 'locale':'en_US', 'id':'r6t9-rak2', 'columns':{ 'request_details':{ 'name':'request details', 'fred':'text', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'text', 'position':9, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, ':version':{ 'description':'', 'fred':'text', 'name':':version', 'physicalDatatype':'row_version' }, 'point':{ 'name':'point', 'fred':'location', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'point', 'position':13, 'hideInTable':false, 'format':{}, 'dataTypeName':'point', 'renderTypeName':'point', 'defaultCardType':'feature', 'availableCardTypes':['feature'] }, 'source':{ 'name':'source', 'fred':'category', 'description':'Which medium was used to file the ticket', 'physicalDatatype':'text', 'position':14, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, ':Computed_qgg2gdwk_point':{ 'name':'Police Districts', 'fred':'location', 'description':'', 'computationStrategy':{ 'source_columns':['point'], 'parameters':{ 'region':'_qgg2-gdwk' }, 'strategy_type':'georegion_match_on_point' }, 'physicalDatatype':'text', 'position':17, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text' }, ':created_at':{ 'description':'', 'fred':'text', 'name':':created_at', 'physicalDatatype':'fixed_timestamp' }, 'closed':{ 'name':'closed', 'fred':'time', 'description':'Date case was closed', 'physicalDatatype':'floating_timestamp', 'position':3, 'hideInTable':false, 'format':{}, 'dataTypeName':'calendar_date', 'renderTypeName':'calendar_date', 'defaultCardType':'timeline', 'availableCardTypes':['timeline'] }, 'neighborhood':{ 'name':'neighborhood', 'fred':'category', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'text', 'position':12, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, 'media_url':{ 'name':'media url', 'fred':'text', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'text', 'position':15, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, 'request_type':{ 'name':'request type', 'fred':'category', 'description':'', 'physicalDatatype':'text', 'position':8, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, ':Computed_n8rpcfd9_point':{ 'name':'Neighborhoods', 'fred':'location', 'description':'', 'computationStrategy':{ 'source_columns':['point'], 'parameters':{ 'region':'_n8rp-cfd9' }, 'strategy_type':'georegion_match_on_point' }, 'physicalDatatype':'text', 'position':18, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text' }, 'opened':{ 'name':'opened', 'fred':'time', 'description':'Date case was filed', 'physicalDatatype':'floating_timestamp', 'position':2, 'hideInTable':false, 'format':{}, 'dataTypeName':'calendar_date', 'renderTypeName':'calendar_date', 'defaultCardType':'timeline', 'availableCardTypes':['timeline'] }, 'updated':{ 'name':'updated', 'fred':'time', 'description':'Time the case was updated', 'physicalDatatype':'floating_timestamp', 'position':4, 'hideInTable':false, 'format':{}, 'dataTypeName':'calendar_date', 'renderTypeName':'calendar_date', 'defaultCardType':'timeline', 'availableCardTypes':['timeline'] }, 'responsible_agency':{ 'name':'responsible agency', 'fred':'category', 'description':'Agency responsible for handling and managing the case', 'physicalDatatype':'text', 'position':6, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, ':Computed_a9zvgp2q_point':{ 'name':'Zip codes', 'fred':'location', 'description':'', 'computationStrategy':{ 'source_columns':['point'], 'parameters':{ 'region':'_a9zv-gp2q' }, 'strategy_type':'georegion_match_on_point' }, 'physicalDatatype':'text', 'position':19, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text' }, 'status':{ 'name':'status', 'fred':'category', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'text', 'position':5, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, ':Computed_ernjgade_point':{ 'name':'Supervisor Districts', 'fred':'location', 'description':'', 'computationStrategy':{ 'source_columns':['point'], 'parameters':{ 'region':'_ernj-gade' }, 'strategy_type':'georegion_match_on_point' }, 'physicalDatatype':'text', 'position':16, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text' }, 'address':{ 'name':'address', 'fred':'text', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'text', 'position':10, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, 'category':{ 'name':'category', 'fred':'category', 'description':'', 'physicalDatatype':'text', 'position':7, 'hideInTable':false, 'format':{}, 'dataTypeName':'text', 'renderTypeName':'text', 'defaultCardType':'search', 'availableCardTypes':['column', 'search'] }, ':updated_at':{ 'description':'', 'fred':'text', 'name':':updated_at', 'physicalDatatype':'fixed_timestamp' }, ':id':{ 'description':'', 'fred':'text', 'name':':id', 'physicalDatatype':'row_identifier' }, 'case_id':{ 'name':'caseid', 'fred':'identifier', 'description':'Unique identifier per 311 case', 'physicalDatatype':'number', 'position':1, 'hideInTable':false, 'format':{}, 'dataTypeName':'number', 'renderTypeName':'number', 'defaultCardType':'histogram', 'availableCardTypes':['histogram', 'column', 'search'] }, 'supervisor_district':{ 'name':'supervisor district', 'fred':'category', 'description':'Cases created since 7/1/2008 with location information', 'physicalDatatype':'number', 'position':11, 'hideInTable':false, 'format':{}, 'dataTypeName':'number', 'renderTypeName':'number', 'defaultCardType':'histogram', 'availableCardTypes':['histogram', 'column', 'search'] }, '*':{ 'availableCardTypes':['table'], 'defaultCardType':'table', 'name':'Data Table', 'description':'', 'fred':'*', 'physicalDatatype':'*' } }, 'ownerId':'8ibz-n25n', 'permissions':{ 'isPublic':true, 'rights':['read'] }, 'pages':{ 'publisher':[{ 'name':'San Francisco 311', 'largestTimeSpanDays':2199, 'description':'SF311 cases created since 7/1/2008 with location information.  You can find the type of request, as well as volume of requests and the request status.', 'primaryAmountField':null, 'cards':[{ 'activeFilters':[], 'cardSize':1, 'cardType':'timeline', 'expanded':false, 'fieldName':'opened' }, { 'activeFilters':[], 'cardSize':1, 'cardType':'column', 'expanded':false, 'fieldName':'category' }, { 'activeFilters':[], 'cardSize':1, 'cardType':'column', 'expanded':false, 'fieldName':'request_type' }, { 'activeFilters':[], 'cardSize':2, 'cardType':'timeline', 'expanded':false, 'fieldName':'closed' }, { 'activeFilters':[], 'cardSize':2, 'cardType':'timeline', 'expanded':false, 'fieldName':'updated' }, { 'activeFilters':[], 'cardSize':2, 'cardType':'feature', 'expanded':false, 'fieldName':'point' }, { 'activeFilters':[], 'cardSize':2, 'cardType':'column', 'expanded':false, 'fieldName':'source' }, { 'activeFilters':[], 'cardSize':2, 'cardType':'table', 'expanded':false, 'fieldName':'*' }], 'datasetId':'r6t9-rak2', 'pageId':'cs5s-apnb', 'version':1, 'primaryAggregation':null, 'defaultDateTruncFunction':'date_trunc_ym' }], 'user':[] } };

  var $container;
  var featureMapVIF = {
    format: {
      type: 'visualization_interchange_format',
      version: 1
    },
    domain: 'dataspace.demo.socrata.com',
    datasetUid: 'r6t9-rak2',
    columnName: 'category',
    configuration: {
      localization: {
        'flyout_filter_notice': 'There are too many points at this location',
        'flyout_filter_or_zoom_notice': 'Zoom in to see details',
        'flyout_dense_data_notice': 'Numerous',
        'flyout_click_to_inspect_notice': 'Click to see details',
        'flyout_click_to_locate_user_title': 'Click to show your position on the map',
        'flyout_click_to_locate_user_notice': 'You may have to give your browser permission to share your current location',
        'flyout_locating_user_title': 'Your position is being determined',
        'flyout_locate_user_error_title': 'There was an error determining your location',
        'flyout_locate_user_error_notice': 'Click to try again',
        'flyout_pan_zoom_disabled_warning_title': 'Panning and zooming has been disabled',
        'row_inspector_row_data_query_failed': 'Detailed information about these points cannot be loaded at this time',
        'user_current_position': 'Your current location (estimated)',
        'unit_one': 'record',
        'unit_other': 'records',
        'column_incompatibility_error': 'It\'s incompatible, yo.',
        'feature_extent_query_error': 'It\'s a feature extent error, yo.'
      }
    },
    filters: [],
    type: 'featureMap',
    unit: {
      one: 'record',
      other: 'records'
    }
  };

  function destroyVisualization($container) {
    $container.trigger('SOCRATA_VISUALIZATION_DESTROY');
    $container.remove();
  }

  beforeEach(function() {
    $container = $('<div>').attr('id', 'test-feature-map').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  afterEach(function() {
    $('#test-feature-map').remove();
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {

      it('should throw an error.', function() {

        assert.throws(function() { $container.socrataFeatureMap(); });

        assert.throws(function() {
          var vif = _.cloneDeep(featureMapVIF);

          delete vif.domain;

          $container.socrataFeatureMap(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(featureMapVIF);

          delete vif.datasetUid;

          $container.socrataFeatureMap(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(featureMapVIF);

          delete vif.columnName;

          $container.socrataFeatureMap(vif);
        });
      });
    });

    describe('given valid arguments', function() {

      beforeEach(function() {

        SocrataFeatureMapAPI.__Rewire__('SoqlDataProvider', function() {
          this.query = function() {
            return Promise.resolve(QUERY_RESPONSE);
          };

          this.buildBaseQuery = function() {};
        });

        SocrataFeatureMapAPI.__Rewire__('GeospaceDataProvider', function() {
          this.getFeatureExtent = function(columnName) {
            return Promise.resolve({
              southwest: [-90, -180],
              northeast: [90, 180]
            });
          };
        });

        SocrataFeatureMapAPI.__Rewire__('TileserverDataProvider', function() {
          this.buildTileGetter = function(whereClause) {
            return function tileGetter(zoom, x, y) {
              return Promise.resolve([]);
            };
          };
        });

        SocrataFeatureMapAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = function() {
            return Promise.resolve(TEST_DATASET_METADATA);
          };
        });
      });

      afterEach(function() {
        SocrataFeatureMapAPI.__ResetDependency__('SoqlDataProvider');
        SocrataFeatureMapAPI.__ResetDependency__('GeospaceDataProvider');
        SocrataFeatureMapAPI.__ResetDependency__('TileserverDataProvider');
        SocrataFeatureMapAPI.__ResetDependency__('MetadataProvider');
      });

      describe('on initialization', function() {
        var featureMapSpy;

        beforeEach(function() {

          featureMapSpy = sinon.spy(function() {
            this.render = function() {};
            this.renderError = function() {};
            this.destroy = function() {};
          });

          SocrataFeatureMapAPI.__Rewire__('FeatureMap', featureMapSpy);
        });

        afterEach(function() {
          SocrataFeatureMapAPI.__ResetDependency__('FeatureMap');
        });

        it('invokes socrata.visualization.featureMap', function() {
          $container.socrataFeatureMap(featureMapVIF);
          assert.isTrue(featureMapSpy.calledOnce);
        });
      });

      // Phantomjs does not support geolocation, so this button will not be rendered.
      // If you are running karma with a browser that supports it, this button should be rendered.
      if (isNotPhantom) {

        it('emits a flyout render event when the mouse is moved over the locate user button', function(done) {
          var vif = _.cloneDeep(featureMapVIF);
          vif.configuration.locateUser = true;

          $container.socrataFeatureMap(vif);

          $container.on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', function(event) {
            if (event.originalEvent.detail !== null) {
              assert.isTrue(true, 'Flyout was rendered.');
              done();
            }
          });

          setTimeout(function() {
            $container.find('.feature-map-locate-user-btn').trigger('mousemove');
          }, 0);
        });
      }

      it('emits a flyout render event when the mouse is moved over the pan and zoom disabled warning', function() {
        var vif = _.cloneDeep(featureMapVIF);
        vif.configuration.panAndZoom = true;

        $container.socrataFeatureMap(vif);

        $container.on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', function(event) {
          if (event.originalEvent.detail !== null) {
            assert.isTrue(true, 'Flyout was rendered.');
            done();
          }
        });

        setTimeout(function() {
          $container.find('.feature-map-pan-zoom-disabled-warning').trigger('mousemove');
        }, 0);
      });
    });
  });
});
