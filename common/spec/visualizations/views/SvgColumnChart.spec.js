const _ = require('lodash');
const $ = require('jquery');
const I18n = require('common/i18n').default;
const allLocales = require('common/i18n/config/locales').default;
const SvgColumnChart = require('common/visualizations/views/SvgColumnChart');

describe('SvgColumnChart', () => {
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

  const createColumnChart = (width, overrideVIF)  => {

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

    let columnChartVIF = {
      title: CHART_TITLE,
      description: CHART_DESCRIPTION,
      configuration: {
        bucketType: 'linear',
        axisLabels: {
          top: 'top',
          right: 'right',
          bottom: 'bottom',
          left: 'left'
        }
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
          type: 'columnChart',
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
      _.merge(columnChartVIF, overrideVIF);
    }

    const chart = new SvgColumnChart(element, columnChartVIF);

    return {
      element: element,
      chart: chart,
      renderOptions: {}
    };
  };

  const removeColumnChart = (columnChart) => {

    if (columnChart && columnChart.chart && columnChart.chart.hasOwnProperty('destroy')) {
      columnChart.element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      columnChart.chart.destroy();
      assert(columnChart.element.children().length === 0, 'chart destroy did not remove dom');
    }

    $('#chart').remove();
  };

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  describe('when configured to show legend and "Show Legend" button is clicked', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show the legend menu', () => {

      columnChart = createColumnChart(null, {
        configuration: {
          showLegend: true
        }
      });

      columnChart.chart.render(null, testData);

      // Verify button exists
      //
      const $button = columnChart.element.find('.socrata-legend-button');
      const buttonExists = ($button.length > 0);
      assert.isTrue(buttonExists, 'button actually does not exist')

      // Verify menu exists
      //
      const $legendMenu = columnChart.element.find('.socrata-legend-menu');
      const menuExists = ($legendMenu.length > 0);
      assert.isTrue(menuExists, 'menu actually does not exist')

      // Verify menu is not shown
      //
      let isMenuVisible = $legendMenu.is(':visible');
      assert.isFalse(isMenuVisible, 'menu actually is visible');

      $button.click();

      // Verify menu is shown
      //
      isMenuVisible = $legendMenu.is(':visible');
      assert.isTrue(isMenuVisible, 'menu actually is not visible');
    });
  });

  describe('when configured to show legend', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show the "Show Legend" button', () => {

      columnChart = createColumnChart(null, {
        configuration: {
          showLegend: true
        }
      });

      columnChart.chart.render(null, testData);

      // Verify button exists
      //
      const $button = columnChart.element.find('.socrata-legend-button');
      const buttonExists = ($button.length > 0);
      assert.isTrue(buttonExists, 'button actually does not exist')
    });
  });

  describe('when configured to not show legend', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show not the "Show Legend" button', () => {

      columnChart = createColumnChart(null, {
        configuration: {
          showLegend: false
        }
      });

      columnChart.chart.render(null, testData);

      // Verify button exists
      //
      const $button = columnChart.element.find('.socrata-legend-button');
      const buttonExists = ($button.length > 0);
      assert.isFalse(buttonExists, 'button actually exists')
    });
  });

  describe('when configured wrong', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than configuration.measureAxisMaxValue', () => {

      columnChart = createColumnChart(null, {
        configuration: {
          measureAxisMinValue: 2,
          measureAxisMaxValue: 1,
        }
      });
      columnChart.chart.render(null, testData);

      const errorMessage = columnChart.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Please ensure your minimum value is smaller than your maximum value.');
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than values within dataset', () => {

      columnChart = createColumnChart(null, {
        configuration: {
          measureAxisMinValue: 10000
        }
      });
      columnChart.chart.render(null, testData);

      const errorMessage = columnChart.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Minimum axis value cannot exceed values within dataset.');
    });
  });

  describe.only('when rendering multi-series', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show multiple columns', () => {
      columnChart = createColumnChart();
      columnChart.chart.render(null, multiSeriesTestData);
      const $columns = columnChart.element.find('.dimension-group:first > .column');
      assert.equal($columns.length, 3);
    });
  });
});
