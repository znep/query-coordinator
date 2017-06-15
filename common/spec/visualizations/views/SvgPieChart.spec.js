import _ from 'lodash';
import utils from 'common/js_utils';
import d3 from 'd3';
import $ from 'jquery';
import chroma from 'chroma-js';
import I18n from 'common/visualizations/I18n';
import SvgPieChart from 'common/visualizations/views/SvgPieChart';
import testHelpers from '../testHelpers';

const COLOR_PALETTES = {
  categorical: ["#a6cee3", "#5b9ec9", "#2d82af", "#7eba98", "#98d277", "#52af43", "#6f9e4c", "#dc9a88", "#f16666", "#e42022", "#f06c45", "#fdbb69", "#fe982c", "#f78620", "#d9a295", "#b294c7", "#7d54a6", "#9e8099", "#f0eb99", "#dbb466"],
  alternate1: ["#e41a1c", "#9e425a", "#596a98", "#3b87a2", "#449b75", "#4daf4a", "#6b886d", "#896191", "#ac5782", "#d56b41", "#ff7f00", "#ffb214", "#ffe528", "#eddd30", "#c9992c", "#a65628", "#c66764", "#e678a0", "#e485b7", "#be8fa8"],
  alternate2: ["#66c2a5", "#9aaf8d", "#cf9c76", "#f68d67", "#cf948c", "#a89bb0", "#969dca", "#b596c7", "#d58ec4", "#dd95b2", "#c6b18b", "#afcc64", "#b7d84c", "#d6d83f", "#f6d832", "#f8d348", "#efcc6b", "#e6c58e", "#d5be9d", "#c4b8a8"],
  dark: ["#1b9e77", "#5d874e", "#a07125", "#d45f0a", "#b16548", "#8e6b86", "#8068ae", "#a850a0", "#d03792", "#d33b79", "#a66753", "#79932e", "#7fa718", "#aca80e", "#d9aa04", "#d69d08", "#bf8b12", "#a9781b", "#927132", "#7c6b4c"]
};

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
        ['l', 120],
        ['m', 130],
        ['n', 140],
        ['o', 150]
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

      const total = testData[0].rows.reduce((sum, d) => sum + d[1], 0);

      for(let i = 0; i < testData[0].rows.length; i++) {
        let renderedValue = Number(pieChart.$element.find('.slice')[i].getAttribute('data-value'));
        let expectedValue = testData[0].rows[i][1];

        expect(renderedValue).to.equal(expectedValue);

        let renderedLabel = pieChart.$element.find('.slice')[i].getAttribute('data-label');
        let expectedLabel = testData[0].rows[i][0];

        expect(renderedLabel).to.equal(expectedLabel);

        let renderedPercent = pieChart.$element.find('.slice')[i].getAttribute('data-percent');
        let expectedPercent = ((100 * testData[0].rows[i][1]) / total).toString();

        expect(renderedPercent).to.equal(expectedPercent);
      }
    });

    it(`should create ${testData[0].rows.length} legend rows`, () => {
      pieChart.chart.render(null, testData);

      const renderedRows = pieChart.$element.find('.legend-row').length;
      const expectedRows = testData[0].rows.length;

      expect(renderedRows).to.equal(expectedRows);
    });

    it('should show correct values with correct styling in arc labels if rendered', () => {
      pieChart.chart.render(null, testData);

      pieChart.$element.find('.slice-group').each((i, el) => {

        const $textEl = $(el).find('text');
        const text = $textEl.text();

        if (text) {
          const actualValue = Number($(el).find('path').attr('data-value'));
          const formattedValue = utils.formatNumber(actualValue);
          expect(formattedValue).to.equal(text);
        }
      });
    });

    it('should show percentage of values in arc labels if show as percentage is checked', () => {
      let chart = createPieChart({ configuration: { 'showValueLabels': true, 'showValueLabelsAsPercent': true } });

      chart.chart.render(null, testData);

      chart.$element.find('.slice-group').each((i, el) => {
        const text = $(el).find('text').text();

        if (text) {
          const actualValue = Number($(el).find('path').attr('data-percent'));
          const formattedValue = Math.round(Number(actualValue)) + I18n.translate('visualizations.common.percent_symbol');

          expect(formattedValue).to.equal(text);
        }
      });
    });

    it('should show correct values in flyout on slices', done => {
      pieChart.chart.render(null, testData);

      var slice = pieChart.$element.find('.slice-group')[0];
      var percent = Math.round(Number(pieChart.$element.find('.slice-group:nth(0) .slice')[0].attributes['data-percent'].value));
      var percentSymbol = I18n.translate('visualizations.common.percent_symbol');

      pieChart.$element.on('SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT', event => {
        let payload = event.originalEvent.detail;
        let $content = $(payload.content);

        expect($content.find('.socrata-flyout-title').text()).to.equal(testData[0].rows[0][0]);
        expect($content.find('.socrata-flyout-cell').text()).to.contains(`(${percent}${percentSymbol})`);
        done();
      });

      testHelpers.fireMouseEvent(slice, 'mouseover');
    });

    it('should show correct values in flyout on legend', done => {
      pieChart.chart.render(null, testData);

      var slice = pieChart.$element.find('.slice-group')[0];
      var legendRow = pieChart.$element.find('.legend-row')[0];

      pieChart.$element.on('SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT', event => {
        let payload = event.originalEvent.detail;
        let $content = $(payload.content);

        expect($content.find('.socrata-flyout-title').text()).to.equal(testData[0].rows[0][0]);
        done();
      });

      testHelpers.fireMouseEvent(legendRow, 'mouseover');
    });
  });

  describe('when called with a specific configuration', () => {
    afterEach(() => {
      removeChart(pieChart);
    });

    it('shouldn\'t show arc labels if specially defined', () => {
      let overrideVif = {};
      _.set(overrideVif, 'configuration.showValueLabels', false);

      let pieChart = createPieChart(overrideVif);
      pieChart.chart.render(null, testData);

      const renderedArcLabelCount = pieChart.$element.find('.slice-group text').length;
      expect(renderedArcLabelCount).to.equal(0);
    });

    it('should render with default color palette', () => {
      let color = COLOR_PALETTES.categorical;

      let pieChart = createPieChart();
      pieChart.chart.render(null, testData);

      const $slices = pieChart.$element.find('path.slice');

      $slices.each((index, slice) => {
        expect(slice.getAttribute('fill')).to.equal(color[index]);
      });
    });

    it('should render with configured color palette', () => {
      let overrideVif = {};
      _.set(overrideVif, 'series[0].color.palette', 'alternate2');

      let color = COLOR_PALETTES.alternate2;

      let pieChart = createPieChart(overrideVif);
      pieChart.chart.render(null, testData);

      const $slices = pieChart.$element.find('path.slice');

      $slices.each((index, slice) => {
        expect(slice.getAttribute('fill')).to.equal(color[index]);
      });
    });

  });
});
