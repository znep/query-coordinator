describe('A Suggestion Tool Panel', function() {
  'use strict';

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
  var ServerConfig;
  var timeoutScheduler;
  var testScheduler;

  beforeEach(module('/angular_templates/dataCards/suggestionToolPanel.html'));
  beforeEach(module('/angular_templates/common/intractableList.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('dataCards.directives'));

  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/search.sass'));

  beforeEach(function() {
    timeoutScheduler = Rx.Scheduler.timeout;
    testScheduler = new Rx.TestScheduler();
    Rx.Scheduler.timeout = testScheduler;
    module(function($provide) {
      _$provide = $provide;
    })
  });

  beforeEach(inject(function($injector) {
    ServerConfig = $injector.get('ServerConfig');
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
    testHelpers.mockDirective(_$provide, 'clearableInput');
  }));

  afterEach(function() {
    Rx.Scheduler.timeout = timeoutScheduler;
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
        fieldName: null,
        sampleOne: 'Sample 1',
        sampleTwo: 'Sample 2'
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
        'sample-one="sampleOne"' +
        'sample-two="sampleTwo"' +
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
      expect(suggestionToolPanel.element.find('.suggestion-tool-panel:first-child')).to.not.be.visible;
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

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();

      suggestionToolPanel.scope.$on('suggestionToolPanel:selectedItem', function() {
        done()
      });

      suggestionToolPanel.element.find('intractable-list li').first().click();
    });

    it('should show "no search results" heading when there are no search results', function() {
      suggestionService.suggest = function() {
        return q.when([]);
      };
      suggestionToolPanel = createElement({
        shouldShow: true,
        searchValue: 'NAR',
        dataset: fakeDataset,
        fieldName: fakeFieldName
      });

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();
      expect(suggestionToolPanel.element.find('.suggestions-status')).to.contain('No data found matching your search term.');
    });

    it('should show the "only search result" heading when there is just one search result', function() {
      suggestionService.suggest = function() {
        return q.when(['FOO']);
      };
      suggestionToolPanel = createElement({
        shouldShow: true,
        searchValue: 'NAR',
        dataset: fakeDataset,
        fieldName: fakeFieldName
      });

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();
      expect(suggestionToolPanel.element.find('.suggestions-status')).to.contain('Showing the only suggestion:');
    });

    it('should show the "all search results" heading when there are a limited number of search results', function() {
      suggestionService.suggest = function() {
        return q.when(['FOO', 'BAR', 'BAZ']);
      };
      suggestionToolPanel = createElement({
        shouldShow: true,
        searchValue: 'NAR',
        dataset: fakeDataset,
        fieldName: fakeFieldName
      });

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();
      expect(suggestionToolPanel.element.find('.suggestions-status')).to.contain('Showing all 3 suggestions:');
    });

    it('should show the "top search results" message when there are large number of search results', function() {
      suggestionService.suggest = function() {
        return q.when(_.range(0, 20));
      };
      suggestionToolPanel = createElement({
        shouldShow: true,
        searchValue: 'NAR',
        dataset: fakeDataset,
        fieldName: fakeFieldName
      });

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();
      expect(suggestionToolPanel.element.find('.suggestions-status')).to.contain('Showing top 10 of 20 suggestions:');
    });

    it('should suggest broadening the search criteria when there are no search results', function() {
      suggestionService.suggest = function() {
        return q.when([]);
      };
      suggestionToolPanel = createElement({
        shouldShow: true,
        searchValue: 'NAR',
        dataset: fakeDataset,
        fieldName: fakeFieldName
      });

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();

      var examples = suggestionToolPanel.element.find('.suggestion-examples');
      expect(examples).
        to.contain('Try broadening your search for more results.');
      expect(examples.text()).
        to.contain("Examples: 'Sample 1' or 'Sample 2'");

    });

    it('should instruct the user to choose a suggestion when there are one or more search results', function() {
      suggestionService.suggest = function() {
        return q.when(['FOO', 'BAR', 'BAZ']);
      };
      suggestionToolPanel = createElement({
        shouldShow: true,
        searchValue: 'NAR',
        dataset: fakeDataset,
        fieldName: fakeFieldName
      });

      testScheduler.advanceTo(300);
      suggestionToolPanel.scope.$apply();
      expect(suggestionToolPanel.element.find('.suggestion-examples')).
        to.contain('Choose a suggestion above, or keep typing for more suggestions.');
    });

    it('should not show if the "enableSearchSuggestions" feature flag is false', function() {
      ServerConfig.override('enableSearchSuggestions', false);

      suggestionToolPanel = createElement();
      expect(suggestionToolPanel.element).to.be.empty;
    });

    it('show a loading spinner while the request to spandex is in flight', function() {
      var suggestionsDefer = q.defer();
      var timesSuggestCalled = 0;
      suggestionService.suggest = function() {
        timesSuggestCalled++;
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

      testScheduler.advanceTo(300);

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

      testScheduler.advanceTo(300);

      expect(suggestionStub.called, 'Expected suggestionStub to be called').to.be.true;

    });

  });

});
