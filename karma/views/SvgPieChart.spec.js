var _ = require('lodash');
var $ = require('jquery');
var SvgPieChart = require('../../src/views/SvgPieChart');

describe('SvgPieChart', () => {

  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 600;

  const testData = [
    {
      rows: [
        ['a', 10],
        ['b', 20],
        ['c', 30],
        ['d', 40],
        ['e', 50],
        ['f', 60],
        ['g', 70],
        ['h', 80],
        ['i', 90],
        ['j', 100],
        ['k', 110],
        ['l', 120]
      ],
      columns: ['dimension', 'measure']
    }
  ];

  let pieChart;

  const createPieChart = (overrideVIF = {}) => {
    const $element = $('<div>', {
      id: 'chart',
      style: `width:${CHART_WIDTH}px;height:${CHART_HEIGHT}px;`
    });

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
              columnName: 'dimension',
              aggregationFunction: null
            },
            domain: 'socrata.com',
            measure: {
              columnName: 'measure',
              aggregationFunction: null
            },
            type: 'socrata.soql',
            filters: []
          },
          label: 'Proficient',
          type: 'columnChart',
          unit: {
            one: 'percent of students',
            other: 'percent of students'
          }
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

    const chart = new SvgPieChart($element, vif);

    return { $element, chart };
  };

  const removeChart = pieChart => {

    if (pieChart && pieChart.chart && pieChart.chart.hasOwnProperty('destroy')) {
      pieChart.$element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      pieChart.chart.destroy();
      assert(pieChart.$element.children().length === 0, 'chart destroy did not remove dom');
    }

    $('#chart').remove();
  };

  describe('when called with data', () => {

    beforeEach(() => {
      pieChart = createPieChart();
    });

    afterEach(() => {
      removeChart(pieChart);
    });

    it(`should create ${testData[0].rows.length} slices`, () => {
      pieChart.chart.render(null, testData);

      const renderedSlices = pieChart.$element.find('.slice').length;
      const expectedSlices = testData[0].rows.length;

      expect(renderedSlices).to.equal(expectedSlices);
    });

    it('slices should have correct data', () => {
      pieChart.chart.render(null, testData);

      for(let i = 0; i < testData[0].rows.length; i++) {
        let renderedValue = Number(pieChart.$element.find('.slice')[i].getAttribute('data-value'));
        let expectedValue = testData[0].rows[i][1];

        expect(renderedValue).to.equal(expectedValue);

        let renderedLabel = pieChart.$element.find('.slice')[i].getAttribute('data-label');
        let expectedLabel = testData[0].rows[i][0];

        expect(renderedLabel).to.equal(expectedLabel);
      }
    });

    it(`should create ${testData[0].rows.length} legend rows`, () => {
      pieChart.chart.render(null, testData);

      const renderedRows = pieChart.$element.find('.legend-row').length;
      const expectedRows = testData[0].rows.length;

      expect(renderedRows).to.equal(expectedRows);
    });

    it('should show correct values in flyout on slices', done => {
      pieChart.chart.render(null, testData);

      var slice = pieChart.$element.find('.slice')[0];

      pieChart.$element.on('SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT', event => {
        let payload = event.originalEvent.detail;
        let $content = $(payload.content);

        expect(payload.element).to.equal(slice);
        expect($content.find('.socrata-flyout-title').text()).to.equal(testData[0].rows[0][0]);
        done();
      });

      testHelpers.fireMouseEvent(slice, 'mouseover');
    });

    it('should show correct values in flyout on legend', done => {
      pieChart.chart.render(null, testData);

      var slice = pieChart.$element.find('.slice')[0];
      var legendRow = pieChart.$element.find('.legend-row')[0];

      pieChart.$element.on('SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT', event => {
        let payload = event.originalEvent.detail;
        let $content = $(payload.content);

        expect(payload.element).to.equal(slice);
        expect($content.find('.socrata-flyout-title').text()).to.equal(testData[0].rows[0][0]);
        done();
      });

      testHelpers.fireMouseEvent(legendRow, 'mouseover');
    });

  });
});
