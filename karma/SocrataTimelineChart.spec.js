describe('SocrataTimelineChart component', function() {

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
    domain: 'data.cityofchicago.org',
    datasetUid: '6zsd-86xi',
    columnName: 'date',
    configuration: {
      localization: {
        'NO_VALUE': 'No value',
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
        'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
        'FLYOUT_SELECTED_NOTICE': 'This column is selected',
      },
      precision: 'MONTH'
    },
    filters: [],
    unit: {
      one: 'case',
      other: 'cases'
    }
  };

  function destroyVisualization($container) {

    $container.destroySocrataTimelineChart();
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

      var actualSoqlDataProvider;

      beforeEach(function() {
        actualSoqlDataProvider = window.socrata.visualizations.SoqlDataProvider;
        window.socrata.visualizations.SoqlDataProvider = function() {
          this.query = function() {
            return new Promise(function(resolve, reject) { return resolve(QUERY_RESPONSE); });
          };
        };
      });

      afterEach(function() {

        window.socrata.visualizations.SoqlDataProvider = actualSoqlDataProvider;
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
    });
  });
});
