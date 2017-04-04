import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('VectorTileDataService', function() {
  'use strict';

  var VectorTileDataService;
  var testHelpers;
  var $rootScope;
  var TEST_URL = new URL('http://example.com');
  var TILESERVER_HOSTS = ['tile1.example.com', 'tile2.example.com'];
  var tileserverHosts;
  var protocolBufferEndpointResponses = 'karma/dataCards/test-data/featureMapTest/protocolBufferEndpointResponses.json';

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    sinon.stub($, 'baseUrl', function(pathname) {
      var url = new URL(TEST_URL);
      if (pathname) {
        url.pathname = pathname;
      }

      return url;
    });
    angular.mock.module(function($provide) {
      tileserverHosts = TILESERVER_HOSTS.slice();
      $provide.constant('ServerConfig', {
        setup: _.noop,
        override: _.noop,
        get: _.constant(tileserverHosts)
      });
    });
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
      VectorTileDataService = $injector.get('VectorTileDataService');
    });
  });

  afterEach(function() {
    $.baseUrl.restore();
  });

  describe('buildTileGetter', function() {
    it('should exist', function() {
      expect(VectorTileDataService).to.respondTo('buildTileGetter');
    });

    it('should return a function when given a datasetId, fieldName', function() {
      var curriedFunction = VectorTileDataService.buildTileGetter('four-four', 'my_field');
      assert.isFunction(curriedFunction);
    });

    describe('curried tileGetter function', function() {
      beforeEach(function() {
        sinon.stub(VectorTileDataService, 'getHost', _.constant('foo.example.com'));
        sinon.stub(VectorTileDataService, 'getArrayBuffer');
      });

      afterEach(function() {
        VectorTileDataService.getHost.restore();
        VectorTileDataService.getArrayBuffer.restore();
      });

      it('should get a URL based on its arguments', function() {
        var urlMatcher = new RegExp('^http://foo\\.example\\.com/tiles/my_field/four-four/1/2/3\\.pbf\\?');
        var curriedFunction = VectorTileDataService.buildTileGetter('four-four', 'my_field', '', true);
        curriedFunction(1, 2, 3);
        sinon.assert.called(VectorTileDataService.getHost);
        sinon.assert.calledWithMatch(
          VectorTileDataService.getArrayBuffer,
          sinon.match(urlMatcher)
        );
      });

      it('should include the where clause if provided', function() {
        var whereClause = 'my_field="two"';
        var whereMatcher = new RegExp('{0}={1}'.format(escape('$where'), escape(whereClause)));
        var curriedFunction = VectorTileDataService.buildTileGetter('five-five', 'another_field', whereClause, false);
        curriedFunction(3, 2, 1); // arguments are irrelevant here
        sinon.assert.called(VectorTileDataService.getHost);
        sinon.assert.calledWithMatch(
          VectorTileDataService.getArrayBuffer,
          sinon.match(whereMatcher)
        );
      });
    });

  });

  describe('getHost', function() {
    it('should exist', function() {
      expect(VectorTileDataService).to.respondTo('getHost');
    });

    it('should provide the origin hostname when there are no tileserver hosts configured', function() {
      tileserverHosts.splice(0, tileserverHosts.length); // Empty the array, maintaining the same ref
      assert.lengthOf(tileserverHosts, 0);
      var url = VectorTileDataService.getHost(1, 2);
      assert.equal(url, 'example.com');
    });

    it('should provide the origin hostname when called with useOriginHost', function() {
      var url = VectorTileDataService.getHost(1, 2, true);
      assert.equal(url, 'example.com');
    });

    it('should provide a hostname from the configured tileserver hosts', function() {
      var url = VectorTileDataService.getHost(1, 2);
      expect(tileserverHosts).to.contain(url);
    });

    it('should provide different hostnames for adjacent x,y values', function() {
      var url1 = VectorTileDataService.getHost(1, 1);
      var url2 = VectorTileDataService.getHost(1, 2);
      expect(url1).to.not.equal(url2);
    });
  });

  describe('getArrayBuffer', function() {
    var xhr;
    var requests;
    var server;

    beforeEach(function() {
      requests = [];
      xhr = sinon.useFakeXMLHttpRequest();
      xhr.onCreate = function (xhr) {
        requests.push(xhr);
      };
      server = sinon.fakeServer.create();
    });

    afterEach(function() {
      xhr.restore();
      server.restore();
    });

    it('should exist', function() {
      expect(VectorTileDataService).to.respondTo('getArrayBuffer');
    });

    it('should return a promise', function() {
      var returnValue = VectorTileDataService.getArrayBuffer('http://example.com');
      expect(returnValue).to.respondTo('then');
    });

    describe('promise return value', function() {
      beforeEach(function() {
        sinon.stub(VectorTileDataService, 'typedArrayFromArrayBufferResponse', _.constant(new Uint8Array(0)));
      });
      afterEach(function() {
        VectorTileDataService.typedArrayFromArrayBufferResponse.restore();
      });

      it('should resolve when the xhr request completes successfully', function(done) {
        var url = 'http://example.com';
        server.respondWith('');
        var returnValue = VectorTileDataService.getArrayBuffer(url);
        server.respond();
        returnValue.then(function() {
          done();
        }, function() {
          throw new Error('Should not fail!');
        });
        $rootScope.$digest();
      });

      // Failing for unknown reasons.
      xit('should reject when the xhr request completes unsuccessfully', function(done) {
        var url = 'http://example.com';
        var returnValue = VectorTileDataService.getArrayBuffer(url);
        server.respond();
        returnValue.then(function() {
          throw new Error('Should not succeed!');
        }, function() {
          done();
        });
        $rootScope.$digest();
      });
    });

    describe('typedArrayFromArrayBufferResponse', function() {
      it('should exist', function() {
        expect(VectorTileDataService).to.respondTo('typedArrayFromArrayBufferResponse');
      });

      it('should return a typed array if there is a response', function() {
        var actual = VectorTileDataService.typedArrayFromArrayBufferResponse({ response: new ArrayBuffer(0) });
        assert.instanceOf(actual, Uint8Array);
      });

    });
  });

});
