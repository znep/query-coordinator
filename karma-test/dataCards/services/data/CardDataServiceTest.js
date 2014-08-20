describe("CardDataService", function() {
  var $httpBackend, CardDataService;
  var fakeDataRequestHandler;

  var fake4x4 = 'fake-data';

  function assertReject(response, done) {
    response.then(function(data) {
      throw new Error('Should not resolve promise');
    }, function(error) {
      done();
    });
  };

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

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4), done);
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

  });

  describe('getTimelineDomain', function() {
    it('should throw on bad parameters', function() {
      expect(function() { CardDataService.getTimelineDomain(); }).to.throw();
      expect(function() { CardDataService.getTimelineDomain({}); }).to.throw();
      expect(function() { CardDataService.getTimelineDomain('field'); }).to.throw();
      expect(function() { CardDataService.getTimelineDomain('field', {}); }).to.throw();
    });

    it('should access the correct dataset', function(done) {
      var fakeData = [{
        start: '1988-01-10T08:00:00.000Z',
        end: '2101-01-10T08:00:00.000Z'
      }];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      response.then(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should generate a correct query', function() {
      $httpBackend.expectGET('/api/id/{1}.json?$query=SELECT min({0}) as start, max({0}) as end'.format('fakeNumberColumn', fake4x4));
      CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      $httpBackend.flush();
    });

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should parse valid results as dates', function(done) {
      var fakeData = [{
        start: '1988-01-10T08:00:00.000Z',
        end: '2101-01-10T08:00:00.000Z'
      }];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      response.then(function(data) {
        expect(moment.isMoment(data.start)).to.be.true;
        expect(moment.isMoment(data.end)).to.be.true;
        expect(data.start.year()).to.equal(1988);
        expect(data.end.year()).to.equal(2101);
        done();
      });
      $httpBackend.flush();
    });

    it('should reject the promise when bad start date is given', function(done) {
      var fakeDataInvalidMin = [{
        start: '01101988',
        end: '2101-01-10T08:00:00.000Z'
      }];
      fakeDataRequestHandler.respond(fakeDataInvalidMin);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should reject the promise when bad end date is given', function(done) {
      var fakeDataInvalidMax = [{
        start: '1988-01-10T08:00:00.000Z',
        end: 'trousers'
      }];
      fakeDataRequestHandler.respond(fakeDataInvalidMax);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty string response', function(done) {
      var fakeData = '';
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty array response', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty object response', function(done) {
      var fakeData = {};
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      assertReject(response, done);
      $httpBackend.flush();
    });
  });

  describe('getTimelineData', function() {
    it('should throw on bad parameters', function() {
      expect(function() { CardDataService.getTimelineData(); }).to.throw();
      expect(function() { CardDataService.getTimelineData({}); }).to.throw();
      expect(function() { CardDataService.getTimelineData('field'); }).to.throw();
      expect(function() { CardDataService.getTimelineData('field', 'dead-beef', {}); }).to.throw();
      expect(function() { CardDataService.getTimelineData('field', {}); }).to.throw();
      expect(function() { CardDataService.getTimelineData('field', 'dead-beef', '', {}); }).to.throw();
    });

    it('should access the correct dataset', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      response.then(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should pass through the where clause fragment', function() {
      $httpBackend.expectGET('/api/id/{1}.json?$query=SELECT date_trunc_ymd(fakeNumberColumn) AS date_trunc, count(*) AS value WHERE date_trunc IS NOT NULL GROUP BY date_trunc'.format('fakeNumberColumn', fake4x4));
      $httpBackend.expectGET('/api/id/{1}.json?$query=SELECT date_trunc_ymd(fakeNumberColumn) AS date_trunc, count(*) AS value WHERE date_trunc IS NOT NULL and MAGICAL_WHERE_CLAUSE GROUP BY date_trunc'.format('fakeNumberColumn', fake4x4));
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', 'DAY');
      $httpBackend.flush();
    });

    it('should throw given an unsupported precision', function() {
      expect(function() { CardDataService.getTimelineData('field', 'dead-beef', '', ''); }).to.throw();
      expect(function() { CardDataService.getTimelineData('field', 'dead-beef', '', 'day'); }).to.throw(); // correct one is DAY
      expect(function() { CardDataService.getTimelineData('field', 'dead-beef', '', 'WEEK'); }).to.throw();
      expect(function() { CardDataService.getTimelineData('field', 'dead-beef', '', 'FOO'); }).to.throw();
    });

    it('should correctly choose the date truncation function', function() {
      $httpBackend.expectGET(/date_trunc_ymd\(fakeNumberColumn\)/);
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      $httpBackend.flush();

      $httpBackend.expectGET(/date_trunc_ym\(fakeNumberColumn\)/);
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'MONTH');
      $httpBackend.flush();

      $httpBackend.expectGET(/date_trunc_y\(fakeNumberColumn\)/);
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'YEAR');
      $httpBackend.flush();
    });

    it('should correctly parse valid dates', function(done) {
      var fakeData = [
        {"date_trunc":"2014-05-27T00:00:00.000","value":"1508"},
        {"date_trunc":"2014-05-09T00:00:00.000","value":"238"},
        {"date_trunc":"2014-05-07T00:00:00.000","value":"624"},
        {"date_trunc":"2014-05-13T00:00:00.000","value":"718"}
      ];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      response.then(function(data) {
        // 21 is the number of date buckets we expect the call to generate`based on the dates in fakeData.
        expect(data.length).to.equal(21);
        _.each(data, function(datum) {
          expect(datum.date.isValid()).to.be.true;
        });
        done();
      });
      $httpBackend.flush();
    });
    it('should correctly parse valid values', function(done) {
      var fakeData = [
        {"date_trunc":"2014-05-27T00:00:00.000","value":"1508"},
        {"date_trunc":"2014-05-09T00:00:00.000","value":"238"},
        {"date_trunc":"2014-05-07T00:00:00.000","value":"624"},
        {"date_trunc":"2014-05-13T00:00:00.000","value":"718"}
      ];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      response.then(function(data) {
        var sum = _.reduce(data, function(acc, datum) {
          return acc + datum.value;
        }, 0);
        expect(sum).to.equal(1508 + 238 + 624 + 718);
        var values = _.compact(_.pluck(data, 'value'));
        expect(values).to.deep.equal([624, 238, 718, 1508]); // Note their order from old-new.
        done();
      });
      $httpBackend.flush();
    });
    it('should reject the promise on bad dates', function(done) {
      var fakeData = [
        {"date_trunc":"2014-05-27T00:00:00.000","value":"1508"},
        {"date_trunc":"2014-05-09T00:00:00.000","value":"238"},
        {"date_trunc":"pants","value":"624"},
        {"date_trunc":"2014-05-13T00:00:00.000","value":"718"}
      ];
      fakeDataRequestHandler.respond(fakeData);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY'), done);
      $httpBackend.flush();
    });
    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY'), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY'), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY'), done);
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty string response', function(done) {
      var fakeData = '';
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should give an empty array when given an empty array response', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      response.then(function(d) {
        expect(d).to.deep.equal([]);
        done();
      });
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty object response', function(done) {
      var fakeData = {};
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY');
      assertReject(response, done);
      $httpBackend.flush();
    });
  });
  describe('getChoroplethAggregates', function() {
    it('should throw on bad parameters', function() {
      expect(function() { CardDataService.getChoroplethAggregates(); }).to.throw();
      expect(function() { CardDataService.getChoroplethAggregates({}); }).to.throw();
      expect(function() { CardDataService.getChoroplethAggregates('field'); }).to.throw();
      expect(function() { CardDataService.getChoroplethAggregates('field', 'dead-beef', {}); }).to.throw();
      expect(function() { CardDataService.getChoroplethAggregates('field', {}); }).to.throw();
    });

    it('should access the correct dataset', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4);
      response.then(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should generate a correct query', function() {
      $httpBackend.expectGET('/api/id/{1}.json?$query=select {0} as name, count(*) as value  group by {0} order by count(*) desc'.format('afakeNumberColumn', fake4x4));
      $httpBackend.expectGET('/api/id/{1}.json?$query=select {0} as name, count(*) as value where MAGICAL_WHERE_CLAUSE group by {0} order by count(*) desc'.format('afakeNumberColumn', fake4x4));
      CardDataService.getChoroplethAggregates('afakeNumberColumn', fake4x4);
      CardDataService.getChoroplethAggregates('afakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE');
      $httpBackend.flush();
    });

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4), done);
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty string response', function(done) {
      var fakeData = '';
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should return an empty result when given an empty array response', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4);
      response.then(function(d) {
        expect(d).to.deep.equal([]);
        done();
      });
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty object response', function(done) {
      var fakeData = {};
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4);
      assertReject(response, done);
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
      var response = CardDataService.getChoroplethAggregates('fakeNumberColumn', fake4x4);
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
  });
});
