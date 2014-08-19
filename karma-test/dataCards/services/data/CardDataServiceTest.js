describe("CardDataService", function() {
  var $httpBackend, CardDataService;
  var fakeDataRequestHandler;

  var fake4x4 = 'fake-data';

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    CardDataService = $injector.get('CardDataService');
    $httpBackend = $injector.get('$httpBackend');
    fakeDataRequestHandler = $httpBackend.whenGET(new RegExp('^/api/id/{0}\\.json\\?'.format(fake4x4)));
    fakeDataRequestHandler.respond([
      { name: 'fakeNumberColumn', value: 3 }
      ]);
  }));

  describe('getData', function() {
    it('should throw on bad parameters', function() {
      expect(function() { CardDataService.getData(); }).to.throw();
      expect(function() { CardDataService.getData({}); }).to.throw();
      expect(function() { CardDataService.getData('field'); }).to.throw();
      expect(function() { CardDataService.getData('field', 'dead-beef', {}); }).to.throw();
      expect(function() { CardDataService.getData('field', {}); }).to.throw();
    });

    it('should access the correct dataset', function(done) {
      var response = CardDataService.getData('fakeNumberColumn', fake4x4);
      response.then(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should pass through the where clause', function() {
      $httpBackend.expectGET('/api/id/{0}.json?$query=select fakeNumberColumn as name, count(*) as value  group by fakeNumberColumn order by count(*) desc limit 200'.format(fake4x4));
      $httpBackend.expectGET('/api/id/{0}.json?$query=select fakeNumberColumn as name, count(*) as value where MAGICAL_WHERE_CLAUSE group by fakeNumberColumn order by count(*) desc limit 200'.format(fake4x4));

      CardDataService.getData('fakeNumberColumn', fake4x4);
      CardDataService.getData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE');

      $httpBackend.flush();
    });

    it('should parse the aggregation result as a number', function(done) {
      var fakeData = [
        { name: 'alreadyInt', value: 3 },
        { name: 'alreadyFloat', value: 3.14 },
        { name: 'goodNumberString', value: '123' },
        { name: 'badNumberString', value: 'asd' },
        { name: 'null', value: null },
        { name: 'undef', value: undefined }
      ];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getData('fakeNumberColumn', fake4x4);
      response.then(function(data) {
        expect(data).to.deep.equal([
          { name: 'alreadyInt', value: 3 },
          { name: 'alreadyFloat', value: 3.14 },
          { name: 'goodNumberString', value: 123 },
          { name: 'badNumberString', value: NaN },
          { name: 'null', value: NaN },
          { name: 'undef', value: NaN }
        ]);
        done();
      });
      $httpBackend.flush();
    });

    function assertReject(response, done) {
      response.then(function(data) {
        throw new Error('Should not resolve promise');
      }, function(error) {
        done();
      });
    };

    it('reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

  });
});
