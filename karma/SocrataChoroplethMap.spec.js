var rewire = require('rewire');
var SocrataChoroplethMap = rewire('../src/ChoroplethMap');

describe('SocrataChoroplethMap component', function() {

  'use strict';

  var GEOJSON_RESPONSE;

  var SOQL_RESPONSE = {
    rows: [
      ['TEST NAME 1', 100],
      ['TEST NAME 2', 200]
    ]
  };

  var $container;
  var choroplethVIF = {
    domain: 'dataspace.demo.socrata.com',
    datasetUid: 'snuk-a5kv',
    columnName: 'ward',
    configuration: {
      columns: {
        'ward': 'something'
      },
      legend: {
        type: 'discrete'
      },
      localization: {
        NULL_VALUE_LABEL: 'No value',
        FLYOUT_UNFILTERED_AMOUNT_LABEL: 'Total',
        FLYOUT_FILTERED_AMOUNT_LABEL: 'Filtered',
        FLYOUT_SELECTED_NOTICE: 'This column is selected',
      },
      shapefile: {
        columns: {},
        geometryLabel: 'ward',
        primaryKey: '_feature_id',
        uid: 'snuk-a5kv'
      }
    },
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

        // Mock data providers
        revertDataProviders = SocrataChoroplethMap.__set__({
          SoqlDataProvider: function() {
            this.query = function() {
              return new Promise(function(resolve, reject) { return resolve(SOQL_RESPONSE); });
            };
          },
          GeospaceDataProvider: function() {
            this.getShapefile = function() {
              return new Promise(function(resolve, reject) { return resolve(GEOJSON_RESPONSE); });
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
});
