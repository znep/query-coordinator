(function() {

  'use strict';

  describe('A Search Card Visualization', function() {
    var ROW_COUNT = 250;
    var testHelpers, rootScope, Model, CardV0, Page, q, Filter;
    var CardDataService;
    var getSampleDataStub;
    var toggleExpandedSpy;
    var getRowsStub;

    beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
    beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
    beforeEach(module('/angular_templates/dataCards/table.html'));
    beforeEach(module('/angular_templates/dataCards/clearableInput.html'));

    beforeEach(module('dataCards'));
    beforeEach(module('dataCards.services'));
    beforeEach(module('dataCards.directives'));
    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
      Model = $injector.get('Model');
      CardV0 = $injector.get('CardV0');
      Page = $injector.get('Page');
      q = $injector.get('$q');
      Filter = $injector.get('Filter');
      CardDataService = $injector.get('CardDataService');
      sinon.stub(CardDataService, 'getData').returns(q.when([]));
      getRowsStub = sinon.stub(CardDataService, 'getRows').returns(q.when([
        {
          filler_column: 'foo',
          test_column_number: 1,
          test_column_text: 'bar'
        }
      ]));
      sinon.stub(CardDataService, 'getRowCount').returns(q.when(ROW_COUNT));
      getSampleDataStub = sinon.stub(CardDataService, 'getSampleData');
      getSampleDataStub.returns(q.when([]));
    }));

    afterEach(function() {
      testHelpers.TestDom.clear();
      getSampleDataStub.restore();
    });

    var createCard = function(fieldName) {
      var datasetModel = new Model();
      var fakeDatasetColumns = {
        'filler_column': {
          "name": "fillter column title",
          "description": "fillter column description",
          "fred": "text",
          "physicalDatatype": "text",
          "dataset": datasetModel
        },
        'test_column_number': {
          "name": "test number column title",
          "description": "test number column description",
          "fred": "text",
          "physicalDatatype": "number",
          "dataset": datasetModel
        },
        'test_column_text': {
          "name": "test text column title",
          "description": "test text column description",
          "fred": "text",
          "physicalDatatype": "text",
          "dataset": datasetModel
        }
      };

      datasetModel.id = 'bana-nas!';
      datasetModel.version = '1';
      datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
      datasetModel.defineObservableProperty('columns', fakeDatasetColumns);

      var model = new Model();
      model.fieldName = fieldName ? fieldName : 'test_column_text';
      model.defineObservableProperty('activeFilters', []);
      model.defineObservableProperty('expanded', false);
      model.defineObservableProperty('column', fakeDatasetColumns[model.fieldName]);

      var pageModel = new Page('asdf-fdsa');
      pageModel.set('dataset', datasetModel);
      pageModel.set('baseSoqlFilter', null);
      pageModel.set('cards', []);
      pageModel.set('primaryAggregation', null);
      pageModel.set('primaryAmountField', null);
      toggleExpandedSpy = sinon.spy(pageModel, 'toggleExpanded');
      model.page = pageModel;

      var outerScope = rootScope.$new();
      outerScope.whereClause = '';
      outerScope.model = model;

      var html = '<div class="card-visualization"><card-visualization-search model="model" where-clause="whereClause"></card-visualization-search></div>';
      var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
      return {
        pageModel: pageModel,
        datasetModel: datasetModel,
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
        var dfd = q.defer();
        getSampleDataStub.returns(dfd.promise);
        var cardData = createCard();
        var helpText = cardData.element.find('.search-card-text');
        expect(helpText.find('.one-line').is(':visible')).to.equal(false);
        dfd.resolve([
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

          it('should respond to submit by expanding the card', function() {
            cardData.scope.$apply(function() {
              cardData.element.find('form').triggerHandler('submit');
            });
            expect(toggleExpandedSpy.calledOnce).to.equal(true);
            expect(cardData.element.find('.search-card-results').is(':visible')).to.equal(true);
            expect(cardData.element.find('.search-card-text.no-results').is(':visible')).to.equal(false);
          });

          it('should submit when you click the search button', function() {
            cardData.scope.$apply(function() {
              cardData.element.find('button[type="submit"]').click();
            });
            expect(toggleExpandedSpy.calledOnce).to.equal(true);
            expect(cardData.element.find('.search-card-results').is(':visible')).to.equal(true);
          });

          it('should display with the column corresponding to the fieldname of this card in the first position', function() {
            cardData.scope.$apply(function() {
              cardData.element.find('form').triggerHandler('submit');
            });
            expect(cardData.element.find('.th:eq(0)').data('columnId')).to.equal(FIELDNAME);
          });

          it('should display the row count', function(done) {
            cardData.scope.$apply(function() {
              cardData.element.find('form').triggerHandler('submit');
            });
            cardData.element.find('card-visualization-search').isolateScope().observe('rowCount').subscribe(function(rowCount) {
              expect(getRowsStub.called).to.equal(true);
              expect(cardData.element.find('.search-card-info').text()).to.equal('Showing {0} of {1} matching results'.format(rowCount, ROW_COUNT));
              done();
            });
          });

        });

        describe('without input', function() {
          it('should respond to submit by expanding the card but not show table', function() {
            cardData.scope.$apply(function() {
              cardData.element.find('form').triggerHandler('submit');
            });
            expect(toggleExpandedSpy.calledOnce).to.equal(true);
            var $results = cardData.element.find('.search-card-results');
            expect($results.is(':visible')).to.equal(true);
            expect($results.find('.search-card-text').is(':visible')).to.equal(false);
            expect($results.find('card-visualization-table:visible').length).to.equal(0);
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

})();
