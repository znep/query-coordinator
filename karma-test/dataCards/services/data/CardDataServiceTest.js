describe('CardDataService', function() {
  'use strict';

  var $httpBackend;
  var http;
  var CardDataService;
  var ConstantsService;
  var ServerConfig;
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

  function addFieldNameAliases(data) {
    return _.map(data, function(item) {
      var result = {};
      _.each(item, function(value, key) {
        result[SoqlHelpers.getFieldNameAlias(key)] = value;
      });
      return result;
    });
  }

  beforeEach(function () {
    module('dataCards');
    module('karma-test/dataCards/test-data/cardDataServiceTest/sampleData.json');
    module('karma-test/dataCards/test-data/cardDataServiceTest/extentData.json');
  });
  function normalizeUrl(url) {
    return url.replace(/\s/g, '+').toLowerCase();
  }

  beforeEach(inject(function($injector) {
    CardDataService = $injector.get('CardDataService');
    ConstantsService = $injector.get('Constants');
    ServerConfig = $injector.get('ServerConfig');
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
    $httpBackend.verifyNoOutstandingExpectation(false);
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

    it('should access the correct dataset with the correct query', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=select\+`fakeNumberColumn`\+as\+\w+,\+count\(\*\)\+as\+\w+\++group\+by\+`fakeNumberColumn`\+order\+by\+count\(\*\)\+desc\+limit\+200/i
      );
      http.get.restore();
    });

    it('should pass through the where clause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /where\+MAGICAL_WHERE_CLAUSE/i
      );
      http.get.restore();
    });

    it('should not pass through the where clause when it is null', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).not.to.match(
        /where/i
      );
      http.get.restore();
    });

    it('should pass through the aggregation options', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' });
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /sum\(`fakeNumberColumn`\)\+as\+\w+.+where\+MAGICAL_WHERE_CLAUSE.+group\+by\+`fakeNumberColumn`\+order\+by\+sum\(`fakeNumberColumn`\)/i
      );
      http.get.restore();
    });

    it('should pass through the aggregation options when where clause is null', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' });
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /sum\(`fakeNumberColumn`\)\+as\+\w+.+group\+by\+`fakeNumberColumn`\+order\+by\+sum\(`fakeNumberColumn`\)/i
      );
      http.get.restore();
    });

    it('should not create a circular alias when fieldName is name', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('name', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.not.match(/select\+`name`\+as\+name/i);
      http.get.restore();
    });

    it('should not create a circular alias when aggregation field is value', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');

      var sumValueAggregation = {
        'function': 'sum',
        'column': {},
        'fieldName': 'value',
        'unit': 'rowDisplayUnit'
      };

      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.not.match(/sum(`value`)\+as\+value/i);
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
      var fakeData = addFieldNameAliases([
        {name: 'alreadyInt', value: 3},
        {name: 'alreadyFloat', value: 3.14},
        {name: 'goodNumberString', value: '123'},
        {name: 'badNumberString', value: 'asd'},
        {name: 'null', value: null},
        {name: 'undef', value: undefined}
      ]);

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

    it('should access the correct dataset', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json/i
      );
      http.get.restore();
    });

    it('should generate a correct query', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=SELECT\+min\(`fakeNumberColumn`\)\+AS\+\w+,\+max\(`fakeNumberColumn`\)\+AS\+\w+\+WHERE\+`fakeNumberColumn`\+<\+'\d{4}-\d{2}-\d{2}'/i
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
      var fakeData = addFieldNameAliases([{
        start: '1988-01-10T08:00:00.000Z',
        end: '2101-01-10T08:00:00.000Z'
      }]);

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
      var fakeDataInvalidMin = addFieldNameAliases([{
        start: '01101988',
        end: '2101-01-10T08:00:00.000Z'
      }]);
      fakeDataRequestHandler.respond(fakeDataInvalidMin);
      var response = CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4).
        then(function(response) {
          expect(response.start).to.equal(null);
          done();
        });
      $httpBackend.flush();
    });

    it('should return null value for endDate when bad end date is given', function(done) {
      var fakeDataInvalidMax = addFieldNameAliases([{
        start: '1988-01-10T08:00:00.000Z',
        end: 'trousers'
      }]);
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

    it('should access the correct dataset', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=SELECT\+date_trunc_ymd\(`fakeNumberColumn`\)\+AS\+\w+,\+count\(\*\)\+AS\+\w+\+WHERE\+`fakeNumberColumn`\+IS\+NOT\+NULL\+AND\+`fakeNumberColumn`\+<\+'\d{4}-\d{2}-\d{2}'\+GROUP\+BY\+\w+/i
      );
      http.get.restore();
    });

    it('should pass through the where clause fragment', function() {

      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', 'DAY', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /where\+`fakenumbercolumn`\+is\+not\+null\+and\+`fakenumbercolumn`\+<\+'\d{4}-\d{2}-\d{2}'\+and\+magical_where_clause/i
      );
      http.get.restore();
    });

    it('should pass through the where clause fragment when it is empty', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /where\+`fakenumbercolumn`\+is\+not\+null\+and\+`fakenumbercolumn`\+<\+'\d{4}-\d{2}-\d{2}'/i
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
      var fakeData = addFieldNameAliases([
        {"truncated_date":"2014-05-27T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-09T00:00:00.000","value":"238"},
        {"truncated_date":"2014-05-07T00:00:00.000","value":"624"},
        {"truncated_date":"2014-05-13T00:00:00.000","value":"718"}
      ]);
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
      var fakeData = addFieldNameAliases([
        {"truncated_date":"2014-05-27T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-09T00:00:00.000","value":"238"},
        {"truncated_date":"2014-05-07T00:00:00.000","value":"624"},
        {"truncated_date":"2014-05-13T00:00:00.000","value":"718"}
      ]);
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

    it('should default to null if no value is returned', function(done) {
      var fakeData = addFieldNameAliases([
        {"truncated_date":"2014-05-01T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-02T00:00:00.000"},
        {"truncated_date":"2014-05-03T00:00:00.000","value":"624"},
        {"truncated_date":"2014-05-04T00:00:00.000","value":"718"}
      ]);
      fakeDataRequestHandler.respond(fakeData);
      var response = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      response.then(function(data) {
        var values = _.pluck(data, 'value');
        expect(values).to.deep.equal([1508, null, 624, 718]);
        done();
      });
      $httpBackend.flush();
    });

    it('should reject the promise on bad dates', function(done) {
      var fakeData = addFieldNameAliases([
        {"truncated_date":"2014-05-27T00:00:00.000","value":"1508"},
        {"truncated_date":"2014-05-09T00:00:00.000","value":"238"},
        {"truncated_date":"pants","value":"624"},
        {"truncated_date":"2014-05-13T00:00:00.000","value":"718"}
      ]);
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
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data.json\?\$query=select\+count\(0\)/i
      );
      http.get.restore();
    });

    it('should accept a where clause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getRowCount(fake4x4, 'stuff');
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /where\+stuff/i
      );
      http.get.restore();
    });

    it('return 0 if the response has no data', function(done) {
      fakeDataRequestHandler.respond({});
      CardDataService.getRowCount(fake4x4).then(function(actual) {
        expect(actual).to.equal(0);
        done();
      });
      $httpBackend.flush();
    });

    it('returns a promise that provides the count returned by the server', function(done) {
      fakeDataRequestHandler.respond([{count_0: 5}]);
      CardDataService.getRowCount(fake4x4).then(function(actual) {
        expect(actual).to.equal(5);
        done();
      });

      $httpBackend.flush();
    });

    it('returns 0 if the server responds with an empty result.', function(done) {
      $httpBackend.whenGET(/.*/).
        respond([{}]);

      CardDataService.getRowCount(fake4x4).then(function(actual) {
        expect(actual).to.equal(0);
        done();
      });

      $httpBackend.flush();
    });
  });

  describe('#getDefaultFeatureExtent', function() {
    it('should return undefined if no feature flag value is present', function() {
      expect(CardDataService.getDefaultFeatureExtent()).to.be.undefined;
    });

    it('should return undefined for an incorrectly formatted feature flag value', function() {
      ServerConfig.override('featureMapDefaultExtent', '{"southwest":[41.87537684702812,-87.6587963104248]}');
      expect(CardDataService.getDefaultFeatureExtent()).to.be.undefined;
    });

    it('should return a feature extent object for a correctly formatted feature flag value', function() {
      var expectedValue = {
        "southwest":[41.87537684702812,-87.6587963104248],
        "northeast":[41.89026600256849,-87.5951099395752]
      };
      ServerConfig.override('featureMapDefaultExtent', JSON.stringify(expectedValue));
      expect(CardDataService.getDefaultFeatureExtent()).to.eql(expectedValue);
    });

    it('should not throw on improperly formatted JSON', function() {
      ServerConfig.override('featureMapDefaultExtent', '{"southwest":[41.87537684702812,-87.6587963104248]');
      expect(function() {
        var returnValue = CardDataService.getDefaultFeatureExtent();
        expect(returnValue).to.be.undefined;
      }).to.not.throw();
    });
  });

  describe('#getFeatureExtent', function() {
    var TEST_FIELD_NAME = 'coordinates_9';
    var getExpectation;
    var featureExtentPromise;

    beforeEach(function() {
      var urlMatcher = new RegExp(
        '/resource/{1}\\.json\\?%24select=extent(\\(|%28){0}(\\)|%29)'.
          format(TEST_FIELD_NAME, fake4x4)
      );
      getExpectation = $httpBackend.expectGET(urlMatcher);
      featureExtentPromise = CardDataService.
        getFeatureExtent(TEST_FIELD_NAME, fake4x4);
    });

    it('should make an appropriate API request', function(done) {
      getExpectation.respond('');
      featureExtentPromise.finally(done);
      $httpBackend.flush();
    });

    it('should resolve for a correctly formatted extent', function(done) {
      var TEST_RESPONSE = testHelpers.getTestJson('karma-test/dataCards/test-data/cardDataServiceTest/extentData.json');
      getExpectation.respond(TEST_RESPONSE);
      featureExtentPromise.
        then(function(value) {
          expect(value).to.eql({
            southwest: [41.681944, -87.827778],
            northeast: [42.081944, -87.427778]
          });
          done();
        }, function() {
          throw new Error('Should not be rejected');
        });
      $httpBackend.flush();
    });

    it('should resolve for an incorrectly formatted extent', function(done) {
      getExpectation.respond('[{}]');
      featureExtentPromise.
        then(function() {
          done();
        }, function() {
          throw new Error('Should not be rejected');
        });
      $httpBackend.flush();
    });

  });

  describe('getSampleData', function() {
    var TEST_FIELD_NAME = 'my test field';
    it('should format the request correctly', function() {
      $httpBackend.whenGET(/.*/).respond('');
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getSampleData(TEST_FIELD_NAME, fake4x4);
      $httpBackend.flush();
      var expected = new RegExp('/views/{0}/columns/{1}/suggest\\?size=2$'.format(fake4x4, TEST_FIELD_NAME));
      expect(decodeURIComponent(httpSpy.firstCall.args[0]).toLowerCase()).to.match(expected);
      http.get.restore();
    });

    it('should get the sample data', function(done) {
      var TEST_RESPONSE = testHelpers.getTestJson('karma-test/dataCards/test-data/cardDataServiceTest/sampleData.json');

      $httpBackend.whenGET(/.*/).respond(TEST_RESPONSE);

      var samplePromise = CardDataService.getSampleData(TEST_FIELD_NAME, fake4x4);
      samplePromise.then(
        function(data) {
          expect(data).to.have.length(10);
          expect(_.first(data)).to.eql('Zanzibar Leopard');
          expect(_.last(data)).to.eql('Kingstie');
          done();
        },
        function() {
          throw new Error('Should not fail');
        }
      );
      $httpBackend.flush();
    });

    it('should return empty results for a failed response', function(done) {
      $httpBackend.whenGET(/.*/).respond(500, '');

      var samplePromise = CardDataService.getSampleData(TEST_FIELD_NAME, fake4x4);
      samplePromise.then(
        function(data) {
          expect(data).to.be.an('array').and.to.be.empty;
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
