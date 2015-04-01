(function() {
  'use strict';

  describe('SuggestionService', function() {
    var testHelpers;
    var $httpBackend;
    var SuggestionService;
    var fakeRequestHandler;
    var fake4x4 = 'fake-data';
    var fakeFieldName = 'fieldName';
    var fakeQuery = 'NAR';
    var suggestUrl = '/views/{0}/columns/{1}/suggest/{2}'.format(fake4x4, fakeFieldName, fakeQuery);
    var testJsonPath = 'karma-test/dataCards/test-data/suggestionServiceTest/suggestions.json';

    beforeEach(function() {
      module('dataCards');
      module(testJsonPath);
    });

    beforeEach(inject(function($injector) {
      SuggestionService = $injector.get('SuggestionService');
      testHelpers = $injector.get('testHelpers');
      $httpBackend = $injector.get('$httpBackend');
      var TEST_RESPONSE = testHelpers.getTestJson(testJsonPath);
      fakeRequestHandler = $httpBackend.whenGET(new RegExp(suggestUrl, 'i'));
      fakeRequestHandler.respond(TEST_RESPONSE);
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('suggest', function() {
      it('not throw', function() {
        expect(function() {
          SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
        }).to.not.throw();
        $httpBackend.flush();
      });

      it('should return some suggestions', function(done) {
        var response = SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
        response.then(function(data) {
          expect(data).to.have.length(10);
          expect(_.first(data)).to.equal('six hundred and fifty-nine');
          expect(_.last(data)).to.equal('seven hundred and thirty-six');
          done();
        });
        $httpBackend.flush();
      });

    });

  });

})();
