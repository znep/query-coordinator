import _ from 'lodash';
import $ from 'jquery';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import SvgHistogram from 'common/visualizations/views/SvgHistogram';
import testHelpers from '../testHelpers';

describe('SvgHistogram', function() {

  var CHART_WIDTH = 640;
  var CHART_HEIGHT = 480;
  var BUCKET_START_INDEX = 0;
  var BUCKET_END_INDEX = 1;
  var MEASURE_INDEX = 2;

  var CHART_TITLE = 'Test Title';
  var CHART_DESCRIPTION = 'test description';

  var testData = [
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

  function createHistogram(width, overrideVIF) {

    if (!width) {
      width = CHART_WIDTH;
    }

    var element = $(
      '<div>',
      {
        'id': 'chart',
        'style': 'width:' + width + 'px;height:' + CHART_HEIGHT + 'px;'
      }
    );

    $('body').append(element);

    var histogramVIF = {
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
          type: 'histogram',
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
      _.merge(histogramVIF, overrideVIF);
    }

    var chart = new SvgHistogram(element, histogramVIF);

    var renderOptions = {
      showAllLabels: false,
      showFiltered: false
    };

    return {
      element: element,
      chart: chart,
      renderOptions: renderOptions
    };
  }

  function removeHistogram(histogram) {

    if (histogram && histogram.chart && histogram.chart.hasOwnProperty('destroy')) {
      histogram.element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      histogram.chart.destroy();
      assert(histogram.element.children().length === 0, 'chart destroy did not remove dom');
    }

    $('#chart').remove();
  }

  /**
   * Tests begin here
   */

  var histogram;

  beforeEach(function() {
    I18n.translations.en = allLocales.en;
  });

  afterEach(function() {
    if ($('#chart').length) {
      throw new Error('A test in this spec file did not clean up its chart. This may cause downstream test failures.');
    }
    I18n.translations = {}
  });

  describe('when called with data', function() {

    beforeEach(function() {
      histogram = createHistogram();
    });

    afterEach(function() {
      removeHistogram(histogram);
    });

    let rowCount = testData[0].rows.length;
    it('should create ' + rowCount + ' columns', function() {

      histogram.chart.render(null, testData);

      expect($('.bucket-group').length).to.equal(rowCount);
      expect($('rect.column').length).to.equal(rowCount);
      expect($('rect.column-underlay').length).to.equal(rowCount);
    });

    it('should create columns with a defined width', function() {

      histogram.chart.render(null, testData)

      expect(parseFloat($('rect.column').attr('width'))).to.be.above(0);
    });

    it('should place the columns above the axis', function() {

      histogram.chart.render(null, testData)

      var xAxis = histogram.element.find('.x.axis .domain');
      var xAxisPosition = Math.round(xAxis.offset().top + xAxis.outerHeight());
      var columns = histogram.element.find('rect.column');

      expect(columns).to.have.length.greaterThan(1);
      columns.each(function() {
        expect(this.getBoundingClientRect().bottom).to.be.within(xAxisPosition - 1, xAxisPosition + 1);
      });
    });

    it('should show a minimum of 1 pixel if there is a non-zero value', function() {

      // Craft the data such that the scale will result in a <.5px value
      var testData = [
        {
          bucketType: 'linear',
          rows: [
            [ 0, 10, 5000 ],
            [ 10, 20, 10000 ],
            [ 20, 30, 1 ], // rounds up
            [ 30, 40, 0 ], // stays at 0
            [ 40, 50, 20005 ]
          ],
          columns: [
            'bucket_start', 'bucket_end', 'measure'
          ]
        }
      ];

      histogram.chart.render(null, testData)

      var columns = histogram.element.find('rect.column');
      expect(columns.length).to.equal(5);
      expect($(columns[2]).attr('height')).to.equal('1');
      expect($(columns[3]).attr('height')).to.not.equal('1');
    });
  });

  describe('when configured wrong', () => {
    afterEach(function() {
      removeHistogram(histogram);
    });

    it('should show an error message if configuration.measureAxisMinValue ' +
      'is bigger then configuration.measureAxisMaxValue', () => {

      histogram = createHistogram(null, {
        configuration: {
          measureAxisMinValue: 2,
          measureAxisMaxValue: 1,
        }
      });
      histogram.chart.render(null, testData);

      const errorMessage = histogram.element.
        find('.socrata-visualization-error-message').text();

      assert.equal(errorMessage, 'Please ensure your minimum value is smaller than your maximum value.');
    });
  });

  describe('when called with logarithmic buckets', function() {

    beforeEach(function() {
      histogram = createHistogram();
    });

    afterEach(function() {
      removeHistogram(histogram);
    });

    function validateDataCausesError(rows) {
      histogram.chart.render(null, [
        {
          bucketType: 'logarithmic',
          rows: rows,
          columns: [
            'bucket_start', 'bucket_end', 'measure'
          ]
        }
      ]);
      var error = histogram.element.find('.error');
      expect(error.text()).to.include('chart dimension includes or crosses zero');
    }

    describe('with a domain including zero (positive side)', function() {
      it('should display an error', function() {
        validateDataCausesError([
          [ 0, 1, 5 ],
          [ 1, 10, 5 ]
        ]);
      });
    });

    describe('with a domain including zero (negative side)', function() {
      it('should display an error', function() {
        validateDataCausesError([
          [ -10, -1, 5 ],
          [ -1, 0, 5 ]
        ]);
      });
    });

    describe('with a domain crossing zero', function() {
      it('should display an error', function() {
        validateDataCausesError([
          [ -10, -1, 5 ],
          [ 1, 10, 5 ]
        ]);
        validateDataCausesError([
          [ -10, 10, 5 ]
        ]);
      });
    });
  });

  describe('when called with no data', function() {

    beforeEach(function() {
      histogram = createHistogram();
    });

    afterEach(function() {
      removeHistogram(histogram);
    });

    it('should hide all existing columns when the data is cleared', function() {

      histogram.chart.render(null, testData);
      expect($('rect.column').length).to.not.equal(0);
      histogram.chart.render(null, []);
      expect($('rect.column').length).to.equal(0);
    });
  });

  describe('on mousemove events', function() {

    var histogram;

    beforeEach(function() {
      histogram = createHistogram();
    });

    afterEach(function() {
      removeHistogram(histogram);
    });

    describe('on a column underlay with value = 5', function() {

      it('should emit an event in which the `element` property is the real column and the content contains the value and series name', function(done) {

        histogram.chart.render(null, testData)

        var columnUnderlay = histogram.element.find('rect.column-underlay').get(0);
        var column = histogram.element.find('rect.column').get(0);

        histogram.element.on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(payload.element).to.equal(column);
          expect(payload.content.text()).to.include('Series 1');
          expect(payload.content.text()).to.include('5 unit_other');
          done();
        });

        testHelpers.fireMouseEvent(columnUnderlay, 'mousemove');
      });
    });

    describe('on a column with value = 5', function() {

      it('should emit an event in which the `element` property is the column itself and the content contains the value and series name', function(done) {

        histogram.chart.render(null, testData)

        var column = histogram.element.find('rect.column').get(0);

        histogram.element.on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(payload.element).to.equal(column);
          expect(payload.content.text()).to.include('Series 1');
          expect(payload.content.text()).to.include('5 unit_other');
          done();
        });

        testHelpers.fireMouseEvent(column, 'mousemove');
      });
    });

    describe('on a column with value = 1', function() {

      it('should emit an event in which the `element` property is the column itself and the content contains the value and series name', function(done) {

        histogram.chart.render(null, testData)

        var column = histogram.element.find('rect.column').get(1);

        histogram.element.on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(payload.element).to.equal(column);
          expect(payload.content.text()).to.include('Series 1');
          expect(payload.content.text()).to.include('1 unit_one');
          done();
        });

        testHelpers.fireMouseEvent(column, 'mousemove');
      });
    });
  });
});
