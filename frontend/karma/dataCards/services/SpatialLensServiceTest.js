const angular = require('angular');

describe('SpatialLensService', function() {
  'use strict';

  var self;

  var dependencies = [
    '$httpBackend',
    'SpatialLensService',
    'Mockumentary'
  ];

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    var testHelpers = $injector.get('testHelpers');
    self = this;
    testHelpers.injectDependencies(self, dependencies);
    self.testColumns = require('karma/dataCards/test-data/spatialLensServiceTest/columns.json');
    self.testCuratedRegions = require('karma/dataCards/test-data/spatialLensServiceTest/curated-regions.json');
  }));

  describe('getAvailableGeoregions$', function() {
    afterEach(function() {
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });

    it('returns the existing computed columns on the dataset unioned with the enabled curated regions', function() {
      self.$httpBackend.expectGET(/\/api\/curated_regions$/).respond(self.testCuratedRegions);
      var dataset = self.Mockumentary.createDataset({ columns: self.testColumns });
      var georegions$ = self.SpatialLensService.getAvailableGeoregions$(dataset);
      georegions$.subscribe(function(georegions) {
        expect(georegions).to.deep.equal([
          self.testCuratedRegions[0],
          self.testCuratedRegions[1],
          {
            name: self.testColumns.computed_region_1.name,
            view: {
              id: self.testColumns.computed_region_1.computationStrategy.parameters.region.substring(1)
            }
          }
        ]);
      });

      // Note that this makes the test synchronous by immediately resolving all promises within a
      // $digest, which alleviates the need to use done() (in fact using done will cause an error if
      // any afterEach hooks use verifyNoOutstandingEpectation, as we have here due to a digest
      // already being in progress).
      self.$httpBackend.flush();
    });
  });

  describe('findComputedColumnForRegion', function() {
    it('returns the column for the specified region four by four', function() {
      var column = self.SpatialLensService.findComputedColumnForRegion(self.testColumns, 'five-five');
      expect(column).to.deep.equal(self.testColumns.computed_region_2);
    });

    it('returns undefined if the computed column does not exist', function() {
      var column = self.SpatialLensService.findComputedColumnForRegion(self.testColumns, 'sevn-sevn');
      expect(column).to.equal(undefined);
    });

    it('tolerates weird arguments and returns undefined', function() {
      expect(self.SpatialLensService.findComputedColumnForRegion(undefined)).to.equal(undefined);
      expect(self.SpatialLensService.findComputedColumnForRegion(null)).to.equal(undefined);
      expect(self.SpatialLensService.findComputedColumnForRegion(self.testColumns, undefined)).to.equal(undefined);
      expect(self.SpatialLensService.findComputedColumnForRegion(self.testColumns, null)).to.equal(undefined);
    });
  });

  describe('cardNeedsRegionCoding', function() {
    var page;
    var card;

    beforeEach(function() {
      page = self.Mockumentary.createPage({}, { columns: self.testColumns });
      card = self.Mockumentary.createCard(page, 'location', {});
    });

    it('returns false if the card is not a choropleth', function() {
      card.set('cardType', 'feature');
      expect(self.SpatialLensService.cardNeedsRegionCoding(card)).to.equal(false);
    });

    it('returns true if the dataset is missing the computed column specified by the card', function() {
      card.set('cardType', 'choropleth');
      card.set('computedColumn', 'psh_this_computed_column_does_not_exist_are_you_crazy');
      expect(self.SpatialLensService.cardNeedsRegionCoding(card)).to.equal(true);
    });

    it('returns false if the card\'s computed column exists on the dataset', function() {
      card.set('cardType', 'choropleth');
      card.set('computedColumn', 'computed_region_1');
      expect(self.SpatialLensService.cardNeedsRegionCoding(card)).to.equal(false);
    });
  });

  describe('initiateRegionCodingIfNecessaryForCard', function() {
    var page;
    var card;

    beforeEach(function() {
      page = self.Mockumentary.createPage({}, { columns: self.testColumns });
      card = self.Mockumentary.createCard(page, 'location', {});
      card.set('cardType', 'choropleth');
    });

    it('does not call the status or initiate endpoints if the card does not need region coding', function() {
      card.set('computedColumn', 'computed_region_1');

      self.SpatialLensService.initiateRegionCodingIfNecessaryForCard(card).then(function(response) {
        expect(response).to.equal(null);
      });

      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });

    it('retrieves region coding status and takes no action if the status is completed', function() {
      card.set('computedColumn', 'i_need_region_coding');

      self.$httpBackend.expectGET(/\/geo\/status/).respond({
        success: true,
        status: 'completed'
      });

      self.SpatialLensService.initiateRegionCodingIfNecessaryForCard(card).then(function(response) {
        expect(response).to.equal(null);
      });

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });

    it('retrieves region coding status and takes no action if the status is processing', function() {
      card.set('computedColumn', 'i_need_region_coding');

      self.$httpBackend.expectGET(/\/geo\/status/).respond({
        success: true,
        status: 'processing'
      });

      self.SpatialLensService.initiateRegionCodingIfNecessaryForCard(card).then(function(response) {
        expect(response).to.equal(null);
      });

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });

    it('retrieves region coding status and initiates a new job if the status is unknown', function() {
      sinon.stub(socrata.utils, 'getCookie').returns('CSRF-TOKEN');
      card.set('computedColumn', 'i_need_region_coding');

      self.$httpBackend.expectGET(/\/geo\/status/).respond({
        success: true,
        status: 'unknown'
      });

      self.$httpBackend.expectPOST(/\/geo\/initiate/).respond({
        success: true
      });

      self.SpatialLensService.initiateRegionCodingIfNecessaryForCard(card);

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
      socrata.utils.getCookie.restore();
    });

    it('retrieves region coding status and initiates a new job if the status is failed', function() {
      sinon.stub(socrata.utils, 'getCookie').returns('CSRF-TOKEN');
      card.set('computedColumn', 'i_need_region_coding');

      self.$httpBackend.expectGET(/\/geo\/status/).respond({
        success: true,
        status: 'failed'
      });

      self.$httpBackend.expectPOST(/\/geo\/initiate/).respond({
        success: true
      });

      self.SpatialLensService.initiateRegionCodingIfNecessaryForCard(card);

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
      socrata.utils.getCookie.restore();
    });

    it('uses the defaultId if the data lens is based on a derived view', function() {
      page = self.Mockumentary.createPage(
        {
          isFromDerivedView: true
        },
        {
          columns: self.testColumns,
          defaultId: 'abcd-1234',
          id: 'four-four'
        }
      );
      card = self.Mockumentary.createCard(page, 'location', {});
      card.set('cardType', 'choropleth');
      card.set('computedColumn', 'i_need_region_coding');

      self.$httpBackend.expectGET(/\/geo\/status.*abcd-1234/).respond({
        success: true,
        status: 'completed'
      });

      self.SpatialLensService.initiateRegionCodingIfNecessaryForCard(card).then(function(response) {
        expect(response).to.equal(null);
      });

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });
  });

  describe('getCuratedRegions', function() {
    it('calls /api/curated_regions', function() {
      self.$httpBackend.expectGET(/\/api\/curated_regions$/).respond(self.testCuratedRegions);
      self.SpatialLensService.getCuratedRegions().then(function(regions) {
        expect(regions).to.deep.equal(self.testCuratedRegions);
      });

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });
  });

  describe('initiateRegionCoding', function() {
    it('posts to /geo/initiate with the dataset, shapefile, and source column', function() {
      sinon.stub(socrata.utils, 'getCookie').returns('CSRF-TOKEN');

      self.$httpBackend.expectPOST(/\/geo\/initiate$/, {
        datasetId: 'asdf-fdsa',
        shapefileId: 'four-four',
        sourceColumn: 'location'
      }).respond({ success: true });

      self.SpatialLensService.initiateRegionCoding('asdf-fdsa', 'four-four', 'location');

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
      socrata.utils.getCookie.restore();
    });
  });

  describe('getRegionCodingStatus', function() {
    it('queries /geo/status with the dataset and shapefile', function() {
      self.$httpBackend.expectGET(function(url) {
        if (url.indexOf('/geo/status') === -1) { return false; }
        if (url.indexOf('datasetId=asdf-fdsa') === -1) { return false; }
        if (url.indexOf('shapefileId=four-four') === -1) { return false; }
        return true;
      }).respond({ success: true });

      self.SpatialLensService.getRegionCodingStatus('asdf-fdsa', 'four-four');

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });
  });

  describe('getRegionCodingStatusFromJob', function() {
    it('queries /geo/status with the dataset and job', function() {
      self.$httpBackend.expectGET(function(url) {
        if (url.indexOf('/geo/status') === -1) { return false; }
        if (url.indexOf('datasetId=asdf-fdsa') === -1) { return false; }
        if (url.indexOf('jobId=qwer-asdf-zxcv') === -1) { return false; }
        return true;
      }).respond({ success: true });

      self.SpatialLensService.getRegionCodingStatusFromJob('asdf-fdsa', 'qwer-asdf-zxcv');

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });
  });

  describe('pollRegionCodingStatus', function() {
    var clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });

    it('polls the status endpoint every 5 seconds', function() {
      self.SpatialLensService.pollRegionCodingStatus('asdf-fdsa', 'qwer-asdf-zxcv').subscribe();

      for (var i = 1; i <= 5; i++) {
        self.$httpBackend.expectGET(function(url) {
          if (url.indexOf('/geo/status') === -1) { return false; }
          if (url.indexOf('datasetId=asdf-fdsa') === -1) { return false; }
          if (url.indexOf('jobId=qwer-asdf-zxcv') === -1) { return false; }
          return true;
        }).respond({ success: true, status: i == 5 ? 'completed' : 'processing' });

        clock.tick(5050);
      }

      self.$httpBackend.flush();
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });
  });
});
