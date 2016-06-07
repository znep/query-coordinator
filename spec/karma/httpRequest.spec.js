import httpRequest, {__RewireAPI__ as httpRequestAPI} from '../../app/assets/javascripts/services/httpRequest';

describe('httpRequest', function() {
  var jQueryAjaxStub;
  var request;
  var testMethod = 'GET';
  var testUrl = 'test.json';
  var testAcceptType;

  beforeEach(function() {
    jQueryAjaxStub = sinon.stub();
    httpRequestAPI.__Rewire__('$', {ajax: jQueryAjaxStub});
  });

  afterEach(function() {
    httpRequestAPI.__ResetDependency__('$');
  });

  describe('for GET requests', function() {

    beforeEach(function() {
      request = httpRequest(testMethod, testUrl, testAcceptType);
    });

    describe('with the JSON type', function() {
      testAcceptType = 'json';

      it('makes the AJAX request with the correct options', function() {
        var jQueryAjaxStubOptions = jQueryAjaxStub.getCall(0).args[0];

        assert.isTrue(jQueryAjaxStub.called);
        assert.equal(testMethod, jQueryAjaxStubOptions.method);
        assert.equal(testUrl, jQueryAjaxStubOptions.url);
        assert.equal(testAcceptType, jQueryAjaxStubOptions.dataType);
      });

      it('returns a promise', function() {
        assert.isTrue(request instanceof Promise);
      });
    });

    describe('with non-JSON types', function() {
      testAcceptType = undefined;

      it('makes the AJAX request with the correct options', function() {
        var jQueryAjaxStubOptions = jQueryAjaxStub.getCall(0).args[0];

        assert.isTrue(jQueryAjaxStub.called);
        assert.equal(testMethod, jQueryAjaxStubOptions.method);
        assert.equal(testUrl, jQueryAjaxStubOptions.url);
        assert.equal(testAcceptType, jQueryAjaxStubOptions.dataType);
      });

      it('returns a promise', function() {
        assert.isTrue(request instanceof Promise);
      });
    });
  });

  describe('for POST requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('POST', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });

  describe('for PUT requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('PUT', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });

  describe('for DELETE requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('DELETE', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });

  describe('for HEAD requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('HEAD', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });

  describe('for OPTIONS requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('OPTIONS', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });

  describe('for PATCH requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('PATCH', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });

  describe('for TRACE requests', function() {
    testAcceptType = undefined;

    it('rejects the promise with an error', function(done) {

      httpRequest('TRACE', testUrl, testAcceptType).
        catch(
          function() {

            assert.isTrue(true);
            done();
          }
        );
    });
  });
});
