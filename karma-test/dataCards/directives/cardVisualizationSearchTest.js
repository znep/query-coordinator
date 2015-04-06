describe('A Search Card Visualization', function() {
  'use strict';

  var ROW_COUNT = 250;
  var testHelpers;
  var SoqlHelpers;
  var rootScope;
  var Model;
  var Mockumentary;
  var q;
  var Filter;
  var CardDataService;
  var getSampleDataStub;
  var toggleExpandedSpy;
  var getRowsStub;
  var _$provide;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('dataCards.directives'));

  beforeEach(function() {
    module(function($provide) {
      _$provide = $provide;
    });
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    SoqlHelpers = $injector.get('SoqlHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    Mockumentary = $injector.get('Mockumentary');
    q = $injector.get('$q');
    Filter = $injector.get('Filter');
    CardDataService = $injector.get('CardDataService');
    sinon.stub(CardDataService, 'getData').returns(q.when([]));
    getRowsStub = sinon.stub(CardDataService, 'getRows').returns(
      q.when([
        {
          filler_column: 'foo',
          test_column_number: 1,
          test_column_text: 'bar'
        }
      ])
    );
    sinon.stub(CardDataService, 'getRowCount').returns(q.when(ROW_COUNT));
    getSampleDataStub = sinon.stub(CardDataService, 'getSampleData');
    getSampleDataStub.returns(q.when([]));
    testHelpers.mockDirective(_$provide, 'suggestionToolPanel');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
    getSampleDataStub.restore();
  });

  var createCard = function(fieldName) {
      var fakeDatasetColumns = {
        'filler_column': {
          name: 'filler column title',
          description: 'filler column description',
          fred: 'text',
          physicalDatatype: 'text',
          defaultCardType: 'search',
          availableCardTypes: ['column', 'search']
        },
        'test_column_number': {
          name: 'test number column title',
          description: 'test number column description',
          fred: 'text',
          physicalDatatype: 'number',
          defaultCardType: 'search',
          availableCardTypes: ['column', 'search']
        },
        'test_column_text': {
          name: 'test text column title',
          description: 'test text column description',
          fred: 'text',
          physicalDatatype: 'text',
          defaultCardType: 'search',
          availableCardTypes: ['column', 'search']
        }
      };

    var pageOverrides = {
      id: 'asdf-fdsa'
    };
    var datasetOverrides = {
      id: 'bana-nas!',
      columns: fakeDatasetColumns,
      rowDisplayUnit: 'row'
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);
    toggleExpandedSpy = sinon.spy(pageModel, 'toggleExpanded');

    var model = new Model();
    model.fieldName = fieldName ? fieldName : 'test_column_text';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('expanded', false);
    model.defineObservableProperty('column', fakeDatasetColumns[model.fieldName]);
    model.page = pageModel;

    var outerScope = rootScope.$new();
    outerScope.whereClause = '';
    outerScope.model = model;
    outerScope.whereClause = "PRETEND_PAGE_FILTER";

    var html = '<div class="card-visualization"><card-visualization-search model="model" where-clause="whereClause"></card-visualization-search></div>';
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
    return {
      pageModel: pageModel,
      model: model,
      element: element,
      outerScope: outerScope,
      scope: element.scope()
    };
  };

  describe('samples', function() {
    var SAMPLE_1 = 'MY_SAMPLE';
    var SAMPLE_2 = 'ANOTHER_THING';

    it('should not show samples section until samples are available', function() {
      var deferred = q.defer();
      getSampleDataStub.returns(deferred.promise);
      var cardData = createCard();
      var helpText = cardData.element.find('.search-card-text');
      expect(helpText.find('.one-line').is(':visible')).to.equal(false);
      deferred.resolve([
        { name: SAMPLE_1 },
        { name: SAMPLE_2 }
      ]);
      cardData.scope.$apply();
      expect(helpText.find('.one-line').is(':visible')).to.equal(true);
    });

    it('should show the sample data', function() {
      getSampleDataStub.returns(q.when([
        { name: SAMPLE_1 },
        { name: SAMPLE_2 }
      ]));
      var cardData = createCard();
      var sampleText = cardData.element.find('.search-card-text .one-line');
      expect(sampleText.text()).to.contain(SAMPLE_1);
      expect(sampleText.text()).to.contain(SAMPLE_2);
    });
  });

  describe('card', function() {
    var cardData;

    describe('with physicalDatatype = "text"', function() {
      var FIELDNAME = 'test_column_text';

      beforeEach(function() {
        cardData = createCard(FIELDNAME);
      });

      describe('with input', function() {
        var SEARCH_TERM = 'test search';
        beforeEach(function() {
          cardData.scope.$apply(function() {
            cardData.element.find('card-visualization-search').isolateScope().search = SEARCH_TERM;
          });
        });

        it('should submit when you click the search button', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('button[type="submit"]').click();
          });
          expect(toggleExpandedSpy.calledOnce).to.equal(true);
          expect(cardData.element.find('.search-card-results').is(':visible')).to.equal(true);
        });

        describe('that the user just submitted', function() {
          beforeEach(function() {
            cardData.scope.$apply(function() {
              cardData.element.find('form').triggerHandler('submit');
            });
          });

          it('should respond to submit by expanding the card', function() {
            expect(toggleExpandedSpy.calledOnce).to.equal(true);
            expect(cardData.element.find('.search-card-results').is(':visible')).to.equal(true);
            expect(cardData.element.find('.search-card-text.no-results').is(':visible')).to.equal(false);
          });

          it('should respond with a table WHERE clause which is a logical AND of the page filter and the submitted text', function() {
            function currentSearchWhere() {
              var innerScope = cardData.element.find('card-visualization-table').scope();
              return innerScope.searchWhere;
            }

            expect(currentSearchWhere()).to.equal('{0} AND {1} = "{2}"'.format(
              cardData.outerScope.whereClause,
              SoqlHelpers.formatFieldName(cardData.model.fieldName),
              SEARCH_TERM));

            //Simulate the user changing the page WHERE clause.
            cardData.outerScope.whereClause = 'A_NEW_WHERE_CLAUSE';
            cardData.outerScope.$apply();

            expect(currentSearchWhere()).to.equal('{0} AND {1} = "{2}"'.format(
              cardData.outerScope.whereClause,
              SoqlHelpers.formatFieldName(cardData.model.fieldName),
              SEARCH_TERM));
          });

          it('should display with the column corresponding to the fieldname of this card in the first position', function() {
            expect(cardData.element.find('.th:eq(0)').data('columnId')).to.equal(FIELDNAME);
          });

          it('should display the row count', function(done) {
            cardData.element.find('card-visualization-search').isolateScope().observe('rowCount').subscribe(function(rowCount) {
              expect(getRowsStub.called).to.equal(true);
              expect(cardData.element.find('.search-card-info').text()).to.equal('Showing {0} of {1} matching results'.format(rowCount, ROW_COUNT));
              done();
            });
          });
        });
      });

      describe('without input', function() {
        it('should respond to submit by expanding the card but not show table', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('form').triggerHandler('submit');
          });

          expect(toggleExpandedSpy).to.be.calledOnce;
          var $results = cardData.element.find('.search-card-results');

          expect($results).to.be.visible;
          expect($results.find('.search-card-text')).to.not.be.visible;
          expect($results.find('card-visualization-table:visible')).to.have.length(0);
        });
      });

      describe('suggestions', function() {
        var FIELDNAME = 'test_column_number';

        beforeEach(function() {
          cardData = createCard(FIELDNAME);
        });

        it('should dim the initial help text when the panel should show', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('card-visualization-search').isolateScope().search = '1';
          });
          expect(cardData.element.find('.card-example-text')).to.have.class('dimmed');
        });

        describe('signal the suggestionToolPanel to show', function() {
          var suggestionToolPanelScope;
          beforeEach(function() {
            suggestionToolPanelScope = cardData.element.find('suggestion-tool-panel').scope();
          });

          it('should signal based on if there is input', function() {
            cardData.scope.$apply(function() {
              cardData.element.find('card-visualization-search').isolateScope().search = '1';
            });
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(true);
            cardData.scope.$apply(function() {
              cardData.element.find('card-visualization-search').isolateScope().search = '';
            });
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
          });

          it('should signal to not show if there is a click outside the search panel area', function() {
            cardData.scope.$apply(function() {
              cardData.element.find('card-visualization-search').isolateScope().search = '1';
            });
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(true);
            $(document).click();
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
          });

        });

      });
    });

    describe('with physicalDatatype = "number"', function() {
      var FIELDNAME = 'test_column_number';

      beforeEach(function() {
        cardData = createCard(FIELDNAME);
      });

      describe('with valid input', function() {
        var SEARCH_TERM = '1';
        beforeEach(function() {
          cardData.scope.$apply(function() {
            cardData.element.find('card-visualization-search').isolateScope().search = SEARCH_TERM;
          });
        });

        it('should not show an invalid input message', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('form').triggerHandler('submit');
          });
          expect(toggleExpandedSpy.calledOnce).to.equal(true);
          expect(cardData.element.find('.search-card-text.invalid-value').is(':visible')).to.equal(false);
        });

      });

      describe('with invalid input', function() {
        var SEARCH_TERM = 'invalid for number column';
        beforeEach(function() {
          cardData.scope.$apply(function() {
            cardData.element.find('card-visualization-search').isolateScope().search = SEARCH_TERM;
          });
        });

        it('should show a message', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('form').triggerHandler('submit');
          });
          expect(toggleExpandedSpy.calledOnce).to.equal(true);
          expect(cardData.element.find('.search-card-text.invalid-value').is(':visible')).to.equal(true);
        });

        it('should clear the message when a valid value is submitted', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('card-visualization-search').isolateScope().search = '1';
          });
          expect(cardData.element.find('.search-card-text.invalid-value').is(':visible')).to.equal(false);
        });

      });

    });

  });

});
