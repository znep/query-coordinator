import { expect, assert } from 'chai';
const angular = require('angular');

describe('SuggestionService', function() {
  'use strict';

  var testHelpers;
  var $httpBackend;
  var SuggestionService;
  var fakeRequestHandler;
  var fake4x4 = 'fake-data';
  var fakeFieldName = 'fieldName';
  var fakeQuery = 'NAR';
  var suggestUrl = '/views/{0}/columns/{1}/suggest\\?text={2}'.format(fake4x4, fakeFieldName, fakeQuery);
  var testResponse = require('karma/dataCards/test-data/suggestionServiceTest/suggestions.json');

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    SuggestionService = $injector.get('SuggestionService');
    testHelpers = $injector.get('testHelpers');
    $httpBackend = $injector.get('$httpBackend');
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
        assert.deepEqual(data, []);
        done();
      });
      $httpBackend.flush();
    });

    it('should return some suggestions', function(done) {
      var response = SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
      fakeRequestHandler.respond(testResponse);
      response.then(function(data) {
        expect(data).to.have.length(10);
        expect(_.first(data)).to.equal('six hundred and fifty-nine');
        expect(_.last(data)).to.equal('seven hundred and thirty-six');
        done();
      });
      $httpBackend.flush();
    });

    describe('with an unsuccessful response', function() {
      beforeEach(function() {
        fakeRequestHandler.respond(500, '');
      });

      it('should return null', function(done) {
        var response = SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
        response.then(function(data) {
          assert.isNull(data);
          done();
        });
        $httpBackend.flush();
      });
    });
  });
});
