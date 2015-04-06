describe('SuggestionService', function() {
  'use strict';

  var testHelpers;
  var $httpBackend;
  var SuggestionService;
  var fakeRequestHandler;
  var fake4x4 = 'fake-data';
  var fakeFieldName = 'fieldName';
  var fakeQuery = 'NAR';
  var suggestUrl = '/views/{0}/columns/{1}/suggest/{2}'.format(fake4x4, fakeFieldName, fakeQuery);
  var testJsonV1Path = 'karma-test/dataCards/test-data/suggestionServiceTest/suggestions.json';
  var testJsonV2Path = 'karma-test/dataCards/test-data/suggestionServiceTest/suggestionsV2.json';
  var TEST_V1_RESPONSE;
  var TEST_V2_RESPONSE;

  beforeEach(function() {
    module('dataCards');
    module(testJsonV1Path);
    module(testJsonV2Path);
  });

  beforeEach(inject(function($injector) {
    SuggestionService = $injector.get('SuggestionService');
    testHelpers = $injector.get('testHelpers');
    $httpBackend = $injector.get('$httpBackend');
    TEST_V1_RESPONSE = testHelpers.getTestJson(testJsonV1Path);
    TEST_V2_RESPONSE = testHelpers.getTestJson(testJsonV2Path);
    fakeRequestHandler = $httpBackend.whenGET(new RegExp(suggestUrl, 'i'));
    fakeRequestHandler.respond('');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('suggest', function() {
    it('should exist', function() {
      expect(SuggestionService).to.respondTo('suggest');
    });

    it('should not throw', function() {
      expect(function() {
        SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
      }).to.not.throw();
      $httpBackend.flush();
    });

    it('should return an empty array when no suggestions are fetched', function(done) {
      var response = SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
      response.then(function(data) {
        expect(data).to.be.an('array').and.to.be.empty;
        done();
      });
      $httpBackend.flush();
    });

    describe('with V1 response', function() {
      beforeEach(function() {
        fakeRequestHandler.respond(TEST_V1_RESPONSE);
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

    describe('with V2 response', function() {
      beforeEach(function() {
        fakeRequestHandler.respond(TEST_V2_RESPONSE);
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

    describe('with an unsuccessful response', function() {
      beforeEach(function() {
        fakeRequestHandler.respond(500, '');
      });

      it('should return an empty array of results', function(done) {
        var response = SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
        response.then(function(data) {
          expect(data).to.be.an('array').and.to.be.empty;
          done();
        });
        $httpBackend.flush();
      });
    });
  });
});
