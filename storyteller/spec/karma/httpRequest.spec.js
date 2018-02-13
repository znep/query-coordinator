import $ from 'jquery';
import sinon from 'sinon';
import { assert } from 'chai';

import httpRequest, {
  coreHeaders,
  storytellerHeaders,
  __RewireAPI__ as httpRequestAPI
} from '../../app/assets/javascripts/services/httpRequest';

describe('httpRequest', function() {
  var jQueryAjaxStub;
  var testUrl = 'test.json';

  beforeEach(function() {
    jQueryAjaxStub = sinon.stub();
    httpRequestAPI.__Rewire__('$', {ajax: jQueryAjaxStub});
  });

  afterEach(function() {
    httpRequestAPI.__ResetDependency__('$');
  });

  function behavesLikeRequestMade(method, url) {
    describe(`for ${method} requests`, function() {
      var request;

      beforeEach(function() {
        request = httpRequest(method, url);
      });

      it('returns a promise', function() {
        assert.isTrue(request instanceof Promise);
      });

      it('makes the AJAX request with the correct options', function() {
        assert.isTrue(jQueryAjaxStub.called);

        var jQueryAjaxStubOptions = jQueryAjaxStub.getCall(0).args[0];
        assert.equal(method, jQueryAjaxStubOptions.method);
        assert.equal(url, jQueryAjaxStubOptions.url);
      });
    });
  }

  function behavesLikeInvalidMethod(method) {
    it('raises an error on assertion', function() {
      assert.throws(() => { httpRequest(method, testUrl); }, 'Unsupported HTTP method');
      assert.isFalse(jQueryAjaxStub.called);
    });
  }

  describe('with invalid URLs', function() {
    it('raises an error on assertion', function() {
      assert.throws(() => { httpRequest('GET', null); }, 'Value must be one of');
      assert.isFalse(jQueryAjaxStub.called);
    });
  });

  describe('with invalid HTTP methods', function() {
    behavesLikeInvalidMethod('DELETE');
    behavesLikeInvalidMethod('HEAD');
    behavesLikeInvalidMethod('OPTIONS');
    behavesLikeInvalidMethod('PATCH');
    behavesLikeInvalidMethod('TRACE');
  });

  describe('with a valid URL and method', function() {
    behavesLikeRequestMade('GET', testUrl);
    behavesLikeRequestMade('PUT', testUrl);
    behavesLikeRequestMade('POST', testUrl);
  });

  describe('coreHeaders', function() {
    var notifyStub;

    beforeEach(function() {
      notifyStub = sinon.stub();

      document.cookie = 'socrata-csrf-token=the_csrf_token%3D;'; // '=' encoded

      httpRequestAPI.__Rewire__('Environment', {CORE_SERVICE_APP_TOKEN: 'foo'});
      httpRequestAPI.__Rewire__('exceptionNotifier', {notify: notifyStub});
    });

    afterEach(function() {
      document.cookie += 'expires=Thu, 01 Jan 1970 00:00:01 GMT';

      httpRequestAPI.__ResetDependency__('Environment');
      httpRequestAPI.__ResetDependency__('exceptionNotifier');
    });

    it('returns a headers object', function() {
      assert.deepEqual(coreHeaders(), {
        'X-App-Token': 'foo',
        'X-CSRF-Token': 'the_csrf_token=',
        'X-Socrata-Host': 'localhost'
      });
    });

    it('does not notify repeatedly if the Core app token is not present', function() {
      httpRequestAPI.__Rewire__('Environment', {});

      coreHeaders();
      coreHeaders();
      sinon.assert.calledOnce(notifyStub);
    });
  });

  describe('storytellerHeaders', function() {
    var fakeTokenMeta;

    beforeEach(function() {
      fakeTokenMeta = $('<meta>', { name: 'csrf-token', content: 'faketoken' }).appendTo('head');

      httpRequestAPI.__Rewire__('Environment', {CORE_SERVICE_APP_TOKEN: 'foo'});
    });

    afterEach(function() {
      fakeTokenMeta.remove();

      httpRequestAPI.__ResetDependency__('Environment');
    });

    it('returns a headers object', function() {
      assert.deepEqual(storytellerHeaders(), {
        'X-App-Token': 'foo',
        'X-CSRF-Token': 'faketoken',
        'X-Socrata-Host': 'localhost'
      });
    });

    it('uses an empty string for the CSRF token if the meta tag is not present', function() {
      fakeTokenMeta.remove();

      assert.deepEqual(storytellerHeaders(), {
        'X-App-Token': 'foo',
        'X-CSRF-Token': '',
        'X-Socrata-Host': 'localhost'
      });
    });
  });
});
