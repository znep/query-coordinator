describe('CardDataService', function() {
  'use strict';

  var $httpBackend;
  var http;
  var CardDataService;
  var ConstantsService;
  var fakeDataRequestHandler;
  var testHelpers;
  var SoqlHelpers;

  var fake4x4 = 'fake-data';

  var countAggregation = {
    'function': 'count',
    'column': null,
    'unit': 'rowDisplayUnit'
  };

  function assertReject(response, done) {
    response.then(function(data) {
      throw new Error('Should not resolve promise');
    }, function(error) {
      done();
    });
  }

  beforeEach(function () {
    module('dataCards');
    module('karma-test/dataCards/test-data/cardDataServiceTest/sampleData.json');
  });
  function normalizeUrl(url) {
    return url.replace(/\s/g, '+').toLowerCase();
  }

  beforeEach(inject(function($injector) {
    CardDataService = $injector.get('CardDataService');
    ConstantsService = $injector.get('Constants');
    $httpBackend = $injector.get('$httpBackend');
    testHelpers = $injector.get('testHelpers');
    SoqlHelpers = $injector.get('SoqlHelpers');
    http = $injector.get('http');
    fakeDataRequestHandler = $httpBackend.whenGET(new RegExp('/api/id/{0}\\.json\\?'.format(fake4x4)));
    fakeDataRequestHandler.respond([
      {name: 'fakeNumberColumn', value: 3}
    ]);
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getData', function() {
    it('should throw on bad parameters', function() {
      expect(function() {
        CardDataService.getData();
      }).to.throw();
      expect(function() {
        CardDataService.getData({});
      }).to.throw();
      expect(function() {
        CardDataService.getData('field');
      }).to.throw();
      expect(function() {
        CardDataService.getData('field', 'dead-beef', {});
      }).to.throw();
      expect(function() {
        CardDataService.getData('field', {});
      }).to.throw();
    });

    it('should access the correct dataset', function(done) {
      var response = CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      response.then(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should not alias a column whose name is "name"', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('name', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/fake-data.json?$query=select+`name`+as+name,+count(*)+as+value++group+by+`name`+order+by+count(*)+desc+limit+200')
      );
      http.get.restore();
    });

    it('should pass through the where clause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      CardDataService.getData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/{0}.json?$query=select `fakeNumberColumn` as name, count(*) as value  group by `fakeNumberColumn` order by count(*) desc limit 200'.format(fake4x4))
      );
      expect(decodeURIComponent(httpSpy.secondCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/{0}.json?$query=select `fakeNumberColumn` as name, count(*) as value where MAGICAL_WHERE_CLAUSE group by `fakeNumberColumn` order by count(*) desc limit 200'.format(fake4x4))
      );
      http.get.restore();
    });

    it('should pass through the aggregation options', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' });
      CardDataService.getData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' });
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/{0}.json?$query=select `fakeNumberColumn` as name, sum(`fakeNumberColumn`) as value  group by `fakeNumberColumn` order by sum(`fakeNumberColumn`) desc limit 200'.format(fake4x4))
      );
      expect(decodeURIComponent(httpSpy.secondCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/{0}.json?$query=select `fakeNumberColumn` as name, sum(`fakeNumberColumn`) as value where MAGICAL_WHERE_CLAUSE group by `fakeNumberColumn` order by sum(`fakeNumberColumn`) desc limit 200'.format(fake4x4))
      );
      http.get.restore();
    });

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation), done);
      $httpBackend.flush();
    });

    it('should parse the aggregation result as a number', function(done) {
      var fakeData = [
        {name: 'alreadyInt', value: 3},
        {name: 'alreadyFloat', value: 3.14},
        {name: 'goodNumberString', value: '123'},
        {name: 'badNumberString', value: 'asd'},
        {name: 'null', value: null},
        {name: 'undef', value: undefined}
      ];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      response.then(function(data) {
        expect(data).to.deep.equal([
          {name: 'alreadyInt', value: 3},
          {name: 'alreadyFloat', value: 3.14},
          {name: 'goodNumberString', value: 123},
          {name: 'badNumberString', value: NaN},
          {name: 'null', value: NaN},
          {name: 'undef', value: NaN}
        ]);
        done();
      });
      $httpBackend.flush();
    });

  });

  describe('getTimelineDomain', function() {
    it('should throw on bad parameters', function() {
      expect(function() {
        CardDataService.getTimelineDomain();
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineDomain({});
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineDomain('field');
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineDomain('field', {});
      }).to.throw();
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
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl("http://localhost:7019/api/id/{1}.json?$query=SELECT min({0}) AS start, max({0}) AS end WHERE {0} < '{2}'".format('`fakeNumberColumn`', fake4x4, ConstantsService['MAX_LEGAL_JAVASCRIPT_DATE_STRING']))
      );
      http.get.restore();
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

    it('should return undefined when the response is an empty object', function(done) {
      var fakeDataInvalidMin = [{}];
      fakeDataRequestHandler.respond(fakeDataInvalidMin);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4).
        then(function(response) {
          expect(response).to.equal(undefined);
          done();
        });
      $httpBackend.flush();
    });

    it('should return null value for startDate when bad start date is given', function(done) {
      var fakeDataInvalidMin = [{
        start: '01101988',
        end: '2101-01-10T08:00:00.000Z'
      }];
      fakeDataRequestHandler.respond(fakeDataInvalidMin);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4).
        then(function(response) {
          expect(response.start).to.equal(null);
          done();
        });
      $httpBackend.flush();
    });

    it('should return null value for endDate when bad end date is given', function(done) {
      var fakeDataInvalidMax = [{
        start: '1988-01-10T08:00:00.000Z',
        end: 'trousers'
      }];
      fakeDataRequestHandler.respond(fakeDataInvalidMax);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4).
        then(function(response) {
          expect(response.end).to.equal(null);
          done();
        });
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
      expect(function() {
        CardDataService.getTimelineData();
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData({});
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData('field');
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData('field', 'dead-beef', {});
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData('field', {});
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData('field', 'dead-beef', '', {});
      }).to.throw();
    });

    it('should access the correct dataset', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      response.then(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should pass through the where clause fragment', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', 'DAY', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/fake-data.json?$query=select+date_trunc_ymd(`fakenumbercolumn`)+as+truncated_date,+count(*)+as+value+where+fakenumbercolumn+is+not+null+and+fakenumbercolumn+<+\'9999-12-31\'+group+by+truncated_date')
      );
      expect(decodeURIComponent(httpSpy.secondCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/fake-data.json?$query=select+date_trunc_ymd(`fakenumbercolumn`)+as+truncated_date,+count(*)+as+value+where+fakenumbercolumn+is+not+null+and+fakenumbercolumn+<+\'9999-12-31\'+and+magical_where_clause+group+by+truncated_date')
      );
      http.get.restore();
    });

    it('should throw given an unsupported precision', function() {
      expect(function() {
        CardDataService.getTimelineData('field', 'dead-beef', '', '', countAggregation);
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData('field', 'dead-beef', '', 'day', countAggregation);
      }).to.throw(); // correct one is DAY
      expect(function() {
        CardDataService.getTimelineData('field', 'dead-beef', '', 'WEEK', countAggregation);
      }).to.throw();
      expect(function() {
        CardDataService.getTimelineData('field', 'dead-beef', '', 'FOO', countAggregation);
      }).to.throw();
    });

    it('should correctly choose the date truncation function', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'MONTH', countAggregation);
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'YEAR', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.match(
        /date_trunc_ymd\(`fakeNumberColumn`\)/i
      );
      expect(decodeURIComponent(httpSpy.secondCall.args[0]).toLowerCase()).to.match(
        /date_trunc_ym\(`fakeNumberColumn`\)/i
      );
      expect(decodeURIComponent(httpSpy.lastCall.args[0]).toLowerCase()).to.match(
        /date_trunc_y\(`fakeNumberColumn`\)/i
      );
      http.get.restore();
    });

    it('should correctly parse valid dates', function(done) {
      var fakeData = [
        {"truncated_date":"2014-05-27T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-09T00:00:00.000","value":"238"},
        {"truncated_date":"2014-05-07T00:00:00.000","value":"624"},
        {"truncated_date":"2014-05-13T00:00:00.000","value":"718"}
      ];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
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
        {"truncated_date":"2014-05-27T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-09T00:00:00.000","value":"238"},
        {"truncated_date":"2014-05-07T00:00:00.000","value":"624"},
        {"truncated_date":"2014-05-13T00:00:00.000","value":"718"}
      ];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
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
        {"truncated_date":"2014-05-27T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-09T00:00:00.000","value":"238"},
        {"truncated_date":"pants","value":"624"},
        {"truncated_date":"2014-05-13T00:00:00.000","value":"718"}
      ];
      fakeDataRequestHandler.respond(fakeData);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty string response', function(done) {
      var fakeData = '';
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should give an empty array when given an empty array response', function(done) {
      var fakeData = [];
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      response.then(function(d) {
        expect(d).to.deep.equal([]);
        done();
      });
      $httpBackend.flush();
    });

    it('should reject the promise when given an empty object response', function(done) {
      var fakeData = {};
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      assertReject(response, done);
      $httpBackend.flush();
    });

    it('should set dateTruncFunctionUsed on soqlMetadata', function(done) {
      var fakeData = [];
      var ourSoqlMetadata = { dateTruncFunctionUsed: null };
      var response = CardDataService.getTimelineData('fakeTimestampColumn', fake4x4, '', 'DAY', countAggregation, ourSoqlMetadata)

      fakeDataRequestHandler.respond(fakeData);
      response.then(function() {
        expect(ourSoqlMetadata.dateTruncFunctionUsed).to.equal('date_trunc_ymd');
        done();
      });
      $httpBackend.flush();
    });
  });

  describe('getRowCount', function() {
    it('should get the count from the specified dataset', function() {
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getRowCount(fake4x4);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/{0}.json?$query=select count(0)'.format(fake4x4))
      );
      http.get.restore();
    });

    it('should accept a where clause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getRowCount(fake4x4, 'stuff');
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(
        normalizeUrl('http://localhost:7019/api/id/{0}.json?$query=select count(0) where stuff'.format(fake4x4))
      );
      http.get.restore();
    });

    it('throws an error if the response has no data', function() {
      fakeDataRequestHandler.respond({});
      CardDataService.getRowCount(fake4x4);
      expect($httpBackend.flush).to.throw();
    });

    it('returns a promise that provides the count returned by the server', function() {
      fakeDataRequestHandler.respond([{count_0: 5}]);
      var count = -1;
      CardDataService.getRowCount(fake4x4).then(function(value) {
        count = value;
      });

      $httpBackend.flush();

      expect(count).to.equal(5);
    });

    it('returns 0 if the server responds with an empty result.', function() {
      $httpBackend.whenGET(/.*/).
        respond([{}]);

      var count = -1;
      CardDataService.getRowCount(fake4x4).then(function(value) {
        count = value;
      });

      $httpBackend.flush();

      expect(count).to.equal(0);
    });
  });

  describe('getSampleData', function() {
    var TEST_FIELD_NAME = 'my test field';
    it('should format the request correctly', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getSampleData(TEST_FIELD_NAME, fake4x4);
      $httpBackend.flush();
      var expected = normalizeUrl(
        'http://localhost:7019/api/id/{0}.json?$query=select {1} as name LIMIT 10'.format(fake4x4, SoqlHelpers.formatFieldName(TEST_FIELD_NAME))
      );
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.equal(expected);
      http.get.restore();
    });

    it('should get the sample data', function(done) {
      var TEST_RESPONSE = testHelpers.getTestJson('karma-test/dataCards/test-data/cardDataServiceTest/sampleData.json');

      fakeDataRequestHandler.respond(TEST_RESPONSE);

      var samplePromise = CardDataService.getSampleData(TEST_FIELD_NAME, fake4x4);
      samplePromise.then(
        function(data) {
          expect(data).to.have.length(10);
          expect(data).to.eql(TEST_RESPONSE);
          done();
        },
        function() {
          throw new Error('Should not fail');
        }
      );
      $httpBackend.flush();
    });
  });

});
