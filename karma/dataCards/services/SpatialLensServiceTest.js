describe('SpatialLensService', function() {
  'use strict';

  var self;

  var dependencies = [
    '$httpBackend',
    'SpatialLensService',
    'ServerConfig',
    'Mockumentary'
  ];

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    var testHelpers = $injector.get('testHelpers');
    self = this;
    testHelpers.injectDependencies(self, dependencies);
    self.testColumns = testHelpers.getTestJson('karma/dataCards/test-data/spatialLensServiceTest/columns.json');
    self.testCuratedRegions = testHelpers.getTestJson('karma/dataCards/test-data/spatialLensServiceTest/curated-regions.json');
  }));

  describe('isSpatialLensEnabled', function() {
    it('is false if enableSpatialLensRegionCoding is false', function() {
      sinon.stub(self.ServerConfig, 'get').withArgs('enableSpatialLensRegionCoding').returns(false);
      expect(self.SpatialLensService.isSpatialLensEnabled()).to.equal(false);
      self.ServerConfig.get.restore();
    });

    it('is true if enableSpatialLensRegionCoding is true', function() {
      sinon.stub(self.ServerConfig, 'get').withArgs('enableSpatialLensRegionCoding').returns(true);
      expect(self.SpatialLensService.isSpatialLensEnabled()).to.equal(true);
      self.ServerConfig.get.restore();
    });
  });

  describe('isSpatialLensAdminEnabled', function() {
    it('is false if enableSpatialLensAdmin is false', function() {
      sinon.stub(self.ServerConfig, 'get').withArgs('enableSpatialLensAdmin').returns(false);
      expect(self.SpatialLensService.isSpatialLensAdminEnabled()).to.equal(false);
      self.ServerConfig.get.restore();
    });

    it('is true if enableSpatialLensAdmin is true', function() {
      sinon.stub(self.ServerConfig, 'get').withArgs('enableSpatialLensAdmin').returns(true);
      expect(self.SpatialLensService.isSpatialLensAdminEnabled()).to.equal(true);
      self.ServerConfig.get.restore();
    });
  });

  describe('getAvailableGeoregions$', function() {
    afterEach(function() {
      self.$httpBackend.verifyNoOutstandingExpectation();
      self.$httpBackend.verifyNoOutstandingRequest();
    });

    it('returns the existing computed columns on the dataset when enableSpatialLensRegionCoding is false', function(done) {
      sinon.stub(self.ServerConfig, 'get').withArgs('enableSpatialLensRegionCoding').returns(false);
      var dataset = self.Mockumentary.createDataset({ columns: self.testColumns });
      var georegions$ = self.SpatialLensService.getAvailableGeoregions$(dataset);
      georegions$.subscribe(function(georegions) {
        expect(georegions).to.deep.equal([
          {
            name: self.testColumns.computed_region_1.name,
            view: {
              id: self.testColumns.computed_region_1.computationStrategy.parameters.region.substring(1)
            }
          },
          {
            name: self.testColumns.computed_region_2.name,
            view: {
              id: self.testColumns.computed_region_2.computationStrategy.parameters.region.substring(1)
            }
          }
        ]);

        self.ServerConfig.get.restore();
        done();
      });
    });

    it('returns the existing computed columns on the dataset unioned with the enabled curated regions when enableSpatialLensRegionCoding is true', function() {
      sinon.stub(self.ServerConfig, 'get').withArgs('enableSpatialLensRegionCoding').returns(true);
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

        self.ServerConfig.get.restore();
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

  describe('executeRegionCodingJob', function() {
    var clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });

    it('enqueues the job, then polls status', function() {
      sinon.stub(socrata.utils, 'getCookie').returns('CSRF-TOKEN');

      self.$httpBackend.expectPOST(/\/geo\/initiate$/, {
        datasetId: 'asdf-fdsa',
        shapefileId: 'four-four',
        sourceColumn: 'location'
      }).respond({ success: true, jobId: 'qwer-asdf-zxcv' });

      self.SpatialLensService.executeRegionCodingJob('asdf-fdsa', 'four-four', 'location').subscribe();

      self.$httpBackend.flush();

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
      socrata.utils.getCookie.restore();
    });
  });
});
