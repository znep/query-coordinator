(function() {
  'use strict';

  describe('PageDataService', function() {
    var $httpBackend;
    var PageDataService;
    var ServerConfig;
    var fakeRequestHandler;
    var fake4x4 = 'fake-data';
    var pageDataUrl = '/page_metadata/{0}.json'.format(fake4x4);
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

    beforeEach(module('dataCards'));

    beforeEach(inject(function($injector) {
      PageDataService = $injector.get('PageDataService');
      ServerConfig = $injector.get('ServerConfig');
      $httpBackend = $injector.get('$httpBackend');
      fakeRequestHandler = $httpBackend.whenGET(pageDataUrl);
      fakeRequestHandler.respond(fakePageData);
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
        $httpBackend.expectPUT(pageDataUrl, { pageMetadata: JSON.stringify(fakePageData) }).respond(200, 'ok');
        PageDataService.save(fakePageData, fake4x4);
        $httpBackend.flush();
      });
      it('should POST if no ID is provided', function() {
        $httpBackend.expectPOST('/page_metadata.json', { pageMetadata: JSON.stringify(fakePageData) }).respond(200, 'ok');
        PageDataService.save(fakePageData);
        $httpBackend.flush();
      });
    });

  })

})();
