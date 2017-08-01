const _ = require('lodash');
const $ = require('jquery');
const I18n = require('common/i18n').default;
const allLocales = require('common/i18n/config/locales').default
const SvgBarChart = require('common/visualizations/views/SvgBarChart');

describe('SvgBarChart', () => {
  const CHART_WIDTH = 640;
  const CHART_HEIGHT = 480;
  const CHART_TITLE = 'Test Title';
  const CHART_DESCRIPTION = 'test description';

  const testData = {
    columns: [
      'dimension', 'measure'
    ],
    rows: [
      ['10', 10],
      ['20', 20],
      ['30', 30],
      ['40', 40],
      ['50', 50]
    ]
  };

  const multiSeriesTestData = {
    columns: [
      'dimension', 'measure'
    ],
    rows: [
      ['10', 10, 10, 10],
      ['20', 20, 20, 20],
      ['30', 30, 30, 30],
      ['40', 40, 40, 40],
      ['50', 50, 50, 50]
    ]
  };

  const createBarChart = (width, overrideVIF)  => {

    if (!width) {
      width = CHART_WIDTH;
    }

    const element = $(
      '<div>',
      {
        'id': 'chart',
        'style': 'width:' + width + 'px;height:' + CHART_HEIGHT + 'px;'
      }
    );

    $('body').append(element);

    let barChartVIF = {
      title: CHART_TITLE,
      description: CHART_DESCRIPTION,
      configuration: {
        bucketType: 'linear',
        axisLabels: {
          top: 'top',
          right: 'right',
          bottom: 'bottom',
          left: 'left'
        },
        // If you change to true, make sure to mock out the resultant MetadataProvider request.
        viewSourceDataLink: false
      },
      series: [
        {
          color: {
            primary: 'gray',
            secondary: null,
            highlight: '#44aa00'
          },
          dataSource: {
            datasetUid: 'example',
            domain: 'example.com',
            dimension: {
              columnName: 'latitude',
              aggregationFunction: null
            },
            measure: {
              columnName: null,
              aggregationFunction: 'count'
            },
            type: 'socrata.soql',
            filters: []
          },
          label: 'Series 1',
          type: 'barChart',
          unit: {
            one: 'unit_one',
            other: 'unit_other'
          }
        }
      ],
      createdAt: '2014-01-01T00:00:00',
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      origin: {
        type: 'test_data',
        url: 'localhost'
      }
    };

    if (overrideVIF) {
      _.merge(barChartVIF, overrideVIF);
    }

    const chart = new SvgBarChart(element, barChartVIF);

    return {
      element: element,
      chart: chart,
      renderOptions: {}
    };
  };

  const removeBarChart = (barChart) => {

    if (barChart && barChart.chart && barChart.chart.hasOwnProperty('destroy')) {
      barChart.element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      barChart.chart.destroy();
      assert(
        barChart.element.children().length === 0,
        'chart destroy did not remove dom'
      );
    }

    $('#chart').remove();
  };

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  describe('when configured wrong', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than configuration.measureAxisMaxValue', () => {

      barChart = createBarChart(null, {
        configuration: {
          measureAxisMinValue: 2,
          measureAxisMaxValue: 1,
        }
      });
      barChart.chart.render(null, testData);

      const errorMessage = barChart.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Please ensure your minimum value is smaller than your maximum value.');
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than values within dataset', () => {

      barChart = createBarChart(null, {
        configuration: {
          measureAxisMinValue: 1000
        }
      });
      barChart.chart.render(null, testData);

      const errorMessage = barChart.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Minimum axis value cannot exceed values within dataset.');
    });
  });

  describe('when rendering multi-series', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('should show multiple bars', () => {
      barChart = createBarChart();
      barChart.chart.render(null, multiSeriesTestData);
      const $bars = barChart.element.find('.dimension-group:first > .bar');
      assert.equal($bars.length, 3);
    });
  });
});
