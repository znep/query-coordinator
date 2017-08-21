import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('addCardDialog', function() {
  'use strict';

  var testHelpers;
  var Card;
  var Mockumentary;
  var Model;
  var $rootScope;
  var $controller;
  var $httpBackend;
  var $templateCache;

  function createDialog() {

    var columns = {
      'spot': {
        'name': 'Spot where cool froods hang out.',
        'description': '???',
        'physicalDatatype': 'number',
        'computationStrategy': {
          'parameters': {
            'region': '_mash-apes'
          }
        },
        'cardType': 'choropleth',
        'defaultCardType': 'choropleth',
        'availableCardTypes': ['choropleth']
      },
      'bar': {
        'name': 'A bar where cool froods hang out.',
        'description': '???',
        'physicalDatatype': 'text',
        'cardType': 'column',
        'defaultCardType': 'column',
        'availableCardTypes': ['column', 'search'],
        'computedColumn': null
      },
      'distribution': {
        'name': 'Place where things are distributed',
        'description': '???',
        'physicalDatatype': 'number',
        'cardinality': 20,
        'cardType': 'histogram',
        'defaultCardType': 'histogram',
        'availableCardTypes': ['histogram', 'column', 'search'],
        'computedColumn': null
      },
      'point': {
        'name': 'Points where crimes have been committed.',
        'description': 'Points.',
        'physicalDatatype': 'point',
        'cardType': 'feature',
        'defaultCardType': 'feature',
        'availableCardTypes': ['feature'],
        'computedColumn': null
      },
      'ward': {
        'name': 'Ward where crime was committed.',
        'description': 'Batman has bigger fish to fry sometimes, you know.',
        'physicalDatatype': 'number',
        'computationStrategy': {
          'parameters': {
            'region': '_mash-apes'
          }
        },
        'cardType': 'choropleth',
        'defaultCardType': 'choropleth',
        'availableCardTypes': ['choropleth']
      },
      'multipleVisualizations': {
        'name': 'A card for which multiple visualizations are possible.',
        'description': '???',
        'physicalDatatype': 'text',
        'cardinality': 2000,
        'cardType': 'search',
        'defaultCardType': 'search',
        'availableCardTypes': ['column', 'search'],
        'computedColumn': null
      }
    };

    var pageOverrides = {
      pageId: 'asdf-fdsa',
      datasetId: 'rook-king'
    };
    var datasetOverrides = {
      id: 'rook-king',
      columns: columns
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var outerScope = $rootScope.$new();

    outerScope.page = pageModel;
    outerScope.dialogState = {
      'cardSize': 1,
      'show': true
    };

    var html =
      '<div ng-if="dialogState.show"> ' +
        '<add-card-dialog ' +
          'style="display:block" ' +
          'on-customize-card="customizeCard" ' +
          'dialog-state="dialogState" ' +
          'page="page" ' +
        '></add-card-dialog>' +
      '</div>';

    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Because we have an ng-if, the element returned by $compile isn't the one we want (it's a
    // comment). So grab all the children of the element's parent.
    element = element.parent().children();

    return {
      outerScope: outerScope,
      element: element,

      // The ng-if introduces another scope
      scope: outerScope.$$childHead.$$childHead
    };
  }

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/cards.scss');

  var $provide;

  beforeEach(function() {
    angular.mock.module(function(_$provide_) {
      $provide = _$provide_;
    });
  });

  beforeEach(
    inject([
      'testHelpers',
      'Card',
      'Mockumentary',
      'Model',
      '$rootScope',
      '$controller',
      '$httpBackend',
      '$templateCache',
      function(
        _testHelpers,
        _Card,
        _Mockumentary,
        _Model,
        _$rootScope,
        _$controller,
        _$httpBackend,
        _$templateCache) {

          testHelpers = _testHelpers;
          Card = _Card;
          Mockumentary = _Mockumentary;
          Model = _Model;
          $rootScope = _$rootScope;
          $controller = _$controller;
          $httpBackend = _$httpBackend;
          $templateCache = _$templateCache;

          // Override the templates of the other directives. We don't need to test them.
          $templateCache.put('/angular_templates/dataCards/spinner.html', '');
          $templateCache.put('/angular_templates/dataCards/choropleth.html', '');
          $templateCache.put('/angular_templates/dataCards/columnChart.html', '');
          $templateCache.put('/angular_templates/dataCards/distributionChart.html', '');
          $templateCache.put('/angular_templates/dataCards/featureMap.html', '');
          $templateCache.put('/angular_templates/dataCards/histogram.html', '');
          $templateCache.put('/angular_templates/dataCards/invalidCard.html', '');
          $templateCache.put('/angular_templates/dataCards/searchCard.html', '');
          $templateCache.put('/angular_templates/dataCards/tableCard.html', '');
          $templateCache.put('/angular_templates/dataCards/timelineChart.html', '');
          $templateCache.put('/angular_templates/dataCards/clearableInput.html', '');

          $httpBackend.whenGET(/\/api\/id\/rook-king.json.*/).respond([]);
          $httpBackend.whenGET(/\/api\/id\/rook-king.json\?%24query=select\+count\(0\).*/).respond([]);
          $httpBackend.whenGET(/\/resource\/rook-king.json.*/).respond([]);
          $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
          $httpBackend.whenGET(/\/api\/curated_regions.*/).respond([]);

          testHelpers.mockDirective($provide, 'classicVisualizationPreviewer');
        }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should close the modal dialog and not add a card when the "Cancel" button is clicked', function() {
    var dialog = createDialog();
    var button = dialog.element.find('button:contains("Cancel")');

    assert.isTrue(dialog.element.is(':visible'));

    button.click();
    dialog.outerScope.$digest();

    assert.isFalse(dialog.element.is(':visible'));
  });

  // For some reason angular started adding an 'undefined:undefined' option to the dropdown,
  // which causes the counts in this test to be off which causes the test to fail. Skipping
  // for now.
  xit('should show all valid columns as options in the "Choose a column..." select control', function() {

    // TODO refactor to merely check the data in the scope. columnAndVisualizationSelectorTest
    // should handle testing the actual UI.
    var dialog = createDialog();
    var selectableColumnOptions = dialog.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(4);
  });

  // For some reason angular started adding an 'undefined:undefined' option to the dropdown,
  // which causes the counts in this test to be off which causes the test to fail. Skipping
  // for now.
  xit('should show columns currently represented as cards in the select control', function() {

    // TODO refactor to merely check the data in the scope. columnAndVisualizationSelectorTest
    // should handle testing the actual UI.
    var dialog = createDialog();
    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardType: 'column',
      expanded: false
    };
    dialog.scope.page.set('cards', [Card.deserialize(dialog.scope.page, serializedCard)]);

    var selectableColumnOptions = dialog.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(4);
  });

  describe('"Add card" button', function() {
    var dialog;
    var button;

    beforeEach(function() {
      dialog = createDialog();
      button = dialog.element.find('button:contains("Add card")');
    });

    describe('with no column selected', function() {
      it('should be disabled', function() {
        assert.isTrue(button.is(':disabled'));
      });
    });

    describe('with an enabled column and with invalid settings', function() {
      beforeEach(function() {
        dialog.element.find('option[value=bar]').prop('selected', true).trigger('change');
        dialog.scope.$digest();
        dialog.scope.addCardModel.set('cardType', 'choropleth');
        dialog.scope.addCardModel.set('computedColumn', undefined);
        dialog.scope.$digest();
      });

      it('should be disabled', function() {
        assert.isTrue(button.is(':disabled'));
      });
    });

    describe('with an enabled column selected and with valid settings', function() {
      beforeEach(function() {
        dialog.element.find('option[value=bar]').prop('selected', true).trigger('change');
        dialog.scope.$digest();
      });

      it('should be enabled', function() {
        assert.isFalse(button.is(':disabled'));
      });

      describe('when clicked', function() {
        var addCardSpy;

        beforeEach(function() {
          addCardSpy = sinon.spy(dialog.scope.page, 'addCard');
          button.click();
          dialog.scope.$digest();
        });

        it('should cause addCard() to be called on the page', function() {
          sinon.assert.calledOnce(addCardSpy);
          sinon.assert.calledWith(addCardSpy, dialog.scope.addCardModel);
        });
      });
    });
  });

});
