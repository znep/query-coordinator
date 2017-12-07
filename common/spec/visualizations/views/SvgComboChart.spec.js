import _ from 'lodash';
import $ from 'jquery';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import SvgComboChart from 'common/visualizations/views/SvgComboChart';

describe('SvgComboChart', () => {
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
    errorBars:[
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
      'dimension', 'measure 1', 'measure 2', 'measure 3'
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
      ['50', [null, null], [null, null], [null, null]]
    ],
    columnFormats: {}
  };

  const zerosTestData = {
    columns: [
      'dimension', 'measure'
    ],
    rows: [
      ['apples', 0],
      ['oranges', 0],
      ['plums', 0]
    ]
  };

  const oneHundredPercentStackedTestData = {
    columns: [
      'dimension', 'measure'
    ],
    rows: [
      ['10', 10, 10, 10, 10]
    ]
  };

  const oneHundredPercentNegativeStackedTestData = {
    columns: [
      'dimension', 'measure'
    ],
    rows: [
      ['10', 10, 10, -10, -10]
    ]
  };

  const timescaleTestData = {
    columns: ['dimension', 'measure'],
    rows: [
      ['2017-09-01T09:45:00.000', 10],
      ['2017-09-02T09:45:00.000', 20],
      ['2017-09-03T09:45:00.000', 30],
      ['2017-09-04T09:45:00.000', 40],
      ['2017-09-05T09:45:00.000', 50]
    ],
    columnFormats: {
      dimension_date_column: {
        dataTypeName: 'calendar_date',
        fieldName: 'dimension_date_column',
        name: 'Dimension Date',
        renderTypeName: 'calendar_date',
        format: {
          view: 'date_time'
        }
      }
    }
  };

  const createComboChart = (width, overrideVIF) => {

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

    let comboChartVIF = {
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
          type: 'comboChart.column',
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
      _.merge(comboChartVIF, overrideVIF);
    }

    const chart = new SvgComboChart(element, comboChartVIF);

    return {
      element: element,
      chart: chart,
      renderOptions: {}
    };
  };

  const removeComboChart = (comboChart) => {

    if (comboChart && comboChart.chart && comboChart.chart.hasOwnProperty('destroy')) {
      comboChart.element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      comboChart.chart.destroy();
      assert(comboChart.element.children().length === 0, 'chart destroy did not remove dom');
    }

    $('#chart').remove();
  };

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  describe('when configured to show error bars', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should render the error bars', () => {

      comboChart = createComboChart(null, {
        series:[{
          errorBars: {
            lowerBoundColumnName: 'column_0',
            upperBoundColumnName: 'column_1'
          }
        }]
      });

      comboChart.chart.render(null, testData);

      // Verify error bars exist
      //
      const $errorBarTop = comboChart.element.find('.error-bar-top');
      assert.isTrue(($errorBarTop.length > 0), 'Error bars not rendered');

      const $errorBarMiddle = comboChart.element.find('.error-bar-middle');
      assert.isTrue(($errorBarMiddle.length > 0), 'Error bars not rendered');

      const $errorBarBottom = comboChart.element.find('.error-bar-bottom');
      assert.isTrue(($errorBarBottom.length > 0), 'Error bars not rendered');
    });
  });

  describe('when configured to not show error bars', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should not render the error bars', () => {

      comboChart = createComboChart(null, {});
      comboChart.chart.render(null, noErrorBarsTestData);

      // Verify error bars do not exist
      //
      const $errorBars = comboChart.element.find('.error-bar-middle');
      assert.isTrue($errorBars.length == 0, 'Error bars not rendered');
    });
  });

  describe('when configured to show legend and "Show Legend" button is clicked', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should show the legend menu', () => {

      comboChart = createComboChart(null, {
        configuration: {
          showLegend: true
        }
      });

      comboChart.chart.render(null, testData);

      // Verify button exists
      //
      const $button = comboChart.element.find('.socrata-legend-button');
      const buttonExists = ($button.length > 0);
      assert.isTrue(buttonExists, 'button actually does not exist');

      // Verify menu exists
      //
      const $legendMenu = comboChart.element.find('.socrata-legend-menu');
      const menuExists = ($legendMenu.length > 0);
      assert.isTrue(menuExists, 'menu actually does not exist');

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
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should show the "Show Legend" button', () => {

      comboChart = createComboChart(null, {
        configuration: {
          showLegend: true
        }
      });

      comboChart.chart.render(null, testData);

      // Verify button exists
      //
      const $button = comboChart.element.find('.socrata-legend-button');
      const buttonExists = ($button.length > 0);
      assert.isTrue(buttonExists, 'button actually does not exist');
    });
  });

  describe('when configured to not show legend', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should show not the "Show Legend" button', () => {

      comboChart = createComboChart(null, {
        configuration: {
          showLegend: false
        }
      });

      comboChart.chart.render(null, testData);

      // Verify button exists
      //
      const $button = comboChart.element.find('.socrata-legend-button');
      const buttonExists = ($button.length > 0);
      assert.isFalse(buttonExists, 'button actually exists');
    });
  });

  describe('when configured wrong', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than configuration.measureAxisMaxValue', () => {

      comboChart = createComboChart(null, {
        configuration: {
          measureAxisMinValue: 2,
          measureAxisMaxValue: 1
        }
      });
      comboChart.chart.render(null, testData);

      const errorMessage = comboChart.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Please ensure your minimum value is smaller than your maximum value.');
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than values within dataset', () => {

      comboChart = createComboChart(null, {
        configuration: {
          measureAxisMinValue: 10000
        }
      });
      comboChart.chart.render(null, testData);

      const errorMessage = comboChart.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Minimum axis value cannot exceed values within dataset.');
    });
  });

  describe('when the measure is set to "count"', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should show integer y-axis ticks', () => {
      comboChart = createComboChart(null, {});
      comboChart.chart.render(null, {
        columns: ['dimension', 'measure'],
        rows: [
          ['1', 1],
          ['1', 1],
          ['1', 2],
          ['1', 1],
          ['1', 5],
          ['1', 2],
          ['1', 2],
          ['1', 2],
          ['1', 1]
        ]
      });

      const ticks = comboChart.element.find('.y.axis .tick text');

      assert.isAtLeast(ticks.length, 1);

      ticks.each((i, e) => {
        assert.match(e.textContent, /^[0-9]+$/);
      });
    });
  });

  describe('when rendering multi-series', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('should show multiple columns', () => {
      comboChart = createComboChart(640, {
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
            type: 'comboChart.column',
            unit: {
              one: 'unit_one',
              other: 'unit_other'
            }
          },
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
            type: 'comboChart.column',
            unit: {
              one: 'unit_one',
              other: 'unit_other'
            }
          },
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
            type: 'comboChart.line',
            unit: {
              one: 'unit_one',
              other: 'unit_other'
            }
          }
        ]
      });

      comboChart.chart.render(null, multiSeriesTestData);

      const $columns = comboChart.element.find('.dimension-group:first > .column');
      assert.equal($columns.length, 2);

      const $lines = comboChart.element.find('.line-series');
      assert.equal($lines.length, 1);
    });
  });

  describe('given values of 0', () => {
    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('renders columns with 0 values', () => {
      comboChart = createComboChart();
      comboChart.chart.render(null, zerosTestData);

      const $columns = comboChart.element.find('.column-chart rect.column');
      assert.isTrue(_.every($columns, (column) => {
        let value = _.get(column, 'attributes.height.value', null);
        return value === '0';
      }));
    });
  });

  describe('when rendering calendar_dates', () => {

    const overrideVIF = {
      series: [
        {
          dataSource: {
            dimension: {
              columnName: 'dimension_date_column',
              aggregationFunction: null
            }
          }
        }
      ]
    };

    let comboChart;

    afterEach(() => {
      removeComboChart(comboChart);
    });

    it('renders date tick marks by year', () => {

      const data = _.assign({}, timescaleTestData, { precision: 'year' });
      comboChart = createComboChart(640, overrideVIF);
      comboChart.chart.render(null, data);

      const $tickLabels = comboChart.element.find('.x.axis text');
      assert.equal($tickLabels.first().text(), '2017');
    });

    it('renders date tick marks by month', () => {

      const data = _.assign({}, timescaleTestData, { precision: 'month' });
      comboChart = createComboChart(640, overrideVIF);
      comboChart.chart.render(null, data);

      const $tickLabels = comboChart.element.find('.x.axis text');
      assert.equal($tickLabels.first().text(), '2017/09');
    });

    it('renders date tick marks by day', () => {

      const data = _.assign({}, timescaleTestData, { precision: 'day' });
      comboChart = createComboChart(640, overrideVIF);
      comboChart.chart.render(null, data);

      const $tickLabels = comboChart.element.find('.x.axis text');
      assert.equal($tickLabels.first().text(), '2017/09…');
    });
  });
});
