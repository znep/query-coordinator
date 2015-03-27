describe('VectorTileData service', function() {
  'use strict';

  var VectorTileData;
  var testHelpers;
  var $rootScope;
  var TEST_URL = new URL('http://example.com');
  var TILESERVER_HOSTS = ['tile1.example.com', 'tile2.example.com'];
  var tileserverHosts;
  var protocolBufferEndpointResponses = 'karma-test/dataCards/test-data/featureMapTest/protocolBufferEndpointResponses.json';

  beforeEach(function() {
    sinon.stub($, 'baseUrl', function(pathname) {
      var url = new URL(TEST_URL);
      if (pathname) {
        url.pathname = pathname;
      }

      return url;
    });
    module('socrataCommon.services');
    module(function($provide) {
      tileserverHosts = TILESERVER_HOSTS.slice();
      $provide.constant('ServerConfig', {
        setup: _.noop,
        override: _.noop,
        get: _.constant(tileserverHosts)
      });
    });
    module('test');
    module('dataCards.services');
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
      VectorTileData = $injector.get('VectorTileData');
    });
  });

  afterEach(function() {
    $.baseUrl.restore();
  });

  it('should exist', function() {
    expect(VectorTileData).to.exist;
  });

  describe('buildTileGetter', function() {
    it('should exist', function() {
      expect(VectorTileData).to.respondTo('buildTileGetter');
    });

    it('should return a function when given a datasetId, fieldName', function() {
      var curriedFunction = VectorTileData.buildTileGetter('four-four', 'my_field');
      expect(curriedFunction).to.exist.and.to.be.a('function');
    });

    describe('curried tileGetter function', function() {
      beforeEach(function() {
        sinon.stub(VectorTileData, 'getHost', _.constant('foo.example.com'));
        sinon.stub(VectorTileData, 'getArrayBuffer');
      });

      afterEach(function() {
        VectorTileData.getHost.restore();
        VectorTileData.getArrayBuffer.restore();
      });

      it('should get a URL based on its arguments', function() {
        var urlMatcher = new RegExp('^http://foo\\.example\\.com/tiles/my_field/four-four/1/2/3\\.pbf?');
        var curriedFunction = VectorTileData.buildTileGetter('four-four', 'my_field', '', true);
        curriedFunction(1, 2, 3);
        expect(VectorTileData.getHost).to.have.been.called;
        expect(VectorTileData.getArrayBuffer).to.have.been.calledWithMatch(sinon.match(urlMatcher));
      });

      it('should include the where clause if provided', function() {
        var whereClause = 'my_field="two"';
        var whereMatcher = new RegExp('{0}={1}'.format(escape('$where'), escape(whereClause)));
        var curriedFunction = VectorTileData.buildTileGetter('five-five', 'another_field', whereClause, false);
        curriedFunction(3, 2, 1);
        expect(VectorTileData.getHost).to.have.been.called;
        expect(VectorTileData.getArrayBuffer).to.have.been.calledWithMatch(sinon.match(whereMatcher));
      });
    });

  });

  describe('getHost', function() {
    it('should exist', function() {
      expect(VectorTileData).to.respondTo('getHost');
    });

    it('should provide the origin hostname when there are no tileserver hosts configured', function() {
      tileserverHosts.splice(0, tileserverHosts.length); // Empty the array, maintaining the same ref
      expect(tileserverHosts).to.be.empty;
      var url = VectorTileData.getHost(1, 2);
      expect(url).to.exist.and.to.equal('example.com');
    });

    it('should provide the origin hostname when called with useOriginHost', function() {
      var url = VectorTileData.getHost(1, 2, true);
      expect(url).to.exist.and.to.equal('example.com');
    });

    it('should provide a hostname from the configured tileserver hosts', function() {
      var url = VectorTileData.getHost(1, 2);
      expect(tileserverHosts).to.contain(url);
    });

    it('should provide different hostnames for adjacent x,y values', function() {
      var url1 = VectorTileData.getHost(1, 1);
      var url2 = VectorTileData.getHost(1, 2);
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
      expect(VectorTileData).to.respondTo('getArrayBuffer');
    });

    it('should return a promise', function() {
      var returnValue = VectorTileData.getArrayBuffer('http://example.com');
      expect(returnValue).to.respondTo('then');
    });

    describe('promise return value', function() {
      beforeEach(function() {
        sinon.stub(VectorTileData, 'typedArrayFromArrayBufferResponse', _.constant(new Uint8Array(0)));
      });
      afterEach(function() {
        VectorTileData.typedArrayFromArrayBufferResponse.restore();
      });

      it('should resolve when the xhr request completes successfully', function(done) {
        var url = 'http://example.com';
        server.respondWith('');
        var returnValue = VectorTileData.getArrayBuffer(url);
        server.respond();
        returnValue.then(function() {
          done();
        }, function() {
          throw new Error('Should not fail!');
        });
        $rootScope.$digest();
      });

      it('should reject when the xhr request completes unsuccessfully', function(done) {
        var url = 'http://example.com';
        var returnValue = VectorTileData.getArrayBuffer(url);
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
        expect(VectorTileData).to.respondTo('typedArrayFromArrayBufferResponse');
      });

      it('should return a typed array if there is a response', function() {
        var actual = VectorTileData.typedArrayFromArrayBufferResponse({ response: new ArrayBuffer(0) });
        expect(actual).to.exist.and.to.be.instanceOf(Uint8Array);
      });

    });
  });

});
