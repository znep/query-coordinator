describe('TimelineChartService', function() {
  'use strict';

  var TimelineChartService;
  var I18n;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    TimelineChartService = $injector.get('TimelineChartService');
    I18n = $injector.get('I18n');
  }));

  describe('transformChartDataForRendering', function() {
    it('should add min/max for dates and values, and mean for value', function() {
      var numValues = 30;
      var datumCount = _.range(numValues);
      var dates = _.map(datumCount, function(i) { return moment(new Date(2014, 0, i + 1)); });
      var unfilteredValues = _.map(datumCount, function(i) { return 100 * i; });
      var filteredValues = _.map(unfilteredValues, function(val) { return val / 2; });

      var transformed = TimelineChartService.transformChartDataForRendering(
        _.map(datumCount, function(i) {
          return {
            date: dates[i],
            total: unfilteredValues[i],
            filtered: filteredValues[i]
          }
        })
      );

      expect(1 * transformed.minDate).to.equal(1 * new Date(2014, 0, 1));
      expect(1 * transformed.maxDate).to.equal(1 * new Date(2014, 0, 30));
      expect(transformed.minValue).to.equal(0);
      expect(transformed.maxValue).to.equal(100 * (numValues - 1));
      expect(transformed.meanValue).to.equal(100 * (numValues - 1) / 2);
      expect(transformed.values.length).to.equal(numValues);
      for (var i = 0; i < numValues; i++) {
        expect(1 * transformed.values[i].date).to.equal(1 * dates[i]);
        expect(transformed.values[i].filtered).to.equal(filteredValues[i]);
        expect(transformed.values[i].unfiltered).to.equal(unfilteredValues[i]);
      }
    });
  });

  describe('getVisualizationConfig', function() {
    describe('rowDisplayUnit', function() {
      it('returns an object with a "unit" key containing singular and plural versions of the rowDisplayUnit', function() {
        var config = TimelineChartService.getVisualizationConfig('crime');

        expect(config.unit).to.deep.equal({
          one: 'crime',
          other: 'crimes'
        });
      });

      it('uses "row" as the rowDisplayUnit if none is provided', function() {
        var config = TimelineChartService.getVisualizationConfig();

        expect(config.unit).to.deep.equal({
          one: 'row',
          other: 'rows'
        });
      });
    });

    describe('allowFilterChange', function() {
      it('sets the "interactive" property based on the allowFilterChanged parameter', function() {
        var config = TimelineChartService.getVisualizationConfig('row', true);
        expect(config.configuration.interactive).to.equal(true);

        config = TimelineChartService.getVisualizationConfig('row', false);
        expect(config.configuration.interactive).to.equal(false);
      });
    });

    it('returns an object with appropriate localization information', function() {
      var config = TimelineChartService.getVisualizationConfig();

      expect(config.configuration.localization).to.deep.equal({
        FLYOUT_UNFILTERED_AMOUNT_LABEL: I18n.flyout.total,
        FLYOUT_FILTERED_AMOUNT_LABEL: I18n.flyout.filteredAmount
      });
    });
  });

  describe('getUnitConfiguration', function() {
    it('returns an object with "one" and "other" keys using the supplied rowDisplayUnit', function() {
      expect(TimelineChartService.getUnitConfiguration('crime')).to.deep.equal({
        one: 'crime',
        other: 'crimes'
      });
    });

    it('uses "row" if no rowDisplayUnit is specified', function() {
      expect(TimelineChartService.getUnitConfiguration()).to.deep.equal({
        one: 'row',
        other: 'rows'
      });
    });
  });

  describe('renderFlyout', function() {
    it('returns nothing if the payload is not an object', function() {
      expect(TimelineChartService.renderFlyout()).to.be.undefined;
      expect(TimelineChartService.renderFlyout(null)).to.be.undefined;
      expect(TimelineChartService.renderFlyout(true)).to.be.undefined;
      expect(TimelineChartService.renderFlyout(0)).to.be.undefined;
    });

    it('returns a flyout title element containing the payload title', function() {
      var payload = {
        title: 'my title'
      };

      var flyout = '<div class="flyout-title">my title</div>';

      expect(TimelineChartService.renderFlyout(payload)).to.equal(flyout);
    });

    it('returns a flyout row containing the unfiltered information if it is present', function() {
      var payload = {
        title: 'my title',
        unfilteredLabel: 'total',
        unfilteredValue: 100
      };

      var result = $(TimelineChartService.renderFlyout(payload));

      expect(result.eq(0)).to.have.class('flyout-title');
      expect(result.eq(1)).to.have.class('flyout-row');

      expect(result.find('.flyout-cell')).to.have.length(2);
      expect(result.find('.flyout-cell').eq(0).text()).to.equal('total');
      expect(result.find('.flyout-cell').eq(1).text()).to.equal('100');
    });

    it('returns a flyout row containing the filtered information if it is present', function() {
      var payload = {
        title: 'my title',
        unfilteredLabel: 'total',
        unfilteredValue: 100,
        filteredLabel: 'filtered',
        filteredValue: 50
      };

      var result = $(TimelineChartService.renderFlyout(payload));

      expect(result.eq(0)).to.have.class('flyout-title');
      expect(result.eq(1)).to.have.class('flyout-row');
      expect(result.eq(2)).to.have.class('flyout-row');

      expect(result.find('.flyout-cell')).to.have.length(4);
      expect(result.find('.flyout-cell').eq(0).text()).to.equal('total');
      expect(result.find('.flyout-cell').eq(1).text()).to.equal('100');
      expect(result.find('.flyout-cell').eq(2).text()).to.equal('filtered');
      expect(result.find('.flyout-cell').eq(3).text()).to.equal('50');
    });

    it('applies a class of "emphasis" to the filtered cells if filteredBySelection is absent', function() {
      var payload = {
        title: 'my title',
        unfilteredLabel: 'total',
        unfilteredValue: 100,
        filteredLabel: 'filtered',
        filteredValue: 50
      };

      var result = $(TimelineChartService.renderFlyout(payload));
      expect(result.find('.flyout-cell.emphasis')).to.have.length(2);
      expect(result.find('.flyout-cell.is-selected')).to.have.length(0);
    });

    it('applies a class of "is-selected" to the filtered cells if filteredBySelection is present', function() {
      var payload = {
        title: 'my title',
        unfilteredLabel: 'total',
        unfilteredValue: 100,
        filteredLabel: 'filtered',
        filteredValue: 50,
        filteredBySelection: true
      };

      var result = $(TimelineChartService.renderFlyout(payload));
      expect(result.find('.flyout-cell.emphasis')).to.have.length(0);
      expect(result.find('.flyout-cell.is-selected')).to.have.length(2);
    });
  });
});
