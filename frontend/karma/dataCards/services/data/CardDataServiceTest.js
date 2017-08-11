import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');
const moment = require('moment');

describe('CardDataService', function() {
  'use strict';

  var $httpBackend;
  var $q;
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
      return _.reduce(item, function(result, value, key) {
        result[SoqlHelpers.getFieldNameAlias(key)] = value;
        return result;
      }, {});
    });
  }

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('test'));

  function normalizeUrl(url) {
    return url.replace(/\s/g, '+').toLowerCase();
  }

  beforeEach(inject(function($injector) {
    CardDataService = $injector.get('CardDataService');
    ConstantsService = $injector.get('Constants');
    ServerConfig = $injector.get('ServerConfig');
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
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

    it('should access the correct dataset with the correct query using default limit', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=select\+`fakeNumberColumn`\+as\+\w+,\+count\(\*\)\+as\+\w+\+\+group\+by\+`fakeNumberColumn`\+order\+by\+count\(\*\)\+desc\+\+limit\+200/i
      );
      http.get.restore();
    });

    it('should access the correct dataset with the correct query using a custom limit', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation, {limit: 5432});
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=select\+`fakeNumberColumn`\+as\+\w+,\+count\(\*\)\+as\+\w+\+\+group\+by\+`fakeNumberColumn`\+order\+by\+count\(\*\)\+desc\+\+limit\+5432/i
      );
      http.get.restore();
    });

    it('should access the correct dataset with the correct query using a null value order', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation, {nullLast: true});
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=select\+`fakeNumberColumn`\+as\+\w+,\+count\(\*\)\+as\+\w+\+\+group\+by\+`fakeNumberColumn`\+order\+by\+count\(\*\)\+desc\+null\+last\+limit\+200/i
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

    it('should order by the aggregated value descending if the orderBy option is absent', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' });
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /order\+by\+sum\(`fakeNumberColumn`\)\+desc/i
      );
      http.get.restore();
    });

    it('should order by the specified column when the orderBy option is present', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' }, { orderBy: 'height desc' });
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /order\+by\+height\+desc/i
      );
      http.get.restore();
    });

    it('should not create a circular alias when fieldName is name', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('name', fake4x4, null, countAggregation);
      $httpBackend.flush();
      var request = decodeURIComponent(httpSpy.firstCall.args[0]);
      expect(request).to.not.match(/select\+`name`\+as\+name/i);
      expect(request).to.not.match(/select\+`name`\+as\+`name`/i);
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

      CardDataService.getData('fakeNumberColumn', fake4x4, null, sumValueAggregation);
      $httpBackend.flush();
      var request = decodeURIComponent(httpSpy.firstCall.args[0]);
      expect(request).to.not.match(/sum(`value`)\+as\+value/i);
      expect(request).to.not.match(/sum(`value`)\+as\+`value`/i);
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
        {name: 'undef', value: undefined},
        {name: 'nan', value: NaN}
      ]);

      fakeDataRequestHandler.respond(fakeData);
      var dataPromise = CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      dataPromise.then(function(response) {
        expect(response.data).to.deep.equal([
          {name: 'alreadyInt', value: 3},
          {name: 'alreadyFloat', value: 3.14},
          {name: 'goodNumberString', value: 123},
          {name: 'badNumberString', value: NaN},
          {name: 'null', value: NaN},
          {name: 'undef', value: NaN},
          {name: 'nan', value: NaN}
        ]);
        done();
      });
      $httpBackend.flush();
    });

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
      http.get.restore();
    });
  });

  describe('getMagnitudeData', function() {
    it('should throw on bad parameters', function() {
      expect(function() {
        CardDataService.getMagnitudeData();
      }).to.throw();
      expect(function() {
        CardDataService.getMagnitudeData({});
      }).to.throw();
      expect(function() {
        CardDataService.getMagnitudeData('field');
      }).to.throw();
      expect(function() {
        CardDataService.getMagnitudeData('field', 'dead-beef', null, {});
      }).to.throw();
    });

    it('should request the correct url', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=select\+signed_magnitude_10\(`fakeNumberColumn`\)\+as\+\w+,\+count\(\*\)\+as\+\w+\++\+group\+by\+\w+\+order\+by\+\w+\+limit\+200/i
      );
      http.get.restore();
    });

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, null, countAggregation);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
      http.get.restore();
    });

    it('should pass through the where clause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', countAggregation);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /where\+MAGICAL_WHERE_CLAUSE/i
      );
      http.get.restore();
    });

    it('should pass through the aggregation options', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' });
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /sum\(`fakeNumberColumn`\)\+as\+\w+.+where\+MAGICAL_WHERE_CLAUSE/i
      );
      http.get.restore();
    });

    it('should not create a circular alias when fieldName is magnitude', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getMagnitudeData('magnitude', fake4x4, null, countAggregation);
      $httpBackend.flush();
      var request = decodeURIComponent(httpSpy.firstCall.args[0]);
      expect(request).to.not.match(/select\+signed_magnitude_10\(`magnitude`\)\+as\+magnitude/i);
      expect(request).to.not.match(/select\+signed_magnitude_10\(`magnitude`\)\+as\+`magnitude`/i);
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

      CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, null, sumValueAggregation);
      $httpBackend.flush();
      var request = decodeURIComponent(httpSpy.firstCall.args[0]);
      expect(request).to.not.match(/sum(`value`)\+as\+value/i);
      expect(request).to.not.match(/sum(`value`)\+as\+`value`/i);
      http.get.restore();
    });

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, null, countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, null, countAggregation), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getMagnitudeData('fakeNumberColumn', fake4x4, null, countAggregation), done);
      $httpBackend.flush();
    });
  });

  describe('getBucketedData', function() {
    var defaultOptions;

    beforeEach(function() {
      defaultOptions = {bucketSize: 10};
    });

    it('should throw on bad parameters', function() {
      expect(function() {
        CardDataService.getBucketedData();
      }).to.throw();
      expect(function() {
        CardDataService.getBucketedData({});
      }).to.throw();
      expect(function() {
        CardDataService.getBucketedData('field');
      }).to.throw();
      expect(function() {
        CardDataService.getBucketedData('field', 'dead-beef', null, {});
      }).to.throw();
      expect(function() {
        CardDataService.getBucketedData('field', 'dead-beef', null, {}, {color: 'purple'});
      }).to.throw();
    });

    it('should request the correct url', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getBucketedData('fakeNumberColumn', fake4x4, null, countAggregation, defaultOptions);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$query=select\+signed_magnitude_linear\(`fakeNumberColumn`\,\+\d+\)\+as\+\w+,\+count\(\*\)\+as\+\w+\++\+group\+by\+\w+\+order\+by\+\w+/i
      );
      http.get.restore();
    });

    it('should pass through the where clause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getBucketedData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', countAggregation, defaultOptions);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /where\+MAGICAL_WHERE_CLAUSE/i
      );
      http.get.restore();
    });

    it('should pass through the aggregation options', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getBucketedData('fakeNumberColumn', fake4x4, 'MAGICAL_WHERE_CLAUSE', { 'function': 'sum', 'column': {}, 'fieldName': 'fakeNumberColumn' }, defaultOptions);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /sum\(`fakeNumberColumn`\)\+as\+\w+.+where\+MAGICAL_WHERE_CLAUSE/i
      );
      http.get.restore();
    });

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getBucketedData('magnitude', fake4x4, null, countAggregation, defaultOptions);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
      http.get.restore();
    });

    it('should not create a circular alias when fieldName is magnitude', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getBucketedData('magnitude', fake4x4, null, countAggregation, defaultOptions);
      $httpBackend.flush();
      var request = decodeURIComponent(httpSpy.firstCall.args[0]);
      expect(request).to.not.match(/select\+signed_magnitude_linear\(`magnitude`\)\+as\+magnitude/i);
      expect(request).to.not.match(/select\+signed_magnitude_linear\(`magnitude`\,\+\d+\)\+as\+`magnitude`/i);
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

      CardDataService.getBucketedData('fakeNumberColumn', fake4x4, null, sumValueAggregation, defaultOptions);
      $httpBackend.flush();
      var request = decodeURIComponent(httpSpy.firstCall.args[0]);
      expect(request).to.not.match(/sum(`value`)\+as\+value/i);
      expect(request).to.not.match(/sum(`value`)\+as\+`value`/i);
      http.get.restore();
    });

    it('should reject the promise on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      assertReject(CardDataService.getBucketedData('fakeNumberColumn', fake4x4, null, countAggregation, defaultOptions), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      assertReject(CardDataService.getBucketedData('fakeNumberColumn', fake4x4, null, countAggregation, defaultOptions), done);
      $httpBackend.flush();
    });

    it('should reject the promise on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      assertReject(CardDataService.getBucketedData('fakeNumberColumn', fake4x4, null, countAggregation, defaultOptions), done);
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

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineDomain('fakeNumberColumn', fake4x4);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
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
        assert.isTrue(moment.isMoment(data.start));
        assert.isTrue(moment.isMoment(data.end));
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

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
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
      var promise = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      promise.then(function(response) {
        // 21 is the number of date buckets we expect the call to generate`based on the dates in fakeData.
        expect(response.data.length).to.equal(21);
        _.each(response.data, function(datum) {
          assert.isTrue(datum.date.isValid());
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
      var promise = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      promise.then(function(response) {
        var sum = _.reduce(response.data, function(acc, datum) {
          return acc + datum.value;
        }, 0);
        expect(sum).to.equal(1508 + 238 + 624 + 718);
        var values = _.compact(_.map(response.data, 'value'));
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
      var promise = CardDataService.getTimelineData('fakeNumberColumn', fake4x4, '', 'DAY', countAggregation);
      promise.then(function(response) {
        var values = _.map(response.data, 'value');
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

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getRowCount(fake4x4);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
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

  describe('getRows', function() {
    it('should request the correct url, with all query elements arranged in the correct order', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      var offset = 0;
      var limit = 5;
      var order = 'ASCENDING';
      var timeout = $q.defer();
      var whereClause = 'score=5.0';
      CardDataService.getRows(fake4x4, offset, limit, order, timeout, whereClause);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$offset=0&\$limit=5&\$order=ASCENDING&\$where=score=5.0/i
      );
      http.get.restore();
    });

    it('should return data from a given dataset', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getRows(fake4x4);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\/api\/id\/fake-data\.json\?\$/i
      );
      http.get.restore();
    });

    it('should return rows offset by the given amount', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      var offset = 3;
      CardDataService.getRows(fake4x4, offset);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\$offset=3/i
      );
      http.get.restore();
    });

    it('should return the limit number of rows queried for', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      var offset = 0;
      var limit = 5;
      CardDataService.getRows(fake4x4, offset, limit);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\$limit=5/i
      );
      http.get.restore();
    });

    it('should order the returned row queries based on the given ordering convention', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      var offset = 0;
      var limit = 5;
      var order = 'ASCENDING';
      CardDataService.getRows(fake4x4, offset, limit, order);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\$order=ASCENDING/i
      );
      http.get.restore();
    });

    // In the case that the request times out, the http request will reject the promise in getRows().
    // getRows() will return null upon reject, as tested in the case of a
    // 404, 500, or 503 (see below)

    it('should correctly select rows based on the supplied whereClause', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      var offset = 0;
      var limit = 5;
      var order = 'ASCENDING';
      var timeout = $q.defer();
      var whereClause = 'score=5.0';
      CardDataService.getRows(fake4x4, offset, limit, order, timeout, whereClause);
      $httpBackend.flush();
      expect(decodeURIComponent(httpSpy.firstCall.args[0])).to.match(
        /\$where=score=5.0/i
      );
      http.get.restore();
    });

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      $httpBackend.whenGET(/.*/);
      var httpSpy = sinon.spy(http, 'get');
      CardDataService.getRows(fake4x4);
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
      http.get.restore();
    });

    it('should return null on 404', function(done) {
      fakeDataRequestHandler.respond(404, []);
      var offset = 0;
      var limit = 5;
      var order = 'ASCENDING';
      var timeout = $q.defer();
      var whereClause = 'score=5.0';
      var response = CardDataService.getRows(fake4x4, offset, limit, order, timeout, whereClause);
      response.then(function(data) {
        assert.isNull(data);
        done();
      });
      $httpBackend.flush();
    });

    it('should return null on 500', function(done) {
      fakeDataRequestHandler.respond(500, []);
      var offset = 0;
      var limit = 5;
      var order = 'ASCENDING';
      var timeout = $q.defer();
      var whereClause = 'score=5.0';
      var response = CardDataService.getRows(fake4x4, offset, limit, order, timeout, whereClause);
      response.then(function(data) {
        assert.isNull(data);
        done();
      });
      $httpBackend.flush();
    });

    it('should return null on 503', function(done) {
      fakeDataRequestHandler.respond(503, []);
      var offset = 0;
      var limit = 5;
      var order = 'ASCENDING';
      var timeout = $q.defer();
      var whereClause = 'score=5.0';
      var response = CardDataService.getRows(fake4x4, offset, limit, order, timeout, whereClause);
      response.then(function(data) {
        assert.isNull(data);
        done();
      });
      $httpBackend.flush();
    });
  });

  describe('#getDefaultFeatureExtent', function() {
    it('should return undefined if no feature flag value is present', function() {
      assert.isUndefined(CardDataService.getDefaultFeatureExtent());
    });

    it('should return undefined for an incorrectly formatted feature flag value', function() {
      ServerConfig.override('feature_map_default_extent', '{"southwest":[41.87537684702812,-87.6587963104248]}');
      assert.isUndefined(CardDataService.getDefaultFeatureExtent());
    });

    it('should return a feature extent object for a correctly formatted feature flag value', function() {
      var expectedValue = {
        "southwest":[41.87537684702812,-87.6587963104248],
        "northeast":[41.89026600256849,-87.5951099395752]
      };
      ServerConfig.override('feature_map_default_extent', JSON.stringify(expectedValue));
      expect(CardDataService.getDefaultFeatureExtent()).to.eql(expectedValue);
    });

    it('should not throw on improperly formatted JSON', function() {
      ServerConfig.override('feature_map_default_extent', '{"southwest":[41.87537684702812,-87.6587963104248]');
      expect(function() {
        var returnValue = CardDataService.getDefaultFeatureExtent();
        assert.isUndefined(returnValue);
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
      var TEST_RESPONSE = require('karma/dataCards/test-data/cardDataServiceTest/extentData.json');
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

    it('should resolve with undefined for an empty extent', function(done) {
      getExpectation.respond('[{}]');
      featureExtentPromise.
        then(function(value) {
          assert.isUndefined(value);
          done();
        }, function() {
          throw new Error('Should not be rejected');
        });
      $httpBackend.flush();
    });

    it('should resolve with an incorrectly formatted extent', function(done) {
      getExpectation.respond('BET YOU WERENT EXPECTING THIS');
      featureExtentPromise.
        then(function(value) {
          done();
        }, function() {
          throw new Error('Should not be rejected');
        });
      $httpBackend.flush();
    });
  });

  describe('getChoroplethRegionsUsingSourceColumn', function() {
    it('uses the extent to fetch regions by default', function() {
      var TEST_RESPONSE = require('karma/dataCards/test-data/cardDataServiceTest/extentData.json');
      var TEST_FIELD_NAME = 'location';
      var fake4x4 = 'four-four';
      var urlMatcher = new RegExp(
        '/resource/{1}\\.json\\?%24select=extent(\\(|%28){0}(\\)|%29)'.
          format(TEST_FIELD_NAME, fake4x4)
      );
      $httpBackend.expectGET(urlMatcher).respond(TEST_RESPONSE);
      $httpBackend.expectGET(/where=intersects/).respond([]);
      CardDataService.getChoroplethRegionsUsingSourceColumn('four-four', 'location', 'shap-file');
      $httpBackend.flush();
    });

    it('should add the read_from_nbe flag to support OBE derived views', function() {
      var TEST_RESPONSE = require('karma/dataCards/test-data/cardDataServiceTest/extentData.json');
      $httpBackend.whenGET(/.*/).respond(TEST_RESPONSE);
      var httpSpy = sinon.spy(http, 'get');

      CardDataService.getChoroplethRegionsUsingSourceColumn('four-four', 'location', 'shap-file');
      $httpBackend.flush();
      var url = decodeURIComponent(httpSpy.firstCall.args[0]);

      expect(url).to.match(/read_from_nbe=true/i);
      expect(url).to.match(/version=2.1/i);
      http.get.restore();
    });

    describe('when a custom polygon is set', function() {
      beforeEach(function() {
        ServerConfig.override('choroplethCustomBoundary', 'asdf');
      });

      it('uses the custom polygon to fetch regions use_data_lens_choropleth_custom_boundary is true', function() {
        ServerConfig.override('use_data_lens_choropleth_custom_boundary', true);
        $httpBackend.expectGET(/where=within_polygon%28the_geom%2C%27asdf%27%29/).respond([]);
        CardDataService.getChoroplethRegionsUsingSourceColumn('four-four', 'location', 'shap-file');
        $httpBackend.flush();
        ServerConfig.override('dataLensChoroplethCustomBoundary', null);
      });

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
      var TEST_RESPONSE = require('karma/dataCards/test-data/cardDataServiceTest/sampleData.json');

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
          assert.deepEqual(data, []);
          done();
        },
        function() {
          throw new Error('Should not fail');
        }
      );
      $httpBackend.flush();

    });
  });

  describe('getChoroplethRegionMetadata', function() {
    var shapefileId = 'shap-file';
    var defaultValue = {
      geometryLabel: null,
      featurePk: '_feature_id'
    };

    var curatedRegionMetadata = {
      geometryLabel: 'newColumn',
      featurePk: 'newId'
    };

    var shapefileDatasetMetadata = {
      geometryLabel: 'legacyColumn',
      featurePk: 'legacyId'
    };

    describe('CuratedRegionMetadata', function() {

      it('should request data from the appropriate URL', function() {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(curatedRegionMetadata);
        CardDataService.getCuratedRegionMetadata(shapefileId);
        $httpBackend.flush();
      });

      it('should return a promise of the response data', function(done) {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(curatedRegionMetadata);
        CardDataService.getCuratedRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', curatedRegionMetadata.geometryLabel);
          expect(response).to.have.property('featurePk', curatedRegionMetadata.featurePk);
          done();
        });
        $httpBackend.flush();
      });

      it('should handle failure by returning a successful promise of null', function(done) {
        $httpBackend.whenGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(500, '');
        CardDataService.getCuratedRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.eq(null);
          done();
        });
        $httpBackend.flush();
      });

    });

    describe('getShapefileDatasetMetadata', function() {

      it('should request data from the appropriate URL', function() {
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(shapefileDatasetMetadata);
        CardDataService.getShapefileDatasetMetadata(shapefileId);
        $httpBackend.flush();
      });

      it('should return a promise of the response data', function(done) {
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(shapefileDatasetMetadata);
        CardDataService.getShapefileDatasetMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', shapefileDatasetMetadata.geometryLabel);
          expect(response).to.have.property('featurePk', shapefileDatasetMetadata.featurePk);
          done();
        });
        $httpBackend.flush();
      });

      it('should handle failure by returning a successful promise of null', function(done) {
        $httpBackend.whenGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(500, '');
        CardDataService.getShapefileDatasetMetadata(shapefileId).then(function(response) {
          expect(response).to.eq(null);
          done();
        });
        $httpBackend.flush();
      });
    });

    describe('getCuratedRegionMetadata', function() {
      it('should make requests for both new and legacy region metadata', function() {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(curatedRegionMetadata);
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(shapefileDatasetMetadata);
        CardDataService.getChoroplethRegionMetadata(shapefileId);
        $httpBackend.flush();
      });

      it('should return new curated region data if it exists', function(done) {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(curatedRegionMetadata);
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(shapefileDatasetMetadata);
        CardDataService.getChoroplethRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', curatedRegionMetadata.geometryLabel);
          expect(response).to.have.property('featurePk', curatedRegionMetadata.featurePk);
          done();
        });
        $httpBackend.flush();
      });

      it('should return legacy data if it is present and no curated region data is present', function(done) {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(500, '');
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(shapefileDatasetMetadata);
        CardDataService.getChoroplethRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', shapefileDatasetMetadata.geometryLabel);
          expect(response).to.have.property('featurePk', shapefileDatasetMetadata.featurePk);
          done();
        });
        $httpBackend.flush();
      });

      it('should return default data if neither curated region or legacy data is present', function(done) {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(500, '');
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(500, '');
        CardDataService.getChoroplethRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', defaultValue.geometryLabel);
          expect(response).to.have.property('featurePk', defaultValue.featurePk);
          done();
        });
        $httpBackend.flush();
      });

      it('should return curated region primary key and legacy label if curated region has no label', function(done) {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond({ featurePk: curatedRegionMetadata.featurePk });
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond(shapefileDatasetMetadata);
        CardDataService.getChoroplethRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', shapefileDatasetMetadata.geometryLabel);
          expect(response).to.have.property('featurePk', curatedRegionMetadata.featurePk);
          done();
        });
        $httpBackend.flush();
      });

      it('should return legacy label and default primary key if no curated region or legacy primary key', function(done) {
        $httpBackend.expectGET(/api\/curated_regions\?method=getByViewUid&viewUid=shap-file$/).respond(500, '');
        $httpBackend.expectGET(/metadata\/v1\/dataset\/shap-file\.json$/).respond({ geometryLabel: shapefileDatasetMetadata.geometryLabel });
        CardDataService.getChoroplethRegionMetadata(shapefileId).then(function(response) {
          expect(response).to.have.property('geometryLabel', shapefileDatasetMetadata.geometryLabel);
          expect(response).to.have.property('featurePk', defaultValue.featurePk);
          done();
        });
        $httpBackend.flush();
      });

    });

  });

});
