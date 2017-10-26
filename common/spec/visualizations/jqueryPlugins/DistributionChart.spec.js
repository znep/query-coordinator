var _ = require('lodash');
var $ = require('jquery');

describe('DistributionChart jQuery component', function() {
  var DistributionChart = require('common/visualizations/DistributionChart');
  var helpers = require('common/visualizations/views/DistributionChartHelpers');

  var vif = {
    aggregation: {
      field: null,
      'function': 'count'
    },
    domain: 'dataspace.demo.socrata.com',
    datasetUid: 'fdqy-yyme',
    columnName: 'ward',
    configuration: {
    },
    filters: [],
    type: 'distributionChart',
    unit: {
      one: 'ward',
      other: 'wards'
    }
  };

  var fakeData = {
    unfiltered: [
      { start: -10, end: 0, value: -20 },
      { start: 0, end: 10, value: 100 },
      { start: 10, end: 100, value: 30 },
      { start: 100, end: 1000, value: 80 }
    ],
    filtered: [
      { start: -10, end: 0, value: 20 },
      { start: 0, end: 10, value: 30 },
      { start: 10, end: 100, value: 10 },
      { start: 100, end: 1000, value: 80 }
    ]
  };

  var outlet;

  beforeEach(function() {
    outlet = $('<div class="distribution-chart"></div>')[0];
    $('body').append(outlet);
  });

  afterEach(function() {
    $('.distribution-chart').remove();
  });

  describe('constructor', function() {
    it('initializes the element with the correct data', function() {
      var distributionChart = new DistributionChart(outlet, vif);

      expect(distributionChart.element).to.equal(outlet);
      expect(distributionChart.props.vif).to.deep.equal(vif);
      expect(_.isFunction(distributionChart.props.onFlyout)).to.equal(true);
      expect(_.isFunction(distributionChart.props.onFilter)).to.equal(true);
    });
  });

  describe('updateVif', function() {
    it('sets the vif to equal the input', function() {
      var distributionChart = new DistributionChart(outlet, vif);

      expect(distributionChart.props.vif).to.deep.equal(vif);

      var newVif = _.cloneDeep(vif);
      newVif.unit.one = 'row';
      newVif.unit.other = 'rows';

      distributionChart.updateVif(newVif);

      expect(distributionChart.props.vif).to.deep.equal(newVif);
    });

    it('reinitializes the data providers', function() {
      var distributionChart = new DistributionChart(outlet, vif);

      var oldColumnDomainDataProvider = distributionChart.columnDomainDataProvider;
      var oldUnfilteredDataProvider = distributionChart.unfilteredDataProvider;
      var oldFilteredDataProvider = distributionChart.filteredDataProvider;

      var newVif = _.cloneDeep(vif);
      newVif.domain = 'newdomain';

      distributionChart.updateVif(vif);

      expect(distributionChart.columnDomainDataProvider).to.not.equal(oldColumnDomainDataProvider);
      expect(distributionChart.unfilteredDataProvider).to.not.equal(oldUnfilteredDataProvider);
      expect(distributionChart.filteredDataProvider).to.not.equal(oldFilteredDataProvider);
    });
  });

  describe('updateDimensions', function() {
    it('sets width and height on props to be the element\'s dimensions', function() {
      var distributionChart = new DistributionChart(outlet, vif);

      outlet.style.width = '123px';
      outlet.style.height = '456px';

      expect(distributionChart.props.width).to.not.equal(123);
      expect(distributionChart.props.height).to.not.equal(456);

      distributionChart.updateDimensions();

      expect(distributionChart.props.width).to.equal(123);
      expect(distributionChart.props.height).to.equal(456);
    });
  });

  describe('updateData', function() {
    it('sets the data prop and calls fetchColumnDomain and fetchBucketedData', function(done) {
      var distributionChart = new DistributionChart(outlet, vif);

      expect(distributionChart.props.data).to.not.exist;

      sinon.stub(DistributionChart.prototype, 'fetchColumnDomain').resolves({
        min: 0,
        max: 10
      });

      sinon.stub(DistributionChart.prototype, 'fetchBucketedData').resolves(fakeData);

      distributionChart.updateData().then(function() {
        expect(distributionChart.props.data).to.deep.equal(fakeData);

        expect(DistributionChart.prototype.fetchColumnDomain.callCount).to.equal(1);
        expect(DistributionChart.prototype.fetchBucketedData.callCount).to.equal(1);

        DistributionChart.prototype.fetchColumnDomain.restore();
        DistributionChart.prototype.fetchBucketedData.restore();

        done();
      });
    });
  });

  describe('fetchColumnDomain', function() {
    it('makes a request for the min and max of the column in the vif', function(done) {
      var distributionChart = new DistributionChart(outlet, vif);

      sinon.stub(distributionChart.columnDomainDataProvider, 'getRows').callsFake(
        function(columnNames, columnDomainQuery) {
          expect(columnDomainQuery).to.match(/select min\([^\)]+\)/i);
          expect(columnDomainQuery).to.match(/select .* max\([^\)]+\)/i);
          return Promise.resolve({
            rows: [[0, 100]]
          });
        }
      );

      distributionChart.fetchColumnDomain().then(function(result) {
        expect(result.min).to.equal(0);
        expect(result.max).to.equal(100);
        done();
      });
    });
  });

  describe('fetchBucketedData', function() {
    var distributionChart;
    var unfilteredQueryStub;
    var filteredQueryStub;
    var transformBucketedDataStub;

    function createDistributionChart(vif) {
      distributionChart = new DistributionChart(outlet, vif);

      unfilteredQueryStub = sinon.stub(distributionChart.unfilteredDataProvider, 'query').resolves([]);
      filteredQueryStub = sinon.stub(distributionChart.filteredDataProvider, 'query').resolves([]);

      transformBucketedDataStub = sinon.stub(DistributionChart.prototype, 'transformBucketedData').returnsArg(0);
    }

    afterEach(function() {
      unfilteredQueryStub.restore();
      filteredQueryStub.restore();
      transformBucketedDataStub.restore();
    });

    function getUnfilteredQuery() {
      return unfilteredQueryStub.args[0][0];
    }

    function getFilteredQuery() {
      return filteredQueryStub.args[0][0];
    }

    it('uses signed_magnitude_linear if the bucketingOptions specify linear buckets', function() {
      var bucketingOptions = {
        bucketType: 'linear',
        bucketSize: 50
      };

      createDistributionChart(vif);
      distributionChart.fetchBucketedData(bucketingOptions);

      expect(getUnfilteredQuery()).to.match(/signed_magnitude_linear/);
      expect(getFilteredQuery()).to.match(/signed_magnitude_linear/);
    });

    it('uses the bucketSize specified by the bucketingOptions', function() {
      var bucketingOptions = {
        bucketType: 'linear',
        bucketSize: 50
      };

      createDistributionChart(vif);
      distributionChart.fetchBucketedData(bucketingOptions);

      expect(getUnfilteredQuery()).to.match(/signed_magnitude_linear\(ward, 50\)/);
      expect(getFilteredQuery()).to.match(/signed_magnitude_linear\(ward, 50\)/);
    });

    it('uses signed_magnitude_10 if the bucketingOptions specify logarithmic buckets', function() {
      var bucketingOptions = {
        bucketType: 'logarithmic'
      };

      createDistributionChart(vif);
      distributionChart.fetchBucketedData(bucketingOptions);

      expect(getUnfilteredQuery()).to.match(/signed_magnitude_10/);
      expect(getFilteredQuery()).to.match(/signed_magnitude_10/);
    });

    it('includes the where clause in the filtered query', function() {
      var newVif = _.cloneDeep(vif);
      newVif.filters.push({
        'function': 'valueRange',
        'columnName': 'year',
        'arguments': {
          'start': 0,
          'end': 40
        }
      });

      var bucketingOptions = {
        bucketType: 'logarithmic'
      };

      createDistributionChart(newVif);
      distributionChart.fetchBucketedData(bucketingOptions);

      expect(getUnfilteredQuery()).to.not.match(/where/);
      expect(getFilteredQuery()).to.match(/`year` >= 0 and `year` < 40/i);
    });

    it('includes the aggregation clause in the queries', function() {
      var newVif = _.cloneDeep(vif);
      newVif.aggregation = {
        'function': 'sum',
        'field': 'year'
      };

      var bucketingOptions = {
        bucketType: 'logarithmic'
      };

      createDistributionChart(newVif);
      distributionChart.fetchBucketedData(bucketingOptions);

      expect(getUnfilteredQuery()).to.match(/sum\(`year`\)/i);
      expect(getFilteredQuery()).to.match(/sum\(`year`\)/i);
    });

    it('includes the group by clause in the queries', function() {
      createDistributionChart(vif);
      distributionChart.fetchBucketedData({ bucketType: 'logarithmic' });

      expect(getUnfilteredQuery()).to.match(/group by __magnitude__/i);
      expect(getFilteredQuery()).to.match(/group by __magnitude__/i);
    });

    it('includes the order by clause in the queries', function() {
      createDistributionChart(vif);
      distributionChart.fetchBucketedData({ bucketType: 'logarithmic' });

      expect(getUnfilteredQuery()).to.match(/order by __magnitude__/i);
      expect(getFilteredQuery()).to.match(/order by __magnitude__/i);
    });

    it('includes the limit clause in the queries', function() {
      createDistributionChart(vif);
      distributionChart.fetchBucketedData({ bucketType: 'logarithmic' });

      expect(getUnfilteredQuery()).to.match(/limit 200/i);
      expect(getFilteredQuery()).to.match(/limit 200/i);
    });

    it('calls transformBucketedData on the result', function(done) {
      createDistributionChart(vif);
      distributionChart.fetchBucketedData({ bucketType: 'logarithmic' }).then(function() {
        expect(transformBucketedDataStub.callCount).to.equal(1);
        done();
      });
    });
  });

  describe('transformBucketedData', function() {
    it('transform the data provider responses into an object with unfiltered and filtered keys', function() {
      var unfiltered = {
        rows: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0]
        ]
      };

      var filtered = unfiltered;

      var distributionChart = new DistributionChart(outlet, vif);
      var bucketingOptions = { bucketType: 'linear', bucketSize: 1 };

      var result = distributionChart.transformBucketedData(bucketingOptions, [unfiltered, filtered]);
      expect(result.unfiltered).to.exist;
      expect(result.filtered).to.exist;
    });

    it('adds missing filtered buckets to the result', function() {
      var unfiltered = {
        rows: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0]
        ]
      };

      var filtered = {
        rows: [
          [0, 0]
        ]
      };

      var distributionChart = new DistributionChart(outlet, vif);
      var bucketingOptions = { bucketType: 'linear', bucketSize: 1 };

      var result = distributionChart.transformBucketedData(bucketingOptions, [unfiltered, filtered]);

      expect(result.unfiltered).to.have.length(4);
      expect(result.filtered).to.have.length(4);
    });

    it('throws an error if the unfiltered data is empty', function() {
      var unfiltered = {
        rows: []
      };

      var filtered = unfiltered;

      var distributionChart = new DistributionChart(outlet, vif);
      var bucketingOptions = { bucketType: 'linear', bucketSize: 1 };

      expect(_.partial(distributionChart.transformBucketedData, bucketingOptions, [unfiltered, filtered])).to.throw;
    });
  });

  describe('onFlyout', function() {
    var flyoutPayload = {
      start: -10,
      end: 20,
      unfiltered: 17,
      filtered: 17
    };

    it('emits an event on the element', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', function() {
        done();
      });

      var distributionChart = new DistributionChart(outlet, vif);

      distributionChart.onFlyout(flyoutPayload);
    });

    it('emits with a payload of null if the payload from the renderer is null', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload).to.equal(null);
        done();
      });

      var distributionChart = new DistributionChart(outlet, vif);

      distributionChart.onFlyout(null);
    });

    it('emits a payload with an element key', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload.element).to.exist;
        done();
      });

      var distributionChart = new DistributionChart(outlet, vif);

      distributionChart.onFlyout(flyoutPayload);
    });

    it('emits a payload with a content key', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload.content).to.exist;
        var content = $('<div>' + payload.content + '</div>');
        expect(content.find('.socrata-flyout-title').length).to.equal(1);
        expect(content.find('.socrata-flyout-table').length).to.equal(1);
        expect(content.find('.socrata-flyout-row').length).to.equal(2);
        expect(content.find('.socrata-flyout-cell').length).to.equal(4);
        done();
      });

      var distributionChart = new DistributionChart(outlet, vif);

      distributionChart.onFlyout(flyoutPayload);
    });
  });

  describe('onFilter', function() {
    var filterPayload = {
      start: -10,
      end: 20
    };

    it('emits an event on the element', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_VIF_UPDATED', function() {
        done();
      });

      var distributionChart = new DistributionChart(outlet, vif);

      distributionChart.onFilter(filterPayload);
    });

    it('clears filters with the same column as the vif if the payload is null', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {
        var newVif = event.originalEvent.detail;
        expect(newVif.filters).to.be.instanceof(Array);
        expect(newVif.filters).to.have.length(0);
        done();
      });

      var filteredVif = _.cloneDeep(vif);
      filteredVif.filters.push({
        'columnName': vif.columnName,
        'function': 'valueRange',
        'arguments': {
          start: 0,
          end: 10
        }
      });

      var distributionChart = new DistributionChart(outlet, filteredVif);

      distributionChart.onFilter(null);
    });

    it('keeps filters from other columns', function(done) {
      $(outlet).on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {
        var newVif = event.originalEvent.detail;
        expect(newVif.filters).to.be.instanceof(Array);
        expect(newVif.filters).to.have.length(1);
        done();
      });

      var filteredVif = _.cloneDeep(vif);

      filteredVif.filters.push({
        'columnName': 'a different column',
        'function': 'binaryOperator',
        'arguments': {
          operator: '=',
          operand: 'operand'
        }
      });

      filteredVif.filters.push({
        'columnName': vif.columnName,
        'function': 'valueRange',
        'arguments': {
          start: 0,
          end: 10
        }
      });

      var distributionChart = new DistributionChart(outlet, filteredVif);

      distributionChart.onFilter(null);
    });
  });
});
