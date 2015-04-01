(function() {
  'use strict';

  describe('Configurations service', function() {
    var $rootScope;
    var $httpBackend;
    var ConfigurationsService;
    var THEME_URL_MATCHER = new RegExp('/api/configurations\\.json.*theme_v3.*');

    beforeEach(module('socrataCommon.services'));

    beforeEach(inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');
      ConfigurationsService = $injector.get('ConfigurationsService');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('getThemeConfigurationsObservable', function() {
      it('should respond with an observable for successful request', function(done) {
        $httpBackend.expectGET(THEME_URL_MATCHER).respond(200);
        var themeObservable = ConfigurationsService.getThemeConfigurationsObservable();
        expect(themeObservable).to.respondTo('subscribe');
        themeObservable.subscribe(function() {
          done()
        });
        $httpBackend.flush();
      });

      it('should not error if the server responds with an error', function(done) {
        $httpBackend.expectGET(THEME_URL_MATCHER).respond(404);
        // get the observable and take(1) so the observable ends and we can put the spy checks
        // in the complete callback
        var themeObservable = ConfigurationsService.getThemeConfigurationsObservable().take(1);
        var successCallback = sinon.spy();
        var errorCallback = sinon.spy();
        themeObservable.subscribe(
          successCallback,
          errorCallback,
          function() {
            expect(successCallback.called).to.be.true;
            expect(successCallback.getCall(0).args[0]).to.eql([]);
            expect(errorCallback.called).to.be.false;
            done();
          });
        $httpBackend.flush();
      });

      it('should not make another http request if called multiple times', function() {
        $httpBackend.expectGET(THEME_URL_MATCHER).respond(200);
        var themeObservable = ConfigurationsService.getThemeConfigurationsObservable();
        var otherThemeObservable = ConfigurationsService.getThemeConfigurationsObservable();
        expect(themeObservable).to.equal(otherThemeObservable);
        $httpBackend.flush();
      });

      it('should unwrap the data from the server correctly', function(done) {
        var response = [
          {
            "id": 11,
            "name": "New UX Theme",
            "default": true,
            "domainCName": "localhost",
            "type": "theme_v3",
            "updatedAt": 1422578102,
            "properties": [
              {
                "name": "sign_in",
                "value": "Login"
              },
              {
                "name": "logo_url",
                "value": "http://placekitten.com/g/500/200"
              }]
          }];
        var expected = [
          {
            "name": "sign_in",
            "value": "Login"
          },
          {
            "name": "logo_url",
            "value": "http://placekitten.com/g/500/200"
          }];

        $httpBackend.expectGET(THEME_URL_MATCHER).respond(200, response);
        var themeObservable = ConfigurationsService.getThemeConfigurationsObservable();
        expect(themeObservable).to.respondTo('subscribe');
        themeObservable.subscribe(function(actual) {
          expect(actual).to.eql(expected);
          done()
        });
        $httpBackend.flush();
      });

    });

    describe('getConfigurationValue', function() {
      var configurationArray = [
        {
          "name": "sign_in",
          "value": "Login"
        },
        {
          "name": "logo_url",
          "value": "http://placekitten.com/g/500/200"
        }];

      it('should return the value correctly', function() {
        var actual = ConfigurationsService.getConfigurationValue(configurationArray, 'sign_in');
        expect(actual).to.equal('Login');
      });

      it('should return undefined for values that are not present in the configuration', function() {
        var actual = ConfigurationsService.getConfigurationValue(configurationArray, 'my_nonexistent_value');
        expect(actual).to.be.undefined;
      });

    });

  });


})();
