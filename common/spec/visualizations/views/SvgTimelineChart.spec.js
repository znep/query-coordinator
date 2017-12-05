import _ from 'lodash';
import $ from 'jquery';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import SvgTimelineChart from 'common/visualizations/views/SvgTimelineChart';
import testHelpers from '../testHelpers';

describe('SvgTimelineChart', () => {

  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 600;

  // NOTE The data that the SvgTimelineChart.render function expects is an object
  // vs an array, which is what other charts, like Pie & Histogram expects.
  const testData = {
    columns: ['dimension', 'measure'],
    rows: [
      ['2017-09-01T09:45:00.000', 10],
      ['2017-09-02T09:45:00.000', 20],
      ['2017-09-03T09:45:00.000', 30],
      ['2017-09-04T09:45:00.000', 40],
      ['2017-09-05T09:45:00.000', 50]
    ],
    precision: 'day',
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

  const testDataPrecisionNone = {
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

  const testDataCategorical = {
    columns: ['dimension', 'measure'],
    rows: [
      ['Mission', 10],
      ['Western', 20],
      ['Downtown', 30],
      ['Bayview', 40],
      ['Excelsior', 50]
    ],
    columnFormats: {
      dimension_date_column: {
        dataTypeName: 'text',
        fieldName: 'neighborhood',
        name: 'Neighborhood',
        renderTypeName: 'text',
        format: {
          view: 'text'
        }
      }
    }
  };

  const multiSeriesTestData = {
    columns: ['dimension', 'measure 1', 'measure 2', null],
    rows: [
      ['2017-09-01T09:45:00.000', 10, 15, null],
      ['2017-09-02T09:45:00.000', null, null, null],
      ['2017-09-03T09:45:00.000', 30, null, 35],
      ['2017-09-04T09:45:00.000', null, 45, 47],
      ['2017-09-05T09:45:00.000', 50, 45, 47]
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
    },
    precision: 'day'
  };

  let timelineChart;
  let overrideVIF;

  const createTimelineChart = (overrideVIF = {}) => {
    const $element = $('<div>', {
      id: 'chart',
      style: `width:${CHART_WIDTH}px;height:${CHART_HEIGHT}px;`
    });

    $('body').append($element);

    const baseVIF = {
      configuration: {
        viewSourceDataLink: true
      },
      description: 'Some description',
      series: [
        {
          dataSource: {
            datasetUid: 'XXXX-XXXX',
            dimension: {
              columnName: 'dimension_date_column',
              aggregationFunction: null
            },
            domain: 'socrata.com',
            measure: {
              columnName: null,
              aggregationFunction: 'count'
            },
            type: 'socrata.soql',
            filters: [],
            precision: null
          },
          label: null,
          type: 'timelineChart'
        }
      ],
      createdAt: '2014-01-01T00:00:00',
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      title: 'Some title'
    };

    const vif = _.merge(baseVIF, overrideVIF);

    const chart = new SvgTimelineChart($element, vif);

    return { $element, chart };
  };

  // TODO: Refactor removeChart into a parent/helper, as it is also used in other test files.
  const removeChart = timelineChart => {

    if (timelineChart && timelineChart.chart && timelineChart.chart.hasOwnProperty('destroy')) {
      timelineChart.$element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      timelineChart.chart.destroy();
      assert.lengthOf(timelineChart.$element.children(), 0, 'chart destroy did not remove dom');
    }

    $('#chart').remove();
  };

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  describe('when called with data', () => {

    beforeEach(() => {
      timelineChart = createTimelineChart(overrideVIF);
    });

    afterEach(() => {
      removeChart(timelineChart);
    });

    describe('when rendering single series', () => {
      beforeEach(() => {
        timelineChart.chart.render(null, testData);
      });

      it('renders a line', () => {
        const renderedLine0 = timelineChart.$element.find('.series-0-area-line');
        const renderedLine1 = timelineChart.$element.find('.series-1-area-line');

        // renders an svg path
        assert.equal(renderedLine0.prop('tagName'), 'path');
        assert.lengthOf(renderedLine1, 0);
      });

      it('shows values in flyout', done => {
        const overlay = timelineChart.$element.find('.overlay')[0];

        timelineChart.$element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', event => {
          let payload = event.originalEvent.detail;
          let $content = $(payload.content);

          assert.equal($content.find('.socrata-flyout-title').text(), 'Sept. 1, 2017 to Sept. 2, 2017');
          assert.equal($content.find('.socrata-flyout-row').length, testData.rows[0].length - 1);
          done();
        });

        testHelpers.fireMouseEvent(overlay, 'mousemove');
      });
    });

    describe('when rendering single series with no time grouping', () => {
      beforeEach(() => {
        overrideVIF = {
          series: [
            {
              dataSource: {
                precision: 'none'
              }
            }
          ]
        };

        timelineChart = createTimelineChart(overrideVIF);
        timelineChart.chart.render(null, testDataPrecisionNone);
      });

      it('renders a line', () => {
        const renderedLine0 = timelineChart.$element.find('.series-0-area-line');
        const renderedLine1 = timelineChart.$element.find('.series-1-area-line');

        // renders an svg path
        assert.equal(renderedLine0.prop('tagName'), 'path');
        assert.lengthOf(renderedLine1, 0);
      });

      it('shows values in flyout', done => {
        const overlay = timelineChart.$element.find('.overlay')[0];

        timelineChart.$element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', event => {
          let payload = event.originalEvent.detail;
          let $content = $(payload.content);

          assert.equal($content.find('.socrata-flyout-title').text(), '09/01/2017 09:45:00 AM');
          assert.equal($content.find('.socrata-flyout-row').length, testDataPrecisionNone.rows[0].length - 1);
          done();
        });

        testHelpers.fireMouseEvent(overlay, 'mousemove');
      });
    });

    describe('when rendering single series with categorical data', () => {
      beforeEach(() => {
        timelineChart = createTimelineChart();
        timelineChart.chart.render(null, testDataCategorical);
      });

      it('renders a line', () => {
        const renderedLine0 = timelineChart.$element.find('.series-0-area-line');
        const renderedLine1 = timelineChart.$element.find('.series-1-area-line');

        // renders an svg path
        assert.equal(renderedLine0.prop('tagName'), 'path');
        assert.lengthOf(renderedLine1, 0);
      });

      it('shows values in flyout', done => {
        const circle = timelineChart.$element.find('circle')[0];

        timelineChart.$element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', event => {
          let payload = event.originalEvent.detail;
          let $content = $(payload.content);

          assert.equal($content.find('.socrata-flyout-title').text(), 'Mission');
          assert.equal($content.find('.socrata-flyout-row').length, testDataPrecisionNone.rows[0].length - 1);
          assert.equal($content.find('.socrata-flyout-cell').text(), '10 Rows');

          done();
        });

        testHelpers.fireMouseEvent(circle, 'mousemove');
      });
    });

    describe('when the measure is set to "count"', () => {
      beforeEach(() => {
        timelineChart.chart.render(null, {
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
          ],
          precision: 'day',
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
        });
      });

      it('should show integer y-axis ticks', () => {
        const ticks = timelineChart.$element.find('.y.axis .tick text');

        assert.isAtLeast(ticks.length, 1);

        ticks.each((i, e) => {
          assert.match(e.textContent, /^[0-9]+$/);
        });
      });
    });

    describe('when the measure column has percent format', () => {
      beforeEach(() => {
        const overrideVIF = {
          series: [
            {
              dataSource: {
                measure: {
                  columnName: 'TestColumn',
                  aggregationFunction: 'sum'
                }
              }
            }
          ]
        };
        timelineChart = createTimelineChart(overrideVIF);
        timelineChart.chart.render(null, {
          columnFormats: {
            TestColumn: {
              format: {
                view: 'percent_bar_and_text'
              }
            }
          },
          columns: ['dimension', 'measure'],
          rows: [
            ['10', .11],
            ['20', .15],
            ['30', .2],
            ['40', .1],
            ['50', .5],
            ['60', .2],
            ['70', .2],
            ['80', .2],
            ['90', .1]
          ],
          precision: 'day'
        });
      });

      it('y-axis ticks should be percent formatted', () => {
        const ticks = timelineChart.$element.find('.y.axis .tick text');

        assert.isAtLeast(ticks.length, 1);

        ticks.each((i, e) => {
          assert.match(e.textContent, /^[0-9.]+%$/);
        });
      });
    });

    describe('when dimension row contains a null', () => {
      beforeEach(() => {
        overrideVIF = {
          series: [
            {
              dataSource: {
                precision: 'none'
              }
            }
          ]
        };

        timelineChart = createTimelineChart(overrideVIF);
        timelineChart.chart.render(null, {
          columns: ['dimension', 'measure'],
          rows: [
            ['2017-09-01T09:45:00.000', 1],
            ['2017-09-02T09:45:00.000', 1],
            [null, 2]
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
        });
      });

      it('should render two circles', () => {
        const circles = timelineChart.$element.find('circle');
        assert.equal(circles.length, 2);
      });
    });

    describe('when rendering multi-series', () => {
      beforeEach(() => {
        // override by adding "grouping" to dimension
        overrideVIF = {
          series: [
            {
              dataSource: {
                dimension: {
                  grouping: {
                    columnName: 'dimension_date_column'
                  }
                }
              }
            }
          ]
        };

        timelineChart = createTimelineChart(overrideVIF);
        timelineChart.chart.render(null, multiSeriesTestData);
      });

      it('renders multiple lines', () => {
        const renderedLine0 = timelineChart.$element.find('.series-0-area-line');
        const renderedLine1 = timelineChart.$element.find('.series-1-area-line');

        // renders an svg path
        assert.equal(renderedLine0.prop('tagName'), 'path');
        assert.equal(renderedLine1.prop('tagName'), 'path');
      });

      it('shows values in flyout', done => {
        const overlay = timelineChart.$element.find('.overlay')[0];

        timelineChart.$element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', event => {
          let payload = event.originalEvent.detail;
          let $content = $(payload.content);

          const $flyoutRows = $content.find('.socrata-flyout-row');
          assert.equal($content.find('.socrata-flyout-title').text(), 'Sept. 1, 2017 to Sept. 2, 2017');
          assert.lengthOf($flyoutRows, multiSeriesTestData.rows[0].length - 1);
          assert.match($flyoutRows.text(), /\(No value\)/); // handles nulls
          done();
        });

        testHelpers.fireMouseEvent(overlay, 'mousemove');
      });
    });
  });
});
