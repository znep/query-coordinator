import _ from 'lodash';
import $ from 'jquery';
import { __RewireAPI__ as TimelineChartAPI } from 'common/visualizations/TimelineChart';

describe('TimelineChart jQuery component', function() {

  'use strict';

  var NAME_ALIAS = '__NAME_ALIAS__';
  var VALUE_ALIAS = '__VALUE_ALIAS__';

  var EXPECTED_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  var EXPECTED_ROWS = [
    ['2014-07-01T00:00:00.000', 100],
    ['2014-07-02T00:00:00.000', 200]
  ];

  var QUERY_RESPONSE = {
    columns: EXPECTED_COLUMNS,
    rows: EXPECTED_ROWS
  };

  var $container;
  var timelineChartVIF = {
    aggregation: {
      columnName: null,
      'function': 'count'
    },
    domain: 'data.cityofchicago.org',
    datasetUid: '6zsd-86xi',
    columnName: 'date',
    configuration: {
      localization: {
        'no_value': 'No value',
        'flyout_unfiltered_amount_label': 'Total',
        'flyout_filtered_amount_label': 'Filtered',
        'flyout_selected_notice': 'This column is selected'
      },
      precision: 'MONTH'
    },
    filters: [],
    type: 'timelineChart',
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

    $container = $('<div>').attr('id', 'test-timeline-chart').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  describe('constructor', function() {

    describe('given invalid arguments', function() {

      it('should throw an error.', function() {

        assert.throws(function() { $container.socrataTimelineChart(); });

        assert.throws(function() {
          var vif = _.cloneDeep(timelineChartVIF);

          delete vif.domain;

          $container.socrataTimelineChart(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(timelineChartVIF);

          delete vif.datasetUid;

          $container.socrataTimelineChart(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(timelineChartVIF);

          delete vif.columnName;

          $container.socrataTimelineChart(vif);
        });

        assert.throws(function() {
          var vif = _.cloneDeep(timelineChartVIF);

          delete vif.configuration;

          $container.socrataTimelineChart(vif);
        });
      });
    });

    describe('given valid arguments', function() {
      beforeEach(function() {
        TimelineChartAPI.__Rewire__('SoqlDataProvider', function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(QUERY_RESPONSE); });
          };
        });
      });

      afterEach(function() {
        destroyVisualization($container);
      });

      it('should render a timeline visualization.', function(done) {

        $container.socrataTimelineChart(timelineChartVIF);

        setTimeout(
          function() {
            assert.isAbove($('path.context').length, 0);
            assert.isAbove($('path.context-trace').length, 0);
            assert.isAbove($('path.shaded').length, 0);
            assert.isAbove($('path.shaded-trace').length, 0);
            done();
          },
          0
        );
      });

      it('emits a ...VIF_UPDATED event with a new filter when a date range is selected (simulated with a ...COLUMN_SELECTION event)', function(done) {
        var vif = _.cloneDeep(timelineChartVIF);

        vif.configuration.interactive = true;

        assert.equal(vif.filters.length, 0);

        $container.socrataTimelineChart(vif);
        $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {

          assert.isTrue(true, 'SOCRATA_VISUALIZATION_VIF_UPDATED event was received.');
          assert.equal(event.originalEvent.detail.filters.length, 1);
          done();
        });

        setTimeout(function() {
          $container.find('.chart-scroll')[0].dispatchEvent(
            new window.CustomEvent(
              'SOCRATA_VISUALIZATION_TIMELINE_FILTER',
              {
                detail: { start: new Date('2001-01-01T00:00:00'), end: new Date('2002-01-01T00:00:00') },
                bubbles: true
              }
            )
          );
        }, 0);
      });
    });
  });
});
