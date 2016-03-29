describe('PageDataService', function() {
  'use strict';

  var testHelpers;
  var $httpBackend;
  var PageDataService;
  var v0FakeRequestHandler;
  var v1FakeRequestHandler;
  var fake4x4 = 'fake-data';
  var v0PageDataUrlMatcher = new RegExp('/page_metadata/{0}\\.json'.format(fake4x4));
  var v1PageDataUrlMatcher = new RegExp('/metadata/v1/page/{0}\\.json'.format(fake4x4));
  // Note that we don't actually care much about the format of
  // the fakePageData. The tests that cover metadata migration
  // look at the urls to which requests are made, not the results.
  var fakePageData = {
    description: 'test description',
    name: 'test name',
    cards: [
      {
        cardSize: 1,
        displayMode: 'visualization',
        expanded: false,
        cardCustomStyle: {},
        expandedCustomStyle: {},
        activeFilters: [],
        fieldName: '*'
      }
    ],
    datasetId: 'bard-song',
    pageId: fake4x4
  };

  function assertReject(response, done) {
    response.then(function(data) {
      throw new Error('Should not resolve promise');
    }, function(error) {
      done();
    });
  }

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    PageDataService = $injector.get('PageDataService');
    testHelpers = $injector.get('testHelpers');
    $httpBackend = $injector.get('$httpBackend');
    v0FakeRequestHandler = $httpBackend.whenGET(v0PageDataUrlMatcher);
    v1FakeRequestHandler = $httpBackend.whenGET(v1PageDataUrlMatcher);
    v0FakeRequestHandler.respond(fakePageData);
    v1FakeRequestHandler.respond(fakePageData);
  }));

  describe('getPageMetadata', function() {
    it('should throw on bad parameters', function() {
      expect(function() { PageDataService.getPageMetadata(); }).to.throw();
    });

    it('should access the correct page metadata', function(done) {
      var response = PageDataService.getPageMetadata(fake4x4);
      response.then(function(data) {
        expect(data).to.eql(fakePageData);
        done();
      });
      $httpBackend.flush();
    });
  });

  describe('save', function() {

    it('should throw on bad parameters', function() {
      expect(function() { PageDataService.save(); }).to.throw();
      expect(function() { PageDataService.save('foo'); }).to.throw();
      expect(function() { PageDataService.save({}, {}); }).to.throw();
    });

    it('should PUT if an ID is provided', function() {
      $httpBackend.expectPUT(v1PageDataUrlMatcher, JSON.stringify(fakePageData)).respond(200, 'ok');
      PageDataService.save(fakePageData, fake4x4);
      $httpBackend.flush();
    });

    it('should POST if no ID is provided', function() {
      $httpBackend.expectPOST(new RegExp('/metadata/v1/page\\.json'), JSON.stringify(fakePageData)).respond(200, 'ok');
      PageDataService.save(fakePageData);
      $httpBackend.flush();
    });

  });

});
