import _ from 'lodash';
import $ from 'jquery';
import { __RewireAPI__ as SocrataColumnChartAPI } from 'common/visualizations/ColumnChart';

describe('ColumnChart jQuery component', function() {

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

  var $container;
  var columnChartVIF = {
    aggregation: {
      columnName: null,
      'function': 'count'
    },
    domain: 'dataspace.demo.socrata.com',
    datasetUid: 'r6t9-rak2',
    columnName: 'category',
    configuration: {
      localization: {
        'no_value': 'No value',
        'flyout_unfiltered_amount_label': 'Total',
        'flyout_filtered_amount_label': 'Filtered',
        'flyout_selected_notice': 'This column is selected'
      }
    },
    filters: [],
    type: 'columnChart',
    unit: {
      one: 'case',
      other: 'cases'
    }
  };

  function destroyVisualization($container) {
    $container.trigger('SOCRATA_VISUALIZATION_DESTROY');
    $container.remove();
  }

  beforeEach(function() {

    $container = $('<div>').attr('id', 'test-column-chart').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  afterEach(function() {
    destroyVisualization($container);
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {

      it('should throw an error.', function() {

        assert.throws(function() { $container.socrataColumnChart(); });

        assert.throws(function() {
          var vif = _.cloneDeep(columnChartVIF);

          delete vif.domain;

          $container.socrataColumnChart(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(columnChartVIF);

          delete vif.datasetUid;

          $container.socrataColumnChart(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(columnChartVIF);

          delete vif.columnName;

          $container.socrataColumnChart(vif);
        });
      });
    });

    describe('given valid arguments', function() {

      beforeEach(function() {
        SocrataColumnChartAPI.__Rewire__('SoqlDataProvider', function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(QUERY_RESPONSE); });
          };
        });
      });

      afterEach(function() {
        SocrataColumnChartAPI.__ResetDependency__('SoqlDataProvider');
      });

      it('renders a column chart visualization', function(done) {

        $container.socrataColumnChart(columnChartVIF);

        setTimeout(
          function() {
            assert.isAbove($('.bar-group').length, 0);
            done();
          },
          0
        );
      });

      it('re-renders a column chart visualization when the window is resized', function(done) {

        $container.socrataColumnChart(columnChartVIF);

        setTimeout(
          function() {
            $(window).trigger('resize');

            setTimeout(function() {
              assert.isTrue(true);
              done();
            },
              300
            );
          },
          0
        );
      });

      it('emits a ...VIF_UPDATED event with a new filter when a column is clicked (simulated with a ...COLUMN_SELECTION event)', function(done) {
        var vif = _.cloneDeep(columnChartVIF);

        vif.configuration.interactive = true;

        assert.equal(vif.filters.length, 0);

        $container.socrataColumnChart(vif);
        $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {

          assert.isTrue(true, 'SOCRATA_VISUALIZATION_VIF_UPDATED event was received.');
          assert.equal(event.originalEvent.detail.filters.length, 1);
          done();
        });

        setTimeout(function() {
          $container.find('.chart-scroll')[0].dispatchEvent(
            new window.CustomEvent(
              'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
              {
                detail: { name: 'test' },
                bubbles: true
              }
            )
          );
        }, 0);
      });
    });
  });
});
