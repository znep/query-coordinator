describe('UserSessionService', function() {
  var $httpBackend;
  var UserSession;
  var CURRENT_USER_URL_MATCHER = new RegExp('/api/users/current\\.json$');

  beforeEach(module('socrataCommon.services'));
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    UserSession = $injector.get('UserSessionService');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getCurrentUser', function() {
    describe('happy path', function() {
      it('should satisfy the promise with a correct User instance on 200', function(done) {
        $httpBackend.expectGET(CURRENT_USER_URL_MATCHER).respond(200, { id: 'awsm-swse' });
        expect(UserSession.getCurrentUser()).to.eventually.have.property('id', 'awsm-swse').and.notify(done);
        $httpBackend.flush();
      });
    });

    describe('unhappy path', function() {
      it('should reject the promise with Errors.UnknownError for 200s with no ID', function(done) {
        $httpBackend.expectGET(CURRENT_USER_URL_MATCHER).respond(200, { not_id: 'fail-urez' });
        expect(UserSession.getCurrentUser()).to.eventually.be.rejectedWith(UserSession.Errors.UnknownError).and.notify(done);
        $httpBackend.flush();
      });

      it('should reject the promise with Errors.NotLoggedIn for 404s', function(done) {
        $httpBackend.expectGET(CURRENT_USER_URL_MATCHER).respond(404);
        expect(UserSession.getCurrentUser()).to.eventually.be.rejectedWith(UserSession.Errors.NotLoggedIn).and.notify(done);
        $httpBackend.flush();
      });

      it('should reject the promise with an Errors.UnknownError with proper message and code for 500s', function(done) {
        $httpBackend.expectGET(CURRENT_USER_URL_MATCHER).respond(500, {
          error: true,
          code: 'some_error_code',
          message: 'some error message'
        });

        // Chai-as-promised doesn't appear to support something like rejected.and.satisfy(stuff).
        // Do it manually.
        UserSession.getCurrentUser().then(function() { throw new Error('Unexpected satisfy'); },
          function(error) {
            expect(error).to.have.property('message', 'some error message');
            expect(error).to.have.property('code', 'some_error_code');
            done();
          });
        $httpBackend.flush();
      });

      it('should reject the promise with Errors.UnknownError for 400-500s other than 404', function(done) {
        var fakeDataRequestHandler = $httpBackend.whenGET(CURRENT_USER_URL_MATCHER);

        var code = 400;
        function next() {
          if (code < 600 && code !== 404) {
            fakeDataRequestHandler.respond(code, { error: true, code: 'fake_code', message: 'error_msg' });
            code++;
            expect(UserSession.getCurrentUser()).to.eventually.be.rejectedWith(UserSession.Errors.UnknownError).and.notify(next);
          } else {
            done();
          }
        }
        next();
        $httpBackend.flush();
      });
    });
  });

  describe('getCurrentUserObservable', function() {

    beforeEach(function() {
      $httpBackend.expectGET(CURRENT_USER_URL_MATCHER).respond(200, { id: 'awsm-swse' });
    });

    it('should return an observable', function() {
      var observable = UserSession.getCurrentUserObservable();
      $httpBackend.flush();
      expect(observable).to.respondTo('subscribe');
    });

    it('should return the same observable for multiple calls', function() {
      var observable = UserSession.getCurrentUserObservable();
      var observable2 = UserSession.getCurrentUserObservable();
      $httpBackend.flush();
      expect(observable).to.equal(observable2);
    });

  });

});
