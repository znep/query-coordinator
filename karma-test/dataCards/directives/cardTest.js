describe('card directive', function() {
  'use strict';

  var CARD_HTML = '<card model="cardModel" interactive="true"></card>';

  var phases = ['0', '1', '2', '3'];

  _.each(phases, function(phase) {

    describe(('in metadata transition phase ' + phase), function() {

      var $rootScope;
      var testHelpers;
      var Model;
      var CardV0;
      var CardV1;
      var Page;
      var Mockumentary;

      /**
       * Create Card model with options
       * @param {Page} pageModel
       * @param {Object} options
       * @param {String} [options.phase='0']
       * @param {String} [options.fieldName='myFieldName']
       * @returns {CardV1}
       */
      function createCardModel(pageModel, options) {
        options = _.defaults({}, options, {
          phase: '0',
          fieldName: 'myFieldName',
          cardType: null
        });

        var cardModel;
        if (phase === '0' || phase === '1') {
          cardModel = new CardV0(pageModel, options.fieldName);
        } else {
          cardModel = new CardV1(pageModel, options.fieldName);
        }

        cardModel.set('expanded', false);
        cardModel.set('cardSize', 1);

        if (_.isEmpty(options.cardType)) {
          if (options.fieldName === '*') {
            cardModel.set('cardType', 'table');
          } else {
            cardModel.set('cardType', 'column');
          }
        } else {
          cardModel.set('cardType', options.cardType);
        }
        return cardModel;
      }

      /**
       * Create and inject a card directive with options
       * @param {Object} [options]
       * @param {String} [options.phase='0']
       * @param {String} [options.rowDisplayUnit=null]
       * @param {String} [options.primaryAggregation=null]
       * @param {String} [options.primaryAmountField=null]
       * @param {String} [options.fieldName='myFieldName']
       * @returns {Object} {element, scope, datasetModel, pageModel, cardModel}
       */
      function createDirective(options) {
        options = _.defaults({}, options, {
          fieldName: 'myFieldName',
          primaryAggregation: null,
          primaryAmountField: null,
          rowDisplayUnit: 'row',
          phase: '0',
          columns: {
            'myAggregationField': {
              name: 'My Version 1 Aggregation Field',
              description: 'My Version 0 Aggregation Field',
              physicalDatatype: 'number',
              availableCardTypes: ['column'],
              defaultCardType: 'column'
            },
            'myFieldName': {
              name: 'some title text',
              description: 'some description text',
              physicalDatatype: 'number',
              availableCardTypes: ['column'],
              defaultCardType: 'column'
            },
            '*': {
              name: 'Table Card',
              description: 'Table Card',
              physicalDatatype: '*',
              fred: '*',
              availableCardTypes: ['table'],
              defaultCardType: 'table'
            }
          }
        });

        var pageOverrides = {
          primaryAggregation: options.primaryAggregation,
          primaryAmountField: options.primaryAmountField
        };
        var datasetOverrides = {
          columns: options.columns,
          rowDisplayUnit: options.rowDisplayUnit,
        };
        var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

        var scope = $rootScope.$new();
        scope.cardModel = createCardModel(pageModel, options);

        return {
          element: testHelpers.TestDom.compileAndAppend(CARD_HTML, scope),
          scope: scope,
          pageModel: pageModel,
          cardModel : scope.cardModel
        };
      }

      beforeEach(module('/angular_templates/dataCards/card.html'));
      beforeEach(module('/angular_templates/dataCards/spinner.html'));
      beforeEach(module('dataCards/cards.sass'));
      beforeEach(module('dataCards/card.sass'));
      beforeEach(module('test'));
      beforeEach(module('dataCards'));

      beforeEach(
        inject([
          '$rootScope',
          '$templateCache',
          'testHelpers',
          'Model',
          'CardV0',
          'CardV1',
          'Page',
          'Mockumentary',
          function(_$rootScope, _$templateCache, _testHelpers, _Model, _CardV0, _CardV1, _Page, _Mockumentary) {

            $rootScope = _$rootScope;
            testHelpers = _testHelpers;
            Model = _Model;
            CardV0 = _CardV0;
            CardV1 = _CardV1;
            Page = _Page;
            Mockumentary = _Mockumentary;

            // Override the templates of the other directives. We don't need to test them.
            _$templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
            _$templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
            _$templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
            _$templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
            _$templateCache.put('/angular_templates/dataCards/cardVisualizationSearch.html', '');
            _$templateCache.put('/angular_templates/dataCards/cardVisualization.html', '');
            _$templateCache.put('/angular_templates/dataCards/cardVisualizationInvalid.html', '');
            _$templateCache.put('/angular_templates/dataCards/clearableInput.html', '');

            // The css styles are scoped to the body class
            $('body').addClass('state-view-cards');

            testHelpers.overrideMetadataMigrationPhase(phase);
          }
        ])
      );

      afterEach(function() {
        testHelpers.TestDom.clear();
      });

      describe('expansion toggle', function() {
        var el;
        var cardModel;

        beforeEach(function() {
          var directive = createDirective({
            phase: phase,
            columns: {}
          });

          cardModel = directive.cardModel;
          el = directive.element;
        });

        describe('when the card is not expanded', function() {
          it('should contain a link with a title of "Expand this card"', function() {
            cardModel.set('expanded', false);
            expect(el).to.not.have.descendants('.card-control[title="Collapse this card"]');
            expect(el).to.have.descendants('.card-control[title="Expand this card"]');
          });
        });

        describe('when the card is expanded', function() {
          it('should contain a link with a title of "Collapse this card"', function() {
            cardModel.set('expanded', true);
            expect(el).to.have.descendants('.card-control[title="Collapse this card"]');
            expect(el).to.not.have.descendants('.card-control[title="Expand this card"]');
          });
        });

        describe('click', function() {
          it('should call the toggleExpanded method on the parent Page', function() {
            cardModel.page = new Model();
            cardModel.page.toggleExpanded = sinon.spy();
            el.find('.card-control').click();
            expect(cardModel.page.toggleExpanded.calledOnce).to.equal(true);
            expect(cardModel.page.toggleExpanded.calledWith(cardModel)).to.be.true;
          });
        });
      });

      describe('visualization height', function() {
        var el;
        var cardModel;
        beforeEach(function() {
          var directive = createDirective({
            phase: phase,
            columns: {}
          });
          el = directive.element;
          cardModel = directive.cardModel;
          el.css({
            height: $(window).height(),
            display: 'block'
          });
        });

        it('should be set whenever the description height changes', function(done) {
          var textElement = el.find('.card-text').find('.title-one-line').text('');
          var visualizationElement = el.find('card-visualization');
          var originalHeight = visualizationElement.height();

          textElement.text(_.range(100).join('text '));

          // Let the resize event handler run
          testHelpers.waitForSatisfy(function() {
            return visualizationElement.height() !== originalHeight;
          }).then(function() {
            var lotsaTextHeight = visualizationElement.height();

            textElement.text('text');

            testHelpers.waitForSatisfy(function() {
              return visualizationElement.height() !== lotsaTextHeight;
            }).then(function() {
              expect(visualizationElement.height()).to.be.greaterThan(lotsaTextHeight);
              done();
            });
          });
        });

        it('should be set whenever the card height changes', function(done) {
          var visualizationElement = el.find('card-visualization');
          var originalHeight = visualizationElement.height();

          el.height(2 * (el.height() + 1));

          // Let the resize event handler run
          testHelpers.waitForSatisfy(function() {
            return visualizationElement.height() !== originalHeight;
          }).then(function() {
            var biggerContainerHeight = visualizationElement.height();
            expect(biggerContainerHeight).to.be.greaterThan(originalHeight);

            el.height(el.height() / 2);

            testHelpers.waitForSatisfy(function() {
              return visualizationElement.height() < biggerContainerHeight;
            }).then(done);
          });
        });
      });

      describe('card description text', function() {
        var directive;
        var initialDescriptionText = 'some description text';
        var truncatedDescriptionElement;

        beforeEach(function() {
          directive = createDirective({
            phase: phase,
            columns: {
              myFieldName: {
                name: 'name',
                description: initialDescriptionText,
                physicalDatatype: 'text',
                availableCardTypes: ['search'],
                defaultCardType: 'search'
              }
            },
            version: 1
          });
          truncatedDescriptionElement = directive.element.
            find('.card-text').find('.description-truncated-content');
        });

        describe('when collapsed', function() {
          it('should be rendered initially', function(done) {
            // Defer due to the card directive using observeDimensions, which can be async.
            _.defer(function() {
              expect(truncatedDescriptionElement.text()).to.equal(initialDescriptionText);
              done();
            });
          });

          it('should be updated when changed', function(done) {
            var newDescriptionText = 'new description';

            directive.pageModel.getCurrentValue('dataset').set('columns', {
              myFieldName: {
                name: 'name',
                description: newDescriptionText,
                fred: 'text',
                physicalDatatype: 'text',
                availableCardTypes: ['search'],
                defaultCardType: 'search',
                dataset: directive.pageModel.getCurrentValue('dataset')
              }
            });

            // Defer due to the card directive using observeDimensions, which can be async.
            _.defer(function() {
              expect(truncatedDescriptionElement.text()).to.equal(newDescriptionText);
              done();
            });
          });

        });
      });

      describe('dynamic card title', function() {
        it('should display the "count" dynamic title when "count" aggregation is selected', function() {
          var element = createDirective({
            phase: phase,
            rowDisplayUnit: 'my row unit',
            primaryAggregation: 'count'
          }).element;
          expect(element.find('.dynamic-title')).to.have.text('Number of my row units by');
        });

        it('should default to "rows" for the rowDisplayUnit if none is specified', function() {
          var element = createDirective({
            phase: phase
          }).element;
          expect(element.find('.dynamic-title')).to.have.text('Number of rows by');
        });

        it('should display the "sum" dynamic title when "sum" aggregation is selected', function() {
          var element = createDirective({
            phase: phase,
            primaryAggregation: 'sum',
            primaryAmountField: 'myAggregationField'
          }).element;
          expect(element.find('.dynamic-title')).to.have.text('Sum of My Version 1 Aggregation Fields by');
        });

        it('should display the "mean" dynamic title when "mean" aggregation is selected', function() {
          var element = createDirective({
            phase: phase,
            primaryAggregation: 'mean',
            primaryAmountField: 'myAggregationField'
          }).element;
          expect(element.find('.dynamic-title')).to.have.text('Average My Version 1 Aggregation Field by');
        });

        it('should not display the dynamic title for a table card', function() {
          var element = createDirective({
            phase: phase,
            fieldName: '*'
          }).element;
          expect(element.find('.dynamic-title')).to.not.be.visible;
        });

        it('should not display the dynamic title for a search card', function() {
          var element = createDirective({
            phase: phase,
            columns: {
              myFieldName: {
                name: 'name',
                description: 'search card',
                fred: 'text',
                physicalDatatype: 'text',
                availableCardTypes: ['search'],
                defaultCardType: 'search'
              }
            },
            fieldName: 'myFieldName',
            cardType: 'search'
          }).element;
          expect(element.find('.dynamic-title')).to.not.be.visible;
        });

        it('should not display the dynamic title for a feature/point-map card', function() {
          var element = createDirective({
            phase: phase,
            columns: {
              myFieldName: {
                name: 'name',
                description: 'feature',
                fred: 'location',
                physicalDatatype: 'point',
                availableCardTypes: ['feature'],
                defaultCardType: 'feature'
              }
            },
            fieldName: 'myFieldName',
            cardType: 'feature'
          }).element;
          expect(element.find('.dynamic-title')).to.not.be.visible;
        });

      });

    });

  });

});
