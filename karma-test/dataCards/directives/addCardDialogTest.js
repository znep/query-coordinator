describe('addCardDialog', function() {
  'use strict';

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  // TODO: mock out these directives to make this more unit-testy
  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationFeatureMap.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualization.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationInvalid.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/featureMap.html'));
  beforeEach(module('dataCards/cards.sass'));

  var testHelpers;
  var CardV1;
  var Page;
  var Model;
  var $rootScope;
  var $controller;
  var AngularRxExtensions;
  var CardTypeMapping;
  var $httpBackend;

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    CardV1 = $injector.get('CardV1');
    Page = $injector.get('Page');
    Model = $injector.get('Model');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    CardTypeMapping = $injector.get('CardTypeMapping');
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.whenGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/rook-king.json.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function createDialog() {
    var datasetModel = new Model();

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
        'dataset': datasetModel
      },
      'bar': {
        'name': 'A bar where cool froods hang out.',
        'description': '???',
        'fred': 'amount',
        'physicalDatatype': 'number',
        'dataset': datasetModel
      },
      'point': {
        'name': 'Points where crimes have been committed.',
        'description': 'Points.',
        'fred': 'location',
        'physicalDatatype': 'point',
        'dataset': datasetModel
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
        'dataset': datasetModel
      },
      'multipleVisualizations': {
        'name': 'A card for which multiple visualizations are possible.',
        'description': '???',
        'fred': 'text',
        'physicalDatatype': 'text',
        'cardinality': 2000,
        'dataset': datasetModel
      }
    };

    datasetModel.id = 'rook-king';
    datasetModel.version = '1';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', columns);

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('primaryAmountField', null);
    pageModel.set('primaryAggregation', null);
    pageModel.set('cards', []);

    // NOTE: This is straight up copied from CardsViewController.
    var datasetColumns = Rx.Observable.combineLatest(
      pageModel.observe('dataset'),
      pageModel.observe('dataset.columns'),
      pageModel.observe('cards'),
      function(dataset, columns, cards) {

        var datasetColumns = [];
        var hasAvailableCards = false;

        var sortedColumns = _.pairs(columns).
          map(function(columnPair) {
            return { fieldName: columnPair[0], column: columnPair[1] };
          }).
          filter(function(columnPair) {
            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            var matchesSystemColumnsButNotComputed = /\:[\_A-Za-z0-9]/;
            return columnPair.fieldName.substring(0, 2).match(matchesSystemColumnsButNotComputed) === null &&
                   columnPair.column.physicalDatatype !== '*';
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

        var i = 0;
        var j = 0;
        var available = false;
        var availableCardCount = sortedColumns.length;
        var availableColumns = [];
        var alreadyOnPageColumns = [];
        var visualizationUnsupportedColumns = [];

        for (i = 0; i < sortedColumns.length; i++) {

          available = true;

          for (j = 0; j < sortedCards.length; j++) {
            if (sortedColumns[i].fieldName === sortedCards[j].fieldName) {
              available = false;
              availableCardCount--;
            }
          }

          sortedColumns[i].available = available;

          if (CardTypeMapping.visualizationSupportedForColumn(dataset, sortedColumns[i].fieldName)) {
            if (available) {
              availableColumns.push(sortedColumns[i].fieldName);
            } else {
              alreadyOnPageColumns.push(sortedColumns[i].fieldName);
            }
          } else {
            visualizationUnsupportedColumns.push(sortedColumns[i].fieldName);
          }

        }

        return {
          available: availableColumns.sort(),
          alreadyOnPage: alreadyOnPageColumns.sort(),
          visualizationUnsupported: visualizationUnsupportedColumns.sort()
        };

      });

    var outerScope = $rootScope.$new();

    AngularRxExtensions.install(outerScope);

    outerScope.page = pageModel;
    outerScope.bindObservable('cardModels', pageModel.observe('cards'));
    outerScope.bindObservable('datasetColumns', datasetColumns);
    outerScope.customizeCard = function(card) {
      outerScope._test_cardToCustomize = card;
    };
    outerScope.dialogState = {
      'cardSize': 1,
      'show': true
    };

    var html =
      '<div ng-if="dialogState.show"> ' +
        '<add-card-dialog ' +
          'style="display:block" ' +
          'card-models="cardModels" ' +
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

  it('should close the modal dialog and not add a card when the "Cancel" button is clicked', function() {
    var dialog = createDialog();

    expect(dialog.element.is(':visible')).to.be.true;

    var button = dialog.element.find('button:contains("Cancel")');

    button.click();

    dialog.outerScope.$digest();

    expect(dialog.element.is(':visible')).to.be.false;
  });

  it('should show all columns as options in the "Choose a column..." select control', function() {
    var dialog = createDialog();

    var selectableColumnOptions = dialog.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(4);
  });

  it('should disable columns that are represented by cards in the "Choose a column..." select control', function() {
    var dialog = createDialog();

    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardType: 'column',
      expanded: false
    };
    dialog.scope.page.set('cards', [CardV1.deserialize(dialog.scope.page, serializedCard)]);

    var selectableColumnOptions = dialog.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(3);
  });

  it('should disable the "Add card" button when no column in the "Choose a column..." select control is selected', function() {
    var dialog = createDialog();

    var button = dialog.element.find('button:contains("Add card")')[0];

    expect($(button).hasClass('disabled')).to.be.true;
  });

  it('should enable the "Add card" button when an enabled column in the "Choose a column..." select control is selected', function() {
    var dialog = createDialog();

    dialog.scope.dialogState.cardSize = 1;

    dialog.element.find('option[value=spot]').prop('selected', true).trigger('change');

    var button = dialog.element.find('button:contains("Add card")')[0];

    expect($(button).hasClass('disabled')).to.be.false;
  });

  it('should display a sample card visualization when an enabled column in the "Choose a column..." select control is selected', function() {
    var dialog = createDialog();

    expect(dialog.element.find('card').length).to.equal(0);

    dialog.scope.dialogState.cardSize = 2;

    dialog.element.find('option[value=ward]').prop('selected', true).trigger('change');

    expect(dialog.element.find('card').length).to.equal(1);
  });

  it('should display multiple visualization choices when a column in the "Choose a column..." select control is selected which allows multiple visualizations', function() {
    var dialog = createDialog();

    expect(dialog.element.find('.add-card-type-option:visible').length).to.equal(0);

    dialog.scope.dialogState.cardSize = 2;

    dialog.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');

    expect(dialog.element.find('.add-card-type-option:visible').length).to.equal(2);
    expect(dialog.element.find('.add-card-type-option.icon-bar-chart').length).to.equal(1);
    expect(dialog.element.find('.add-card-type-option.icon-search').length).to.equal(1);
  });

  it("should display a warning for 'column' card type option buttons when a column's cardinality is greater than 100", function() {
    var dialog = createDialog();

    expect(dialog.element.find('.add-card-type-option:visible').length).to.equal(0);

    dialog.scope.dialogState.cardSize = 2;

    dialog.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');

    expect(dialog.element.find('.add-card-type-option:visible').length).to.equal(2);

    expect(dialog.element.find('.icon-bar-chart > .warning-icon:visible').length).to.equal(1);

  });

  it('should change the visualization type of the preview card when a card type option button is clicked', function() {
    var dialog = createDialog();

    expect(dialog.element.find('.add-card-type-option:visible').length).to.equal(0);

    dialog.scope.dialogState.cardSize = 2;

    dialog.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');

    expect(dialog.element.find('.add-card-type-option:visible').length).to.equal(2);
    expect(dialog.scope.addCardModel.getCurrentValue('cardType')).to.equal('search');

    dialog.element.find('.icon-bar-chart').click();
    dialog.scope.$digest();

    expect(dialog.scope.addCardModel.getCurrentValue('cardType')).to.equal('column');
  });

  it('should add a card in the correct CardSize group when an enabled column in the "Choose a column..." select control is selected and the "Add card" button is clicked', function() {
    var dialog = createDialog();

    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardType: 'column',
      expanded: false
    };

    dialog.scope.page.set('cards', [CardV1.deserialize(dialog.scope.page, serializedCard)]);

    dialog.scope.dialogState.cardSize = 2;
    dialog.element.find('option[value=ward]').prop('selected', true).trigger('change');

    dialog.scope.addCard();

    expect(dialog.scope.cardModels[0].fieldName).to.equal('spot');
    expect(dialog.scope.cardModels[1].fieldName).to.equal('ward');
  });

  it('should display a "customize" button for choropleths that calls the customize function', function() {
    var dialog = createDialog();

    var customizeButton = dialog.element.find('.card-control[title^="Customize"]');
    expect(customizeButton.length).to.equal(0); // should only appear for choropleths

    dialog.element.find('select > option[value="bar"]').prop('selected', true).trigger('change');

    customizeButton = dialog.element.find('.card-control[title^="Customize"]');
    expect(customizeButton.length).to.equal(0); // should only appear for choropleths

    // Now select the choropleth
    dialog.element.find('select > option[value="ward"]').prop('selected', true).trigger('change');


    customizeButton = dialog.element.find('.card-control[title^="Customize"]');
    expect(customizeButton.length).to.equal(1);

    /* Technically, there should be a flyout here. But since we're using the same mechanism to give
     * this button a flyout, as we are for the other card-controls in a card-layout, the flyout is
     * only registered in the card-layout code. So just test to make sure the conditions are met for
     * the card-layout-registered flyout to work.
     */
    expect(customizeButton.hasClass('card-control')).to.be.true;
    expect(customizeButton.prop('title')).to.match(/customize this card/i);

    // We've stubbed the customize function to set this variable
    expect(dialog.outerScope._test_cardToCustomize).to.not.be.ok;

    customizeButton.click();

    expect(dialog.outerScope._test_cardToCustomize).to.be.ok;
  });
});
