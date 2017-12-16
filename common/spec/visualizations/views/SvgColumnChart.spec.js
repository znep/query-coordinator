import _ from 'lodash';
import $ from 'jquery';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import SvgColumnChart from 'common/visualizations/views/SvgColumnChart';
import testHelpers from '../testHelpers';

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

  const createColumnChart = (width, overrideVIF) => {

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

  describe('when configured to show 100% stacked columns', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should render the stacked columns', () => {

      columnChart = createColumnChart(null, {
        series:[{
          stacked: {
            oneHundredPercent: true
          }
        }]
      });

      columnChart.chart.render(null, oneHundredPercentStackedTestData);

      // There should be 1 column group
      const $groups = columnChart.element.find('.dimension-group');
      assert.equal($groups.length, 1);

      // There should be 4 columns in the group
      const $columns = columnChart.element.find('.column');
      assert.equal($columns.length, 4);

      // The sum of the absolute values of the data-percent attributes should be 100
      const percents = [];
      $columns.each(function() {
        const percent = Math.abs(parseFloat($(this).attr('data-percent')));
        percents.push(percent);
      });

      const sum = _.sum(percents);
      assert.equal(sum, 100);
    });
  });

  describe('when configured to show 100% stacked columns with negative values', () => {
    let columnChart;

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should render the stacked columns', () => {

      columnChart = createColumnChart(null, {
        series:[{
          stacked: {
            oneHundredPercent: true
          }
        }]
      });

      columnChart.chart.render(null, oneHundredPercentNegativeStackedTestData);

      // There should be 1 column group
      const $groups = columnChart.element.find('.dimension-group');
      assert.equal($groups.length, 1);

      // There should be 4 columns in the group
      const $columns = columnChart.element.find('.column');
      assert.equal($columns.length, 4);

      // The sum of the absolute values of the data-percent attributes should be 100
      const percents = [];
      $columns.each(function() {
        const percent = Math.abs(parseFloat($(this).attr('data-percent')));
        percents.push(percent);
      });

      const sum = _.sum(percents);
      assert.equal(sum, 100);
    });
  });

  describe('when configured to show error bars', () => {
    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('should render the error bars', () => {

      columnChart = createColumnChart(null, {
        series:[{
          errorBars: {
            lowerBoundColumnName: 'column_0',
            upperBoundColumnName: 'column_1'
          }
        }]
      });

      columnChart.chart.render(null, testData);

      // Verify error bars exist
      //
      const $errorBarTop = columnChart.element.find('.error-bar-top');
      assert.isTrue(($errorBarTop.length > 0), 'Error bars not rendered');

      const $errorBarMiddle = columnChart.element.find('.error-bar-middle');
      assert.isTrue(($errorBarMiddle.length > 0), 'Error bars not rendered');

      const $errorBarBottom = columnChart.element.find('.error-bar-bottom');
      assert.isTrue(($errorBarBottom.length > 0), 'Error bars not rendered');
    });
  });

  describe('when configured to not show error bars', () => {
    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('should not render the error bars', () => {

      columnChart = createColumnChart(null, {});
      columnChart.chart.render(null, noErrorBarsTestData);

      // Verify error bars do not exist
      //
      const $errorBars = columnChart.element.find('.error-bar-middle');
      assert.isTrue($errorBars.length == 0, 'Error bars not rendered');
    });
  });

  describe('when configured to show legend and "Show Legend" button is clicked', () => {
    let columnChart;

    afterEach(() => {
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
      assert.isTrue(buttonExists, 'button actually does not exist');

      // Verify menu exists
      //
      const $legendMenu = columnChart.element.find('.socrata-legend-menu');
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
    let columnChart;

    afterEach(() => {
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
      assert.isTrue(buttonExists, 'button actually does not exist');
    });
  });

  describe('when configured to not show legend', () => {
    let columnChart;

    afterEach(() => {
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
      assert.isFalse(buttonExists, 'button actually exists');
    });
  });

  describe('when configured wrong', () => {
    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger than configuration.measureAxisMaxValue', () => {

      columnChart = createColumnChart(null, {
        configuration: {
          measureAxisMinValue: 2,
          measureAxisMaxValue: 1
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

  describe('when the measure is set to "count"', () => {
    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('should show integer y-axis ticks', () => {
      columnChart = createColumnChart(null, {});
      columnChart.chart.render(null, {
        columns: ['dimension', 'measure'],
        rows: [
          ['10', 1],
          ['20', 1],
          ['30', 2],
          ['40', 1],
          ['50', 5],
          ['60', 2],
          ['70', 2],
          ['80', 2],
          ['90', 1]
        ]
      });

      const ticks = columnChart.element.find('.y.axis .tick text');

      assert.isAtLeast(ticks.length, 1);

      ticks.each((i, e) => {
        assert.match(e.textContent, /^[0-9]+$/);
      });
    });
  });

  describe('when rendering multi-series', () => {
    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('should show multiple columns', () => {
      // Add a series.
      columnChart = createColumnChart(null, {
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
            type: 'columnChart',
            unit: {
              one: 'unit_one',
              other: 'unit_other'
            }
          }
        }
      });
      assert.isTrue(columnChart.chart.isMultiSeries());
      columnChart.chart.render(null, multiSeriesTestData);
      const $columns = columnChart.element.find('.dimension-group:first > .column');
      assert.equal($columns.length, 3);
    });
  });

  describe('given values of 0', () => {
    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('renders columns with 0 values', () => {
      columnChart = createColumnChart();
      columnChart.chart.render(null, zerosTestData);

      const $columns = columnChart.element.find('.column-chart rect.column');
      assert.isTrue(_.every($columns, (column) => {
        let value = _.get(column, 'attributes.height.value', null);
        return value === '0';
      }));
    });
  });

  describe('when rendering reference lines', () => {

    const overrideVIF = {
      referenceLines: [
        {
          color: '#ba001e',
          label: '',
          uId: 'reference-line-0',
          value: 8000000000
        }
      ]
    };

    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('should show humane formatted value in flyout', (done) => {

      columnChart = createColumnChart(640, overrideVIF);
      columnChart.chart.render(null, testData);

      const referenceLineUnderlay = columnChart.element.find('.reference-line-underlay')[0];

      columnChart.element.on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
        const payload = event.originalEvent.detail;
        const $content = $(payload.content);

        assert.equal($content.find('.socrata-flyout-cell').text(), '8B');
        done();
      });

      testHelpers.fireMouseEvent(referenceLineUnderlay, 'mousemove');
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

    let columnChart;

    afterEach(() => {
      removeColumnChart(columnChart);
    });

    it('renders date tick marks by year', () => {

      const data = _.assign({}, timescaleTestData, { precision: 'year' });
      columnChart = createColumnChart(640, overrideVIF);
      columnChart.chart.render(null, data);

      const $tickLabels = columnChart.element.find('.x.axis text');
      assert.equal($tickLabels.first().text(), '2017');
    });

    it('renders date tick marks by month', () => {

      const data = _.assign({}, timescaleTestData, { precision: 'month' });
      columnChart = createColumnChart(640, overrideVIF);
      columnChart.chart.render(null, data);

      const $tickLabels = columnChart.element.find('.x.axis text');
      assert.equal($tickLabels.first().text(), '2017/09');
    });

    it('renders date tick marks by day', () => {

      const data = _.assign({}, timescaleTestData, { precision: 'day' });
      columnChart = createColumnChart(640, overrideVIF);
      columnChart.chart.render(null, data);

      const $tickLabels = columnChart.element.find('.x.axis text');
      assert.equal($tickLabels.first().text(), '2017/09…');
    });
  });
});
