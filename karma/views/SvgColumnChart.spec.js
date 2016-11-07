const _ = require('lodash');
const $ = require('jquery');
const I18n = require('src/I18n');
const SvgColumnChart = require('../../src/views/SvgColumnChart');

describe('SvgColumnChart', () => {
  const CHART_WIDTH = 640;
  const CHART_HEIGHT = 480;
  const CHART_TITLE = 'Test Title';
  const CHART_DESCRIPTION = 'test description';

  const testData = [
    {
      bucketType: 'linear',
      rows: [
        [ 0, 10, 5 ],
        [ 10, 20, 1 ],
        [ 20, 30, 15 ],
        [ 30, 40, 20 ],
        [ 40, 50, 25 ]
      ],
      columns: [
        'bucket_start', 'bucket_end', 'measure'
      ]
    }
  ];

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
      },
      scale: {
        x: {
          type: 'quantitative'
        },
        y: {
          type: 'quantitative'
        }
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

      const expectedMessage = I18n.translate(
        'visualizations.common.validation.errors.' +
        'measure_axis_min_should_be_lesser_then_max'
      );

      expect(errorMessage).to.equal(expectedMessage);
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

      const expectedMessage = I18n.translate(
        'visualizations.common.validation.errors.' +
        'measure_axis_biggest_value_should_be_more_than_min_limit'
      );

      expect(errorMessage).to.equal(expectedMessage);
    });
  });

});
