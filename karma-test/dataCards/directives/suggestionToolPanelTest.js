(function() {

  'use strict';

  describe('A Suggestion Tool Panel', function() {
    var testHelpers;
    var suggestionService;
    var rootScope;
    var q;
    var suggestionStub;
    var suggestionToolPanel;
    var fakeDataset;
    var fakeFieldName;
    var Model;
    var fakeClock;
    var _$provide;

    beforeEach(module('/angular_templates/dataCards/suggestionToolPanel.html'));
    beforeEach(module('/angular_templates/common/intractableList.html'));

    beforeEach(module('dataCards'));
    beforeEach(module('dataCards.services'));
    beforeEach(module('dataCards.directives'));

    beforeEach(module('dataCards/cards.sass'));
    beforeEach(module('dataCards/search.sass'));

    beforeEach(function() {
      module(function($provide) {
        _$provide = $provide;
      })
    });

    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
      suggestionService = $injector.get('SuggestionService');
      q = $injector.get('$q');
      suggestionStub = sinon.stub(suggestionService, 'suggest').returns(q.when([]));
      rootScope.$apply();
      Model = $injector.get('Model');
      fakeDataset = new Model();
      fakeFieldName = 'fieldName';
      fakeDataset.id = 'digg-itty';

      fakeClock = sinon.useFakeTimers();

      testHelpers.mockDirective(_$provide, 'spinner');
    }));

    afterEach(function() {
      testHelpers.cleanUp();
      suggestionStub.restore();
      fakeClock.restore();
      fakeClock = null;
    });

    function createElement(scopeOverrides) {
      var scope = rootScope.$new();
      _.extend(scope, {
        shouldShow: false,
        selectedSuggestion: null,
        searchValue: null,
        dataset: null,
        fieldName: null
      },
      scopeOverrides);

      return {
        scope: scope,
        element: testHelpers.TestDom.compileAndAppend(
          '<suggestion-tool-panel ' +
            'should-show="shouldShow"' +
            'selected-suggestion="selectedSuggestion"' +
            'search-value="searchValue"' +
            'field-name="fieldName"' +
            'dataset="dataset" />',
          scope
        )
      };
    }

    describe('suggestion tool panel', function() {

      it('should exist in the dom', function() {
        suggestionToolPanel = createElement();
        expect(suggestionToolPanel.element.find('.suggestion-tool-panel')).to.exist;
      });

      it('should show when shouldShow is true', function() {
        suggestionToolPanel = createElement({
          shouldShow: true
        });
        expect(suggestionToolPanel.element.find('.suggestion-tool-panel .suggestion-examples')).to.be.visible;
      });

      it('should be hidden when shouldShow is false', function() {
        suggestionToolPanel = createElement({
          shouldShow: false
        });
        expect(suggestionToolPanel.element.find('.suggestion-tool-panel')).to.not.be.visible;
      });

      it('should emit suggestionToolPanel:selectedItem when a suggestion is clicked', function(done) {
        suggestionService.suggest = function() {
          return q.when(['FOO', 'BAR', 'BAZ']);
        };
        suggestionToolPanel = createElement({
          shouldShow: true,
          searchValue: 'NAR',
          dataset: fakeDataset,
          fieldName: fakeFieldName
        });

        fakeClock.tick(300);
        suggestionToolPanel.scope.$apply();

        suggestionToolPanel.scope.$on('suggestionToolPanel:selectedItem', function() { done() });

        suggestionToolPanel.element.find('intractable-list li').first().click();
      });

      xit('should show no search results heading when there are now search results', function() {
        // working
      });

      xit('should show the "only search result" heading when there is just one search result', function() {
        // working
      });

      xit('should show the "all search results" heading when there are a limited number of search results', function() {
        // working
      });

      xit('should show the "top search results" message when there are large number of search results', function() {
        // working
      });

      xit('should dismiss the suggestion tool panel when input element loses focus', function() {
        // working
      });

      xit('should visually cover up the existing search suggestions when the panel is visible and not expanded', function() {
        // working
      });

      xit('should dim the existing search suggestions when the panel is visible and expanded', function() {
        // working
      });

      xit('should suggest broadening the search criteria when there are no search results', function() {
        // working
      });

      xit('should instruct the user to choose a suggestion when there are one or more search results', function() {
        // working
      });

      it('show a loading spinner while the request to spandex is in flight', function() {
        var suggestionsDefer = q.defer();
        var timesSuggestCalled = 0;
        suggestionService.suggest = function() {
          timesSuggestCalled ++;
          return suggestionsDefer.promise;
        };

        suggestionToolPanel = createElement({
          shouldShow: true,
          searchValue: 'NAR',
          dataset: fakeDataset,
          fieldName: fakeFieldName
        });

        function isSpinnerVisible() {
          return suggestionToolPanel.element.find('.spinner').scope().suggestionsLoading != false;
        }

        expect(timesSuggestCalled).to.equal(0);

        expect(isSpinnerVisible()).to.equal(true);

        fakeClock.tick(300); // API calls are debounced.

        expect(isSpinnerVisible()).to.equal(true);

        expect(timesSuggestCalled).to.equal(1);

        suggestionsDefer.resolve([]);
        suggestionToolPanel.scope.$apply();

        expect(isSpinnerVisible()).to.equal(false);
      });

      it('should not call into the suggestions service until the input of the search field has not changed for 300ms', function() {
        suggestionToolPanel = createElement({
          shouldShow: true,
          searchValue: 'NAR',
          dataset: fakeDataset,
          fieldName: fakeFieldName
        });
        expect(suggestionStub.called, 'Expected suggestionStub to be called').to.be.false;

        fakeClock.tick(300);

        expect(suggestionStub.called, 'Expected suggestionStub to be called').to.be.true;

      });

    });

  });

})();
