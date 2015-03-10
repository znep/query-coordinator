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
    var suggestUrl = '/suggest/{0}/{1}?q={2}'.format(fake4x4, fakeFieldName, fakeQuery);
    var fakeSuggestions = [
      'NARCANON',
      'NARCOTICKS',
      'NARCOLEPSY'
    ];

    beforeEach(module('dataCards'));

    beforeEach(inject(function($injector) {
      SuggestionService = $injector.get('SuggestionService');
      testHelpers = $injector.get('testHelpers');
      $httpBackend = $injector.get('$httpBackend');
      fakeRequestHandler = $httpBackend.whenGET(suggestUrl);
      fakeRequestHandler.respond(fakeSuggestions);
    }));

    describe('suggest', function() {
      it('not throw', function() {
        expect(function() {
          SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
        }).to.not.throw();
      });

      it('should return some suggestions', function(done) {
        var response = SuggestionService.suggest(fake4x4, fakeFieldName, fakeQuery);
        response.then(function(data) {
          expect(data).to.eql(fakeSuggestions);
          done();
        });
        $httpBackend.flush();
      });

    });

  });

})();
