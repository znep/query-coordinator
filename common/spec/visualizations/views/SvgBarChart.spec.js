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
    ],
    errorBars: [
      ['10', [null, null]],
      ['20', [null, null]],
      ['30', [null, null]],
      ['40', [null, null]],
      ['50', [null, null]]
    ]
  };

  const noErrorBarsTestData = {
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
      'dimension', null, null, null
    ],
    rows: [
      ['10', 10, 10, 10],
      ['20', 20, 20, 20],
      ['30', 30, 30, 30],
      ['40', 40, 40, 40],
      ['50', 50, 50, 50]
    ],
    errorBars: [
      ['10', [null, null], [null, null], [null, null]],
      ['20', [null, null], [null, null], [null, null]],
      ['30', [null, null], [null, null], [null, null]],
      ['40', [null, null], [null, null], [null, null]],
      ['50', [null, null], [null, null], [null, null]],
    ],
    columnFormats: {}
  };

  const zerosTestData = {
    columns: [
      'dimension',
      'measure'
    ],
    rows: [
      ['apples', 0],
      ['oranges', 0],
      ['plums', 0]
    ]
  };

  const oneHundredPercentStackedTestData = {
    columns: [
      'dimension', null, null, null, null
    ],
    rows: [
      ['10', 10, 10, 10, 10]
    ]
  };

  const oneHundredPercentNegativeStackedTestData = {
    columns: [
      'dimension', null, null, null, null
    ],
    rows: [
      ['10', 10, 10, -10, -10]
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

  describe('when configured to show 100% stacked bars', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('should render the stacked bars', () => {

      barChart = createBarChart(null, {
        series:[{
          stacked: {
            oneHundredPercent: true
          }
        }]
      });

      barChart.chart.render(null, oneHundredPercentStackedTestData);

      // There should be 1 bar group
      const $groups = barChart.element.find('.dimension-group');
      assert.equal($groups.length, 1);

      // There should be 4 bars in the group
      const $bars = barChart.element.find('.bar');
      assert.equal($bars.length, 4);

      // The sum of the absolute values of the data-percent attributes should be 100
      const percents = [];
      $bars.each(function() {
        const percent = Math.abs(parseFloat($(this).attr('data-percent')));
        percents.push(percent);
      });

      const sum = _.sum(percents);
      assert.equal(sum, 100);
    });
  });

  describe('when configured to show 100% stacked bars with negative values', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('should render the stacked bars', () => {

      barChart = createBarChart(null, {
        series:[{
          stacked: {
            oneHundredPercent: true
          }
        }]
      });

      barChart.chart.render(null, oneHundredPercentNegativeStackedTestData);

      // There should be 1 bar group
      const $groups = barChart.element.find('.dimension-group');
      assert.equal($groups.length, 1);

      // There should be 4 bars in the group
      const $bars = barChart.element.find('.bar');
      assert.equal($bars.length, 4);

      // The sum of the absolute values of the data-percent attributes should be 100
      const percents = [];
      $bars.each(function() {
        const percent = Math.abs(parseFloat($(this).attr('data-percent')));
        percents.push(percent);
      });

      const sum = _.sum(percents);
      assert.equal(sum, 100);
    });
  });

  describe('when configured to show error bars', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('should render the error bars', () => {

      barChart = createBarChart(null, {
        series:[{
          errorBars: {
            lowerBoundColumnName: 'column_0',
            upperBoundColumnName: 'column_1'
          }
        }]
      });

      barChart.chart.render(null, testData);

      // Verify error bars exist
      //
      const $errorBarLeft = barChart.element.find('.error-bar-left');
      assert.isTrue(($errorBarLeft.length > 0), 'Error bars not rendered');

      const $errorBarMiddle = barChart.element.find('.error-bar-middle');
      assert.isTrue(($errorBarMiddle.length > 0), 'Error bars not rendered');

      const $errorBarRight = barChart.element.find('.error-bar-right');
      assert.isTrue(($errorBarRight.length > 0), 'Error bars not rendered');
    });
  });

  describe('when configured to not show error bars', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('should not render the error bars', () => {

      barChart = createBarChart(null, {});
      barChart.chart.render(null, noErrorBarsTestData);

      // Verify error bars do not exist
      //
      const $errorBars = barChart.element.find('.error-bar-middle');
      assert.isTrue($errorBars.length == 0, 'Error bars not rendered');
    });
  });

  describe('when rendering multi-series', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });
    it('should show multiple bars', () => {
      // Add a series.
      barChart = createBarChart(null, {
        series: {
          1: {
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
        }
      });
      barChart.chart.render(null, multiSeriesTestData);
      assert.isTrue(barChart.chart.isMultiSeries());
      const $bars = barChart.element.find('.dimension-group:first > .bar');
      assert.equal($bars.length, 3);
    });
  });

  describe('given values of 0', () => {
    let barChart;

    afterEach(function() {
      removeBarChart(barChart);
    });

    it('renders bars with 0 values', () => {
      barChart = createBarChart();
      barChart.chart.render(null, zerosTestData);

      const $bars = barChart.element.find('.bar-chart rect.bar');
      assert.isTrue(_.every($bars, (bar) => {
        let value = _.get(bar, 'attributes.width.value', null);
        return value === '0';
      }));
    });
  });
});
