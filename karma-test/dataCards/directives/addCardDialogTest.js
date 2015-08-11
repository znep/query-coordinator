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
        'fred': 'location',
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
        'fred': 'text',
        'physicalDatatype': 'text',
        'cardType': 'column',
        'defaultCardType': 'column',
        'availableCardTypes': ['column', 'search']
      },
      'distribution': {
        'name': 'Place where things are distributed',
        'description': '???',
        'fred': 'amount',
        'physicalDatatype': 'number',
        'cardinality': 20,
        'cardType': 'histogram',
        'defaultCardType': 'histogram',
        'availableCardTypes': ['histogram', 'column', 'search']
      },
      'point': {
        'name': 'Points where crimes have been committed.',
        'description': 'Points.',
        'fred': 'location',
        'physicalDatatype': 'point',
        'cardType': 'feature',
        'defaultCardType': 'feature',
        'availableCardTypes': ['feature']
      },
      'ward': {
        'name': 'Ward where crime was committed.',
        'description': 'Batman has bigger fish to fry sometimes, you know.',
        'fred': 'location',
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
        'fred': 'text',
        'physicalDatatype': 'text',
        'cardinality': 2000,
        'cardType': 'search',
        'defaultCardType': 'search',
        'availableCardTypes': ['column', 'search']
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

    // NOTE: This is straight up copied from CardsViewController.
    var datasetColumns = Rx.Observable.combineLatest(
      pageModel.observe('dataset'),
      pageModel.observe('dataset.columns'),
      pageModel.observe('cards'),
      function(dataset, columns, cards) {

        var sortedColumns = _.pairs(columns).
          map(function(columnPair) {
            return {
              fieldName: columnPair[0],
              columnInfo: columnPair[1]
            };
          }).
          filter(function(columnPair) {

            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            return _.isNull(columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/)) &&
                   columnPair.columnInfo.physicalDatatype !== '*';
          }).
          sort(function(a, b) {

            // TODO: Don't we want to sort by column human name?
            return a.fieldName > b.fieldName;
          });

        var sortedCards = cards.
          filter(function(card) {
            return card.fieldName !== '*';
          }).
          sort(function(a, b) {
            return a.fieldName > b.fieldName;
          });

        var available = false;
        var availableCardCount = sortedColumns.length;
        var availableColumns = [];
        var alreadyOnPageColumns = [];
        var visualizationUnsupportedColumns = [];

        _.forEach(sortedColumns, function(column) {

          if (column.defaultCardType === 'invalid') {
            visualizationUnsupportedColumns.push(column.fieldName);
          } else {
            availableColumns.push(column.fieldName);
          }
        });

        return {
          available: availableColumns.sort(),
          visualizationUnsupported: visualizationUnsupportedColumns.sort()
        };

      });

    var outerScope = $rootScope.$new();

    outerScope.page = pageModel;
    outerScope.$bindObservable('datasetColumns', datasetColumns);
    outerScope.dialogState = {
      'cardSize': 1,
      'show': true
    };

    var html =
      '<div ng-if="dialogState.show"> ' +
        '<add-card-dialog ' +
          'style="display:block" ' +
          'on-customize-card="customizeCard" ' +
          'dataset-columns="datasetColumns" ' +
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

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/columnAndVisualizationSelector.html'));
  beforeEach(module('/angular_templates/dataCards/visualizationTypeSelector.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('dataCards/cards.sass'));

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
          $templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
          $templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
          $templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
          $templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
          $templateCache.put('/angular_templates/dataCards/cardVisualizationSearch.html', '');
          $templateCache.put('/angular_templates/dataCards/cardVisualization.html', '');
          $templateCache.put('/angular_templates/dataCards/cardVisualizationInvalid.html', '');
          $templateCache.put('/angular_templates/dataCards/clearableInput.html', '');

          $httpBackend.whenGET(/\/api\/id\/rook-king.json.*/).respond([]);
          $httpBackend.whenGET(/\/resource\/rook-king.json.*/).respond([]);
          $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
      }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should close the modal dialog and not add a card when the "Cancel" button is clicked', function() {
    var dialog = createDialog();
    var button = dialog.element.find('button:contains("Cancel")');

    expect(dialog.element.is(':visible')).to.be.true;

    button.click();
    dialog.outerScope.$digest();

    expect(dialog.element.is(':visible')).to.be.false;
  });

  it('should show all columns as options in the "Choose a column..." select control', function() {
    // TODO refactor to merely check the data in the scope. columnAndVIsualizationSelectorTest
    // should handle testing the actual UI.
    var dialog = createDialog();
    var selectableColumnOptions = dialog.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(6);
  });

  it('should show columns currently represented as cards in the select control', function() {
    // TODO refactor to merely check the data in the scope. columnAndVIsualizationSelectorTest
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

    expect(selectableColumnOptions.length).to.equal(6);
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
        expect(button.hasClass('disabled')).to.be.true;
      });
    });

    describe('with an enabled column selected', function() {
      beforeEach(function() {
        dialog.scope.dialogState.cardSize = 1;
        dialog.element.find('option[value=spot]').prop('selected', true).trigger('change');
      });

      it('should be enabled', function() {
        expect(button.hasClass('disabled')).to.be.false;
      });

      describe('when clicked', function() {
        var addCardSpy;

        beforeEach(function() {
          addCardSpy = sinon.spy(dialog.scope.page, 'addCard');
          button.click();
        });

        it('should cause addCard() to be called on the page', function() {
          sinon.assert.calledOnce(addCardSpy);
          sinon.assert.calledWith(addCardSpy, dialog.scope.addCardModel);
        });
      });
    });
  });

});
