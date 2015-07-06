describe('Customize card dialog', function() {

  'use strict';

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('/angular_templates/dataCards/customizeCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/visualizationTypeSelector.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualization.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));

  var Card;
  var Constants;
  var Model;
  var Page;
  var Mockumentary;
  var ServerConfig;
  var $httpBackend;
  var $rootScope;
  var $templateCache;
  var testHelpers;
  var _$provide;

  beforeEach(function() {
    module(function($provide) {
      _$provide = $provide;
    });
  });

  beforeEach(inject(function($injector) {
    Card = $injector.get('Card');
    Constants = $injector.get('Constants');
    Model = $injector.get('Model');
    Page = $injector.get('Page');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $templateCache = $injector.get('$templateCache');
    testHelpers = $injector.get('testHelpers');

    // We don't actually care about the contents of this
    $templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationFeatureMap.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationHistogram.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationInvalid.html', '');

    $httpBackend.whenGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/rook-king.json.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    $httpBackend.whenGET(/\/metadata\/v1\/dataset\/mash-apes.json.*/).respond([]);

    testHelpers.mockDirective(_$provide, 'suggestionToolPanel');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  /**
   * Create a customize-card-dialog element.
   *
   * @param {Object=} options A hash of options:
   * @property {boolean=false} preexisting Whether or not the card added is a pre-existing card.
   */
  function createDialog(options) {
    options = options || {};

    var columns = {
      choropleth: {
        name: 'Spot where cool froods hang out.',
        description: '???',
        fred: 'location',
        physicalDatatype: 'number',
        computationStrategy: {
          parameters: {
            region: '_mash-apes'
          }
        },
        availableCardTypes: ['choropleth'],
        defaultCardType: 'choropleth'
      },
      feature: {
        name: 'Froods who really know where their towels are.',
        description: '???',
        fred: 'location',
        physicalDatatype: 'point',
        availableCardTypes: ['feature'],
        defaultCardType: 'feature'
      },
      many_kinds: {
        name: 'A column suffering an identity crisis.',
        description: '???',
        fred: 'amount',
        physicalDatatype: 'number',
        availableCardTypes: ['feature', 'choropleth', 'column', 'histogram', 'search'],
        defaultCardType: 'search'
      },
      bar: {
        name: 'A bar where cool froods hang out.',
        description: '???',
        fred: 'amount',
        physicalDatatype: 'number',
        availableCardTypes: ['column', 'search'],
        defaultCardType: 'column'
      },
      high_cardinality: {
        name: 'A bar where cool froods hang out.',
        description: '???',
        fred: 'amount',
        physicalDatatype: 'number',
        availableCardTypes: ['column', 'search'],
        defaultCardType: 'column',
        cardinality: 1000
      }
    };

    var card = options.card || {
      fieldName: 'choropleth',
      cardSize: 2,
      cardType: 'choropleth',
      expanded: false
    };

    var cards = options.cards || [];

    var pageOverrides = {cards: cards};
    var datasetOverrides = {id: 'rook-king', rowDisplayUnit: 'row', columns: columns};
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);
    var outerScope = $rootScope.$new();

    outerScope.page = pageModel;

    outerScope.dialogState = {
      'cardModel': Card.deserialize(pageModel, card),
      'show': true
    };
    outerScope.cardModel = Card.deserialize(pageModel, card);

    if (options.preexisting) {
      cards.push(outerScope.cardModel);
    }

    var html = [
      '<div ng-if="dialogState.show"> ',
        '<customize-card-dialog ',
          'dialog-state="dialogState" ',
          'page="page" ',
        '></customize-card-dialog>',
      '</div>'].join('');

    // Stub out debounce so we can test synchronously
    sinon.stub(_, 'debounce', function(f) { return f; });
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
    _.debounce.restore();

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

  it('should display a card preview', function() {
    var dialog = createDialog();

    expect(dialog.element.find('card').length).to.equal(1);
    expect(dialog.element.find('card div').scope().model).to.not.equal(undefined);
    expect(dialog.element.find('card div').scope().model.fieldName).to.equal(dialog.outerScope.cardModel.fieldName);
    expect(dialog.element.find('option:contains("Standard")').length).to.equal(1);
  });

  // CORE-5814: Verify that the card height is not manually set for customizeCardDialog
  it('should not set the height of the card element', function() {
    var dialog = createDialog();
    var card = dialog.element.find('card');
    var styles = $(card).attr('style') || '';
    expect(styles.indexOf('height')).to.equal(-1);
  });

  it('should display visualization choices when more than one type is available', function() {
    var dialog = createDialog({
      card: {
        fieldName: 'bar',
        cardSize: 2,
        cardType: 'column',
        expanded: false
      }
    });
    var visualizationOptions = dialog.element.find('visualization-type-selector');
    expect(visualizationOptions.find('button.icon-search').is(':visible')).to.be.true;
    expect(visualizationOptions.find('button.icon-bar-chart').is(':visible')).to.be.true;
  });

  it('should not display visualization choices when only one type is available', function() {
    var dialog = createDialog({
      card: {
        fieldName: 'feature',
        cardSize: 2,
        cardType: 'feature',
        expanded: false
      }
    });
    var visualizationOptions = dialog.element.find('visualization-type-selector');
    expect(visualizationOptions).to.be.hidden;
  });

  // Wrapping of visualization icons and their labels should be tested in an end to end
  // test, rather than a unit test. Icons should be 3 per row, and icon labels should not overlap.

  it('should show a warning on suboptimal visualization icons (will include icon and flyout)', function() {
    var dialog = createDialog({
      card: {
        fieldName: 'high_cardinality',
        cardSize: 2,
        cardType: 'column',
        expanded: false
      }
    });
    var visualizationOptions = dialog.element.find('visualization-type-selector');
    expect(visualizationOptions.isolateScope().showCardinalityWarning).to.equal(true);
  });

  it('should select the currently selected visualization type when the dialog is displayed', function() {
    var dialog = createDialog({
      card: {
        fieldName: 'bar',
        cardSize: 2,
        cardType: 'search',
        expanded: false
      }
    });
    var card = dialog.scope.customizedCard;

    expect(card.getCurrentValue('cardType')).to.equal('search');
  });

  it('should update the given model when clicking "Done"', function() {
    var dialog = createDialog();
    var page = dialog.outerScope.page;
    var card = dialog.scope.customizedCard;

    var esri = dialog.element.find('option:contains("Esri")');
    esri.prop('selected', true).change();
    dialog.scope.$digest();

    dialog.element.find('button:contains("Done")').click();

    expect(card.getCurrentValue('baseLayerUrl')).to.equal(Constants.ESRI_BASE_URL);
  });

  it('should discard card changes when clicking "Cancel"', function() {
    var dialog = createDialog();
    var page = dialog.outerScope.page;
    var card = dialog.scope.dialogState.cardModel;

    var esri = dialog.element.find('option:contains("Esri")');
    esri.prop('selected', true).change();
    dialog.scope.$digest();

    dialog.element.find('button:contains("Cancel")').click();

    expect(card.getCurrentValue('baseLayerUrl')).to.equal(undefined);
  });

  it('should load the customized url on open, if it\'s set', function() {
    var url = 'http://www.socrata.com/{x}/{y}/{z}';

    var options = {
      'card': {
        fieldName: 'choropleth',
        cardSize: 2,
        cardType: 'choropleth',
        baseLayerUrl: url,
        expanded: false
      }
    };

    var dialog = createDialog(options);
    expect(dialog.element.find('option:contains("Custom")').is(':selected')).to.equal(true);
    expect(dialog.element.find('input[name=customLayerUrl]').val()).to.equal(url);
  });

  describe('map-specific settings', function() {
    it('should provide baselayer options that change the choropleth baseLayerUrl', function() {
      var dialog = createDialog();
      var cardModel = dialog.scope.customizedCard;

      var standard = dialog.element.find('option:contains("Standard")');
      var esri = dialog.element.find('option:contains("Esri")');
      var custom = dialog.element.find('option:contains("Custom")');

      expect(standard.length).to.equal(1);
      expect(esri.length).to.equal(1);
      expect(custom.length).to.equal(1);

      // Assert the default is right
      expect(standard.is(':selected')).to.be.true;
      expect(esri.is(':selected')).to.be.false;

      // Select the Esri
      esri.prop('selected', true).change();
      dialog.scope.$digest();

      expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.ESRI_BASE_URL);

      // Select Standard
      standard.prop('selected', true).change();
      dialog.scope.$digest();

      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Select Custom
      var input = dialog.element.find('input[name=customLayerUrl]')
      expect(input.is(':visible')).to.equal(false);

      custom.prop('selected', true).change();
      dialog.scope.$digest();

      expect(input.is(':visible')).to.equal(true);
      // Shouldn't change the baseLayerUrl yet
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Shouldn't change the baseLayerUrl when given a non-url
      input.val('foobar').trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Shouldn't change the baseLayerUrl when given a url without {x}, {y}, {z}
      input.val('http://www.google.com/').trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Should change the baseLayerUrl when given a url with {x}, {y}, {z}
      input.val('http://www.socrata.com/{x}/{y}/{z}').trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal('http://www.socrata.com/{x}/{y}/{z}');
    });

    it('should provide baselayer options that change the feature map baseLayerUrl', function() {
      var options = {
        'card': {
          fieldName: 'feature',
          cardSize: 1,
          cardType: 'feature',
          expanded: false
        }
      };

      var dialog = createDialog(options);

      var cardModel = dialog.scope.customizedCard;

      var standard = dialog.element.find('option:contains("Standard")');
      var esri = dialog.element.find('option:contains("Esri")');
      var custom = dialog.element.find('option:contains("Custom")');

      expect(standard.length).to.equal(1);
      expect(esri.length).to.equal(1);
      expect(custom.length).to.equal(1);

      // Assert the default is right
      expect(standard.is(':selected')).to.be.true;
      expect(esri.is(':selected')).to.be.false;

      // Select the Esri
      esri.prop('selected', true).change();
      dialog.scope.$digest();

      expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.ESRI_BASE_URL);

      // Select Standard
      standard.prop('selected', true).change();
      dialog.scope.$digest();

      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Select Custom
      var input = dialog.element.find('input[name=customLayerUrl]')
      expect(input.is(':visible')).to.equal(false);

      custom.prop('selected', true).change();
      dialog.scope.$digest();

      expect(input.is(':visible')).to.equal(true);
      // Shouldn't change the baseLayerUrl yet
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Shouldn't change the baseLayerUrl when given a non-url
      input.val('foobar').trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Shouldn't change the baseLayerUrl when given a url without {x}, {y}, {z}
      input.val('http://www.google.com/').trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.undefined;

      // Should change the baseLayerUrl when given a url with {x}, {y}, {z}
      input.val('http://www.socrata.com/{x}/{y}/{z}').trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal('http://www.socrata.com/{x}/{y}/{z}');
    });

    it('should set back to custom baselayer when coming back to customize', function() {
      var dialog = createDialog();
      var card = dialog.scope.customizedCard;
      var custom = dialog.element.find('option:contains("Custom")');
      var customInput = dialog.element.find('input[name=customLayerUrl]');
      var standard = dialog.element.find('option:contains("Standard")');

      // Set a custom url
      var url = 'http://www.socrata.com/{x}/{y}/{z}';
      custom.prop('selected', true).change();
      expect(customInput.is(':visible')).to.equal(true);
      customInput.val(url).trigger('input').trigger('change');
      dialog.scope.$digest();
      expect(card.getCurrentValue('baseLayerUrl')).to.equal(url);

      // Now go back to the standard
      standard.prop('selected', true).change();
      expect(card.getCurrentValue('baseLayerUrl')).to.equal(undefined);

      // Now back to custom
      custom.prop('selected', true).change();
      // It should set the base layer back to the custom url from before
      expect(card.getCurrentValue('baseLayerUrl')).to.equal(url);
    });
  });
});
