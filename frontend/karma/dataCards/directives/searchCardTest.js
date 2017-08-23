import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('searchCard', function() {
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
  var Constants;
  var ServerConfig;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      _$provide = $provide;
    });
  });

  beforeEach(inject(function($injector) {
    Constants = $injector.get('Constants');
    testHelpers = $injector.get('testHelpers');
    SoqlHelpers = $injector.get('SoqlHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    Mockumentary = $injector.get('Mockumentary');
    q = $injector.get('$q');
    Filter = $injector.get('Filter');
    CardDataService = $injector.get('CardDataService');
    ServerConfig = $injector.get('ServerConfig');
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
    ServerConfig.override('enableSearchSuggestions', true);
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
        physicalDatatype: 'text',
        defaultCardType: 'search',
        availableCardTypes: ['column', 'search']
      },
      'test_column_number': {
        name: 'test number column title',
        description: 'test number column description',
        physicalDatatype: 'number',
        defaultCardType: 'search',
        availableCardTypes: ['column', 'search']
      },
      'test_column_text': {
        name: 'test text column title',
        description: 'test text column description',
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
    model.defineObservableProperty('customTitle', null);
    model.defineObservableProperty('showDescription', true);
    model.defineObservableProperty('column', fakeDatasetColumns[model.fieldName]);
    model.defineObservableProperty('aggregation', {});
    model.page = pageModel;

    var outerScope = rootScope.$new();
    outerScope.whereClause = '';
    outerScope.model = model;
    outerScope.whereClause = 'PRETEND_PAGE_FILTER';

    var html = '<div class="card-visualization"><search-card></search-card></div>';
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
      expect(helpText.find('div').eq(2).is(':visible')).to.equal(false);
      deferred.resolve([
        SAMPLE_1,
        SAMPLE_2
      ]);
      cardData.scope.$apply();
      expect(helpText.find('div').eq(2).is(':visible')).to.equal(true);
    });

    it('should not show sample data for a number column', function() {
      getSampleDataStub.returns(q.when([
        SAMPLE_1,
        SAMPLE_2
      ]));
      var cardData = createCard('test_column_number');
      var sampleText = cardData.element.find('.search-card-text div').eq(2);
      expect(getSampleDataStub.called).to.equal(false);
      expect(sampleText.is(':visible')).to.equal(false);
    });

    it('should show sample data for a text column', function() {
      getSampleDataStub.returns(q.when([
        SAMPLE_1,
        SAMPLE_2
      ]));
      var cardData = createCard('test_column_text');
      var sampleText = cardData.element.find('.search-card-text div').eq(2);
      expect(sampleText).to.have.length(1);
      expect(sampleText.text()).to.contain(SAMPLE_1);
      expect(sampleText.text()).to.contain(SAMPLE_2);
    });

    it('should truncate the lengths of the samples if they are over the defined limit', function() {
      var LONG_SAMPLE_1 = Array(Constants.MAX_SUGGESTION_LENGTH + 2).join('a');
      var TRUNCATED_LONG_SAMPLE_1 = '{0}...'.format(LONG_SAMPLE_1.slice(0, Constants.MAX_SUGGESTION_LENGTH));
      var ALMOST_LONG_SAMPLE_2 = Array(Constants.MAX_SUGGESTION_LENGTH - 1).join('a');
      var EXAMPLE_FORMAT = '(Examples: \'{0}\' or \'{1}\')';

      getSampleDataStub.returns(q.when([
        LONG_SAMPLE_1,
        ALMOST_LONG_SAMPLE_2
      ]));

      var cardData = createCard('test_column_text');
      var sampleText = cardData.element.find('.search-card-text div').eq(2);
      expect(sampleText.text()).to.equal(EXAMPLE_FORMAT.format(
        TRUNCATED_LONG_SAMPLE_1,
        ALMOST_LONG_SAMPLE_2
      ));
    });
  });

  describe('card', function() {
    var cardData;

    function setSearchText(text) {
      cardData.scope.$apply(function() {
        cardData.element.find('search-card').scope().search = text;
      });
    }

    describe('with physicalDatatype = "text"', function() {
      var FIELDNAME = 'test_column_text';
      var VALID_SEARCH_TERM = 'b';

      beforeEach(function() {
        cardData = createCard(FIELDNAME);
      });

      describe('with input', function() {
        beforeEach(function() {
          setSearchText(VALID_SEARCH_TERM);
        });

        it('should submit when you click the search button', function() {
          cardData.element.find('button[type="submit"]').submit();
          sinon.assert.calledOnce(toggleExpandedSpy);
          expect(cardData.element.find('.search-card-results').is(':visible')).to.equal(true);
        });

        describe('that the user just submitted', function() {
          beforeEach(function() {
            cardData.scope.$apply(function() {
              cardData.element.find('form').triggerHandler('submit');
            });
          });

          it('should respond to submit by expanding the card', function() {
            sinon.assert.calledOnce(toggleExpandedSpy);
            expect(cardData.element.find('.search-card-results').is(':visible')).to.equal(true);
            expect(cardData.element.find('.search-card-text.no-results').is(':visible')).to.equal(false);
          });

          it('should respond with a table WHERE clause which is a logical AND of the page filter and the submitted text', function() {
            function currentSearchWhere() {
              var innerScope = cardData.element.find('table-card').scope();
              return innerScope.searchWhere;
            }

            expect(currentSearchWhere()).to.equal('{0} AND {1} = "{2}"'.format(
              cardData.outerScope.whereClause,
              SoqlHelpers.formatFieldName(cardData.model.fieldName),
              VALID_SEARCH_TERM));

            //Simulate the user changing the page WHERE clause.
            cardData.outerScope.$apply(function() {
              cardData.outerScope.whereClause = 'A_NEW_WHERE_CLAUSE';
            });

            expect(currentSearchWhere()).to.equal('{0} AND {1} = "{2}"'.format(
              cardData.outerScope.whereClause,
              SoqlHelpers.formatFieldName(cardData.model.fieldName),
              VALID_SEARCH_TERM));
          });

          it('should display with the column corresponding to the fieldname of this card in the first position', function() {
            expect(cardData.element.find('.th:eq(0)').data('columnId')).to.equal(FIELDNAME);
          });

          it('should display the row count', function(done) {
            cardData.element.find('search-card').scope().$observe('rowCount').subscribe(function(rowCount) {
              expect(getRowsStub.called).to.equal(true);
              expect(cardData.element.find('.search-card-info').text()).to.equal('Showing {0} of {1} matching results'.format(rowCount, ROW_COUNT));
              done();
            });
          });
        });
      });

      describe('without input', function() {
        it('should not respond to submit', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('form').triggerHandler('submit');
          });

          sinon.assert.notCalled(toggleExpandedSpy);
        });
      });

      describe('suggestions', function() {
        var suggestionToolPanelScope;
        beforeEach(function() {
          cardData = createCard(FIELDNAME);
          suggestionToolPanelScope = cardData.element.find('suggestion-tool-panel').scope();
        });

        it('should dim the initial help text when the panel should show', function() {
          setSearchText(VALID_SEARCH_TERM);
          assert.isTrue($(cardData.element.find('.card-example-text')).hasClass('dimmed'));
        });

        describe('when selected', function() {
          it('should expand the card', function() {
            cardData.scope.$apply(function() {
              suggestionToolPanelScope.$emit('suggestionToolPanel:selectedItem', 'FOO');
            });

            sinon.assert.calledOnce(toggleExpandedSpy);
            var $results = cardData.element.find('.search-card-results');

            assert.isTrue($results.is(':visible'));
          });

          it('should apply the filter', function() {
            cardData.scope.$apply(function() {
              suggestionToolPanelScope.$emit('suggestionToolPanel:selectedItem', 'SHOULD_BE_APPLIED');
            });

            expect(suggestionToolPanelScope.search).to.equal('SHOULD_BE_APPLIED');
          });
        });

        describe('flag to show or hide the suggestionToolPanel', function() {
          function clickOutside() {
            $(document).click();
          }

          describe('with no text in the search box', function() {
            it('should be false', function() {
              setSearchText('');
              expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
            });

            describe('after a click in the suggestion tool panel', function() {
              it('should remain false', function() {
                setSearchText('');
                clickOutside();
                suggestionToolPanelScope.$emit('clearableInput:click');
                expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
              });
            });
          });

          describe ('with text in the search box', function() {
            it('should be true', function() {
              setSearchText(VALID_SEARCH_TERM);
              expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(true);
            });

            it('should become false if search text is removed', function() {
              setSearchText(VALID_SEARCH_TERM);
              setSearchText('');
              expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
            });

            describe('after a click outside the search panel area', function() {
              it('should become false', function() {
                setSearchText(VALID_SEARCH_TERM);
                expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(true);
                clickOutside();
                expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
              });

              it('should remain true if the user then clicks the suggestion tool panel', function() {
                setSearchText(VALID_SEARCH_TERM);
                clickOutside();
                suggestionToolPanelScope.$emit('clearableInput:click');
                expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(true);
              });
            });

            describe('after the input box loses focus', function() {
              describe('by tabbing to the clear button', function() {
                it('should become false', function() {
                  setSearchText(VALID_SEARCH_TERM);

                  var newFocusTarget = cardData.element.find('.clearable-input-trigger');

                  suggestionToolPanelScope.$emit('clearableInput:blur', { relatedTarget: newFocusTarget });
                  expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
                });

              });

              // Currently broken, filter condition of
              // clearableInputBlurTargetNotSuggestion$ is too strict.
              xdescribe('to something outside the card', function() {
                it('should become false', function() {
                  setSearchText(VALID_SEARCH_TERM);

                  var newFocusTarget = $(document);

                  suggestionToolPanelScope.$emit('clearableInput:blur', { relatedTarget: newFocusTarget });
                  expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
                });
              });
            });

            describe('upon selecting a suggestion', function() {
              it('should become false', function() {
                setSearchText(VALID_SEARCH_TERM);
                suggestionToolPanelScope.$emit('suggestionToolPanel:selectedItem', 'some suggestion');
                expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
              });
            });
          });

        });

      });
    });

    describe('with physicalDatatype = "number"', function() {
      var FIELDNAME = 'test_column_number';
      var VALID_SEARCH_TERM = '1';
      var INVALID_SEARCH_TERM = 'a';

      beforeEach(function() {
        cardData = createCard(FIELDNAME);
      });

      describe('with valid input', function() {
        beforeEach(function() {
          setSearchText(VALID_SEARCH_TERM);
        });

        it('should not show an invalid input message', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('form').triggerHandler('submit');
          });
          sinon.assert.calledOnce(toggleExpandedSpy);
          expect(cardData.element.find('.search-card-text.invalid-value').is(':visible')).to.equal(false);
        });

      });

      describe('with invalid input', function() {
        beforeEach(function() {
          setSearchText(INVALID_SEARCH_TERM);
        });

        it('should show a message', function() {
          cardData.scope.$apply(function() {
            cardData.element.find('form').triggerHandler('submit');
          });
          sinon.assert.calledOnce(toggleExpandedSpy);
          expect(cardData.element.find('.search-card-text.invalid-value').is(':visible')).to.equal(true);
        });

        it('should clear the message when a valid value is submitted', function() {
          setSearchText(VALID_SEARCH_TERM);
          expect(cardData.element.find('.search-card-text.invalid-value').is(':visible')).to.equal(false);
        });

      });

      describe('suggestions', function() {
        var suggestionToolPanelScope;
        beforeEach(function() {
          cardData = createCard(FIELDNAME);
          suggestionToolPanelScope = cardData.element.find('suggestion-tool-panel').scope();
        });

        it('should not dim the initial help text when a search is in progress', function() {
          setSearchText(VALID_SEARCH_TERM);
          assert.isFalse($(cardData.element.find('.card-example-text')).hasClass('dimmed'));
        });

        describe('flag to show or hide the suggestionToolPanel', function() {
          it('should be false regardless of input', function() {
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
            setSearchText(VALID_SEARCH_TERM);
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
            setSearchText('');
            expect(suggestionToolPanelScope.shouldShowSuggestionPanel).to.equal(false);
          });

        });

      });

    });

  });

});
