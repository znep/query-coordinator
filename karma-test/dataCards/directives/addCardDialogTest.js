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
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('dataCards/cards.sass'));

  var testHelpers;
  var Card;
  var Page;
  var Model;
  var $rootScope;
  var $controller;
  var AngularRxExtensions;
  var CardTypeMappingService;
  var $httpBackend;

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    Model = $injector.get('Model');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    CardTypeMappingService = $injector.get('CardTypeMappingService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $('#test-root').remove();
  });

  var columns = {
    spot: {
      name: 'spot',
      title: 'Spot where cool froods hang out.',
      description: '???',
      logicalDatatype: 'location',
      physicalDatatype: 'number',
      importance: 2,
      shapefile: 'mash-apes'
    },
    bar: {
      name: 'bar',
      title: 'A bar where cool froods hang out.',
      description: '???',
      logicalDatatype: 'amount',
      physicalDatatype: 'number'
    },
    ward: {
      name: 'ward',
      title: 'Ward where crime was committed.',
      description: 'Batman has bigger fish to fry sometimes, you know.',
      logicalDatatype: 'location',
      physicalDatatype: 'number',
      importance: 2,
      shapefile: 'mash-apes'
    }};

  function createDialog() {

    // Such higher-order!
    function alphaCompareOnProperty(property) {
      return function(a, b) {
        if (a[property] < b[property]) {
          return -1;
        }
        if (a[property] > b[property]) {
          return 1;
        }
        return 0;
      }
    }

    var datasetModel = new Model();
    datasetModel.id = 'rook-king';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', columns);

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('cards', []);

    var datasetColumns = Rx.Observable.combineLatest(
      pageModel.observe('dataset').observeOnLatest('columns'),
      pageModel.observe('cards'),
      function(columns, cards) {

        var datasetColumns = [];
        var hasAvailableCards = false;

        var sortedColumns = _.values(columns).
          filter(function(column) {
            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            return column.name.substring(0, 2).match(/\:[\_A-Za-z0-9]/) === null &&
                   column.physicalDatatype !== '*' &&
                   column.physicalDatatype !== 'point';
          }).
          sort(function(a, b) {
            return a.name > b.name;
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
            if (sortedColumns[i].name === sortedCards[j].fieldName) {
              available = false;
              availableCardCount--;
            }
          }

          sortedColumns[i].available = available;

          if (CardTypeMappingService.cardTypeForColumnIsSupported(sortedColumns[i])) {
            if (available) {
              availableColumns.push(sortedColumns[i]);
            } else {
              alreadyOnPageColumns.push(sortedColumns[i]);
            }
          } else {
            visualizationUnsupportedColumns.push(sortedColumns[i]);
          }

        }

        return {
          available: availableColumns.sort(alphaCompareOnProperty('title')),
          alreadyOnPage: alreadyOnPageColumns.sort(alphaCompareOnProperty('title')),
          visualizationUnsupporetd: visualizationUnsupportedColumns.sort(alphaCompareOnProperty('title'))
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
    outerScope.dialogState = {show: true};

    var html =
      '<div ng-if="dialogState.show"> ' +
        '<add-card-dialog ' +
          'style="display:block" ' +
          'card-models="cardModels" ' +
          'card-size="1" ' +
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

    var options = dialog.element.find('option:enabled');

    expect(options.length).to.equal(2);
  });

  it('should disable columns that are represented by cards in the "Choose a column..." select control', function() {
    var dialog = createDialog();

    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardCustomStyle: {},
      expandedCustomStyle: {},
      displayMode: 'visualization',
      expanded: false
    };
    dialog.scope.page.set('cards', [Card.deserialize(dialog.scope.page, serializedCard)]);

    var options = dialog.element.find('option:enabled');

    expect(options.length).to.equal(1);
  });

  it('should disable the "Add card" button when no column in the "Choose a column..." select control is selected', function() {
    var dialog = createDialog();

    var button = dialog.element.find('button:contains("Add card")')[0];

    expect($(button).hasClass('disabled')).to.be.true;
  });

  it('should enable the "Add card" button when an enabled column in the "Choose a column..." select control is selected', function() {
    var dialog = createDialog();

    dialog.scope.addCardCardSize = 1;
    $httpBackend.expectGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.expectGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    dialog.element.find('option[value=spot]').prop('selected', true).trigger('change');

    var button = dialog.element.find('button:contains("Add card")')[0];

    expect($(button).hasClass('disabled')).to.be.false;
  });

  it('should display a sample card visualization when an enabled column in the "Choose a column..." select control is selected', function() {
    var dialog = createDialog();

    expect(dialog.element.find('card').length).to.equal(0);

    dialog.scope.addCardCardSize = 2;
    $httpBackend.expectGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.expectGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    dialog.element.find('option[value=ward]').prop('selected', true).trigger('change');

    expect(dialog.element.find('card').length).to.equal(1);
  });

  it('should add a card in the correct CardSize group when an enabled column in the "Choose a column..." select control is selected and the "Add card" button is clicked', function() {
    var dialog = createDialog();

    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardCustomStyle: {},
      expandedCustomStyle: {},
      displayMode: 'visualization',
      expanded: false
    };
    dialog.scope.page.set('cards', [Card.deserialize(dialog.scope.page, serializedCard)]);

    dialog.scope.addCardCardSize = 2;
    $httpBackend.expectGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.expectGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    dialog.element.find('option[value=ward]').prop('selected', true).trigger('change');

    dialog.scope.addCard();

    expect(dialog.scope.cardModels[0].fieldName).to.equal('spot');
    expect(dialog.scope.cardModels[1].fieldName).to.equal('ward');
  });

  it('displays a "customize" button for choropleths that calls the customize function', function() {
    var dialog = createDialog();

    var customizeButton = dialog.element.find('.card-control[title^="Customize"]');
    expect(customizeButton.length).to.equal(0); // should only appear for choropleths

    $httpBackend.expectGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.expectGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    dialog.element.find('select>option[value="bar"]').prop('selected', true).trigger('change');

    customizeButton = dialog.element.find('.card-control[title^="Customize"]');
    expect(customizeButton.length).to.equal(0); // should only appear for choropleths

    // Now select the choropleth
    $httpBackend.expectGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.expectGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    dialog.element.find('select>option[value="ward"]').prop('selected', true).trigger('change');

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
