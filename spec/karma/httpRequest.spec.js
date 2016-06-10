import httpRequest, {__RewireAPI__ as httpRequestAPI} from '../../app/assets/javascripts/services/httpRequest';

describe('httpRequest', function() {
  var jQueryAjaxStub;
  var request;
  var testMethod;
  var testUrl = 'test.json';

  beforeEach(function() {
    jQueryAjaxStub = sinon.stub();
    httpRequestAPI.__Rewire__('$', {ajax: jQueryAjaxStub});
  });

  afterEach(function() {
    httpRequestAPI.__ResetDependency__('$');
  });

  describe('for GET requests', function() {
    beforeEach(function() {
      testMethod = 'GET';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes the AJAX request with the correct options', function() {
      assert.isTrue(jQueryAjaxStub.called);

      var jQueryAjaxStubOptions = jQueryAjaxStub.getCall(0).args[0];
      assert.equal(testMethod, jQueryAjaxStubOptions.method);
      assert.equal(testUrl, jQueryAjaxStubOptions.url);
    });
  });

  describe('for POST requests', function() {
    beforeEach(function() {
      testMethod = 'POST';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes no AJAX request', function() {
      assert.isFalse(jQueryAjaxStub.called);
    });
  });

  describe('for PUT requests', function() {
    beforeEach(function() {
      testMethod = 'PUT';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes the AJAX request with the correct options', function() {
      assert.isTrue(jQueryAjaxStub.called);

      var jQueryAjaxStubOptions = jQueryAjaxStub.getCall(0).args[0];
      assert.equal(testMethod, jQueryAjaxStubOptions.method);
      assert.equal(testUrl, jQueryAjaxStubOptions.url);
    });
  });

  describe('for DELETE requests', function() {
    beforeEach(function() {
      testMethod = 'DELETE';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes no AJAX request', function() {
      assert.isFalse(jQueryAjaxStub.called);
    });
  });

  describe('for HEAD requests', function() {
    beforeEach(function() {
      testMethod = 'HEAD';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes no AJAX request', function() {
      assert.isFalse(jQueryAjaxStub.called);
    });
  });

  describe('for OPTIONS requests', function() {
    beforeEach(function() {
      testMethod = 'OPTIONS';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes no AJAX request', function() {
      assert.isFalse(jQueryAjaxStub.called);
    });
  });

  describe('for PATCH requests', function() {
    beforeEach(function() {
      testMethod = 'PATCH';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes no AJAX request', function() {
      assert.isFalse(jQueryAjaxStub.called);
    });
  });

  describe('for TRACE requests', function() {
    beforeEach(function() {
      testMethod = 'TRACE';
      request = httpRequest(testMethod, testUrl);
    });

    it('returns a promise', function() {
      assert.isTrue(request instanceof Promise);
    });

    it('makes no AJAX request', function() {
      assert.isFalse(jQueryAjaxStub.called);
    });
  });
});
