import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('card directive', function() {
  'use strict';

  var CARD_HTML = '<card model="cardModel" interactive="true" edit-mode="editMode"></card>';

  var $rootScope;
  var testHelpers;
  var Model;
  var Card;
  var Mockumentary;
  var $provide;
  var ServerConfig;

  /**
   * Create Card model with options
   * @param {Page} pageModel
   * @param {Object} options
   * @param {String} [options.fieldName='myFieldName']
   * @returns {Card}
   */
  function createCardModel(pageModel, options) {
    options = _.defaults({}, options, {
      fieldName: 'myFieldName',
      cardType: null
    });

    var cardModel = new Card(pageModel, options.fieldName);

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
    scope.editMode = false;
    scope.cardModel = createCardModel(pageModel, options);

    return {
      element: testHelpers.TestDom.compileAndAppend(CARD_HTML, scope),
      scope: scope,
      pageModel: pageModel,
      cardModel : scope.cardModel
    };
  }

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('test'));
  require('app/styles/dataCards/cards.scss');
  require('app/styles/dataCards/card.scss');
  beforeEach(angular.mock.module(['$provide', function(_$provide_) {
    $provide = _$provide_;
  }]));

  beforeEach(
    inject([
      '$rootScope',
      '$templateCache',
      'testHelpers',
      'Model',
      'Card',
      'Mockumentary',
      'ServerConfig',
      function(_$rootScope, _$templateCache, _testHelpers, _Model, _Card, _Mockumentary, _ServerConfig) {

        $rootScope = _$rootScope;
        testHelpers = _testHelpers;
        Model = _Model;
        Card = _Card;
        Mockumentary = _Mockumentary;
        ServerConfig = _ServerConfig;

        // Mock other directives. We don't need to test them.
        testHelpers.mockDirective($provide, 'choropleth');
        testHelpers.mockDirective($provide, 'columnChart');
        testHelpers.mockDirective($provide, 'distributionChart');
        testHelpers.mockDirective($provide, 'featureMap');
        testHelpers.mockDirective($provide, 'histogram');
        testHelpers.mockDirective($provide, 'invalidCard');
        testHelpers.mockDirective($provide, 'searchCard');
        testHelpers.mockDirective($provide, 'timelineChart');

        testHelpers.mockDirective($provide, 'clearableInput');
        testHelpers.mockDirective($provide, 'cardTitle');
        testHelpers.mockDirective($provide, 'tableCard');
        // The css styles are scoped to the body class
        $('body').addClass('state-view-cards');
      }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('debug flyout', function() {
    var el;
    var cardModel;

    it('should not be shown when debug_data_lens feature flag is false', function() {
      sinon.stub(ServerConfig, 'get').withArgs('debug_data_lens').returns(false);
      var directive = createDirective({
        columns: {}
      });

      cardModel = directive.cardModel;
      el = directive.element;
      expect(el.find('.card-control.debug-flyout:visible')).to.have.length(0);


      ServerConfig.get.restore();
    });

    it('should be shown when debug_data_lens feature flag is true', function() {
      sinon.stub(ServerConfig, 'get').withArgs('debug_data_lens').returns(true);
      var directive = createDirective({
        columns: {}
      });

      cardModel = directive.cardModel;
      el = directive.element;
      expect(el.find('.card-control.debug-flyout:visible')).to.have.length(1);

      ServerConfig.get.restore();
    });

  });

  describe('expansion toggle', function() {
    var el;
    var cardModel;

    beforeEach(function() {
      var directive = createDirective({
        columns: {}
      });

      cardModel = directive.cardModel;
      el = directive.element;
    });

    describe('when the card is not expanded', function() {
      it('should contain a link with a title of "Expand this card"', function() {
        cardModel.set('expanded', false);
        assert.lengthOf(el.find('.card-control[title="Collapse this card"]'), 0);
        assert.lengthOf(el.find('.card-control[title="Expand this card"]'), 1);
      });
    });

    describe('when the card is expanded', function() {
      it('should contain a link with a title of "Collapse this card"', function() {
        cardModel.set('expanded', true);
        assert.lengthOf(el.find('.card-control[title="Collapse this card"]'), 1);
        assert.lengthOf(el.find('.card-control[title="Expand this card"]'), 0);
      });
    });

    describe('click', function() {
      it('should call the toggleExpanded method on the parent Page', function() {
        cardModel.page = new Model();
        cardModel.page.toggleExpanded = sinon.spy();
        el.find('.card-control').click();
        sinon.assert.calledOnce(cardModel.page.toggleExpanded);
        sinon.assert.calledWith(cardModel.page.toggleExpanded, cardModel);
      });
    });
  });

  xdescribe('visualization height', function() {
    var el;
    var cardModel;
    beforeEach(function() {
      var directive = createDirective({
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
      var textElement = el.find('.description-truncated-content').text('');
      var visualizationElement = el.find('.card-visualization');
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
      var visualizationElement = el.find('.card-visualization');
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

  describe('when responding to mass deletion', function() {
    it('should mark itself for deletion if not a table card', function() {
      var directive = createDirective({
        fieldName: 'myFieldName',
        columns: {
          myFieldName: {
            name: 'name',
            description: 'descr',
            physicalDatatype: 'text',
            availableCardTypes: ['choropleth'],
            defaultCardType: 'choropleth'
          }
        }
      });

      var didSignal = false;
      directive.scope.$on('delete-card-with-model', function() {
        didSignal = true;
      });

      directive.scope.$broadcast('delete-card-with-model-delegate');
      assert.isTrue(didSignal);
    });

    it('should not mark itself for deletion if a table card', function() {
      var directive = createDirective({
        fieldName: '*',
        columns: {
          '*': {
            name: 'Table Card',
            description: 'Table Card',
            physicalDatatype: '*',
            availableCardTypes: ['table'],
            defaultCardType: 'table'
          }
        }
      });

      var didSignal = false;
      directive.scope.$on('delete-card-with-model', function() {
        didSignal = true;
      });

      directive.scope.$broadcast('delete-card-with-model-delegate');
      assert.isFalse(didSignal);
    });
  });

  describe('customize button', function() {
    var directive;

    beforeEach(function() {
      directive = createDirective({
        columns: {
          myFieldName: {
            name: 'name',
            description: 'descr',
            physicalDatatype: 'text',
            availableCardTypes: ['choropleth'],
            defaultCardType: 'choropleth'
          }
        },
        version: 1
      });
    });
    function findButton() {
      return directive.element.find('.card-controls .icon-settings');
    }

    describe('when the directive is not in edit mode', function() {
      beforeEach(function() {
        directive.scope.editMode = false;
        directive.scope.$digest();
      });

      it('should not be visible', function() {
        expect(findButton().hasClass('ng-hide')).to.equal(true);
      });
    });

    describe('when the directive is in edit mode', function() {
      beforeEach(function() {
        directive.scope.editMode = true;
        directive.scope.$digest();
      });
      it('should be visible', function() {
        expect(findButton().hasClass('disabled')).to.equal(false);
        expect(findButton().hasClass('ng-hide')).to.equal(false);
      });

      it('should trigger customize-card-with-model when clicked', function(done) {
        directive.scope.$on('customize-card-with-model', function(event, payload) {
          expect(payload).to.have.property('fieldName', 'myFieldName');
          done();
        });
        findButton().click();
      });
    });
  });

  describe('when the card type is invalid', function() {
    it('sets the cardType to be invalid', function() {
      var directive = createDirective({ cardType: 'queen of hearts' });
      expect(directive.element.isolateScope().cardType).to.equal('invalid');
    });
  });
});
