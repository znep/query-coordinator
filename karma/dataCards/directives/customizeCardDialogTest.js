describe('Customize card dialog', function() {
  'use strict';

  var Card;
  var Constants;
  var I18n;
  var Model;
  var Page;
  var ViewRights;
  var Mockumentary;
  var ServerConfig;
  var $httpBackend;
  var $rootScope;
  var $templateCache;
  var testHelpers;
  var _$provide;
  var $timeout;
  var CardDataService;
  var $q;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      _$provide = $provide;
    });
  });

  beforeEach(inject(function($injector) {
    Card = $injector.get('Card');
    Constants = $injector.get('Constants');
    I18n = $injector.get('I18n');
    Model = $injector.get('Model');
    Page = $injector.get('Page');
    ViewRights = $injector.get('ViewRights');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $templateCache = $injector.get('$templateCache');
    testHelpers = $injector.get('testHelpers');
    $timeout = $injector.get('$timeout');
    CardDataService = $injector.get('CardDataService');
    $q = $injector.get('$q');

    // We don't actually care about the contents of this
    $templateCache.put('/angular_templates/dataCards/choropleth.html', '');
    $templateCache.put('/angular_templates/dataCards/columnChart.html', '');
    $templateCache.put('/angular_templates/dataCards/distributionChart.html', '');
    $templateCache.put('/angular_templates/dataCards/featureMap.html', '');
    $templateCache.put('/angular_templates/dataCards/histogram.html', '');
    $templateCache.put('/angular_templates/dataCards/invalidCard.html', '');
    $templateCache.put('/angular_templates/dataCards/searchCard.html', '');
    $templateCache.put('/angular_templates/dataCards/tableCard.html', '');
    $templateCache.put('/angular_templates/dataCards/timelineChart.html', '');

    $httpBackend.whenGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/rook-king.json.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    $httpBackend.whenGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    $httpBackend.whenGET(/\/metadata\/v1\/dataset\/mash-apes.json.*/).respond([]);
    $httpBackend.whenGET(/\/api\/curated_regions.*/).respond([]);

    testHelpers.mockDirective(_$provide, 'suggestionToolPanel');
    testHelpers.mockDirective(_$provide, 'choropleth');
    testHelpers.mockDirective(_$provide, 'columnChart');
    testHelpers.mockDirective(_$provide, 'featureMap');
    testHelpers.mockDirective(_$provide, 'histogram');
    testHelpers.mockDirective(_$provide, 'searchCard');
    testHelpers.mockDirective(_$provide, 'timelineChart');
  }));

  beforeEach(function() {
    sinon.stub(_, 'debounce', function(f) { return f; });
  })

  afterEach(function() {
    testHelpers.TestDom.clear();
    _.debounce.restore();
  });

  var COLUMNS = {
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
      defaultCardType: 'feature',
      computedColumn: 'choropleth'
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
    },
    ':@computedColumn': {
      name: 'Computed Column',
      fred: 'number',
      physicalDatatype: 'number',
      availableCardTypes: ['choropleth'],
      defaultCardType: 'choropleth',
      computationStrategy: {
        parameters: {
          region: '_rook-king',
          geometryLabel: 'You can\'t label me'
        }
      }
    },
    ':system_column': {
      name: 'System Column to Exclude',
      fred: 'amount',
      physicalDatatype: 'number',
      availableCardTypes: ['column', 'histogram'],
      defaultCardType: 'column'
    },
    sub_column: {
      name: 'Subcolumn to Exclude',
      fred: 'amount',
      physicalDatatype: 'number',
      availableCardTypes: ['column', 'histogram'],
      defaultCardType: 'column',
      isSubcolumn: true
    }
  };

  /**
   * Create a customize-card-dialog element.
   *
   * @param {Object=} options A hash of options:
   * @property {boolean=false} preexisting Whether or not the card added is a pre-existing card.
   */
  function createDialog(options) {
    options = options || {};

    var card = options.card || {
      fieldName: 'choropleth',
      cardSize: 2,
      cardType: 'choropleth',
      expanded: false,
      computedColumn: 'choropleth'
    };

    var cards = options.cards || [];

    var pageOverrides = _.merge(
      {cards: cards},
      options.pageOverrides
    );
    var datasetOverrides = _.extend({
      id: 'rook-king',
      rowDisplayUnit: 'row',
      columns: COLUMNS,
      permissions: { rights: [ViewRights.WRITE] }
    }, options.datasetOverrides);

    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);
    var outerScope = $rootScope.$new();

    outerScope.page = pageModel;

    var deserializedCard = Card.deserialize(pageModel, card);

    if (options.cardOptions) {
      var keys = _.keys(options.cardOptions);
      keys.forEach(function(key) {
        deserializedCard.setOption(key, options.cardOptions[key]);
      });
    }

    outerScope.dialogState = {
      'cardModel': deserializedCard,
      'show': true
    };
    outerScope.cardModel = deserializedCard;

    if (options.preexisting) {
      cards.push(outerScope.cardModel);
    }

    var html = [
      '<div ng-if="dialogState.show"> ',
        '<customize-card-dialog ',
          'dialog-state="dialogState" ',
          'page="page" ',
        '></customize-card-dialog>',
      '</div>'
    ].join('');

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

  describe('basic dialog behavior', function() {
    var dialog;
    var page;
    var $card;
    var originalModel;
    var customizedModel;

    beforeEach(function() {
      dialog = createDialog();
      page = dialog.outerScope.page;
      originalModel = dialog.outerScope.cardModel;
      customizedModel = dialog.scope.customizedCard;
      $card = dialog.element.find('card');
    });

    it('should display a card preview', function() {
      expect($card.length).to.equal(1);
      expect(customizedModel).to.not.be.undefined;
      expect(customizedModel.fieldName).to.equal(originalModel.fieldName);
      expect(dialog.element.find('option:contains("Simple Grey")').length).to.equal(1);
    });

    it('should set humanReadableColumnName to the name of the column', function() {
      expect(dialog.scope.humanReadableColumnName).to.equal(COLUMNS.choropleth.name);
    });

    // CORE-5814: Verify that the card height is not manually set for customizeCardDialog
    it('should not set the height of the card element', function() {
      var styles = $card.attr('style') || '';

      expect(styles.indexOf('height')).to.equal(-1);
    });

    it('should update the given model when clicking "Done"', function() {
      var esri = dialog.element.find('option:contains("Esri")');
      var doneButton = dialog.element.find('button:contains("Done")');

      esri.prop('selected', true).change();
      dialog.scope.$digest();
      doneButton.click();

      expect(customizedModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.ESRI_BASE_LAYER_URL);
    });

    it('should discard card changes when clicking "Cancel"', function() {
      var esri = dialog.element.find('option:contains("Esri")');
      var cancelButton = dialog.element.find('button:contains("Cancel")');

      esri.prop('selected', true).change();
      dialog.scope.$digest();
      cancelButton.click();

      expect(originalModel.getCurrentValue('baseLayerUrl')).to.be.undefined;
    });
  });

  describe('visualization type selection', function() {
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

    it('should show a warning for a high cardinality bar chart', function() {
      var dialog = createDialog({
        card: {
          fieldName: 'high_cardinality',
          cardSize: 2,
          cardType: 'column',
          expanded: false
        }
      });

      var visualizationOptions = dialog.element.find('visualization-type-selector');
      var iconBarChart = dialog.element.find('.icon-bar-chart');

      expect(visualizationOptions.isolateScope().showCardinalityWarning).to.be.true;
      expect(iconBarChart.find('.icon-warning')).to.not.have.css('display', 'none');
    });

    it('should not show a warning for a histogram with no filter when bucket type is changed', function() {
      var dialog = createDialog({
        card: {
          fieldName: 'histogram',
          cardSize: 2,
          cardType: 'histogram',
          expanded: false
        }
      });
      var scope = dialog.scope;
      var bucketTypeDropdown = dialog.element.find('configure-histogram-bucket-type .dropdown-container');

      expect(scope.showBucketTypeWarning).to.be.false;
      expect(bucketTypeDropdown.hasClass('warning-dropdown')).to.be.false
    });

    it('should show a warning for a histogram with a filter when bucket type is changed', inject(function(Filter) {
      var dialog = createDialog({
        card: {
          activeFilters: [new Filter.ValueRangeFilter(0, 1).serialize()],
          bucketType: 'logarithmic',
          fieldName: 'histogram',
          cardSize: 2,
          cardType: 'histogram',
          expanded: false
        }
      });
      var scope = dialog.scope;
      var bucketTypeDropdown = dialog.element.find('configure-histogram-bucket-type .dropdown-container');
      var linear = dialog.element.find('option:contains("Linear")');

      expect(scope.customizedCard.getCurrentValue('activeFilters')).to.not.be.empty;
      expect(scope.showBucketTypeWarning).to.be.false;

      // Select linear
      linear.prop('selected', true).change();
      scope.$digest();

      // A histogram filter has been cleared, and thus the warning should appear.
      expect(scope.customizedCard.getCurrentValue('activeFilters')).to.be.empty;
      expect(scope.showBucketTypeWarning).to.be.true;
    }));

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

    describe('shouldShowAggregationSelector scope variable', function() {
      it('should not show cardAggregationSelector if feature flag is disabled', function() {
        ServerConfig.override('enableDataLensCardLevelAggregation', false);
        var dialog = createDialog();

        expect(dialog.element.find('card-aggregation-selector')).to.not.exist;
      });

      describe('when enable_data_lens_card_level_aggregation feature flag is enabled', function() {
        beforeEach(function() {
          ServerConfig.override('enableDataLensCardLevelAggregation', true);
        });

        it('should not show cardAggregationSelector when version is less than 4', function() {
          var dialog = createDialog({pageOverrides: {version: 3}});

          expect(dialog.element.find('card-aggregation-selector')).to.not.exist;
        });

        it('should not show cardAggregationSelector when card type is blacklisted', function() {
          var card = {
            fieldName: 'search',
            cardSize: 2,
            cardType: 'search',
            expanded: false
          }
          var dialog = createDialog({card: card});

          expect(dialog.element.find('card-aggregation-selector')).to.not.exist;
        });

        it('should show cardAggregationSelector if feature flag is enabled', function() {
          var dialog = createDialog();

          expect(dialog.element.find('card-aggregation-selector')).to.exist;
        });
      });
    });
  });

  describe('histogram bucketing settings', function() {
    var options = {
      'card': {
        fieldName: 'histogram',
        cardSize: 2,
        cardType: 'histogram',
        expanded: false
      }
    };

    it('should not appear when the card type is not a histogram', function() {
      var dialog = createDialog();
      var histogramConfigurationElement = dialog.element.find('.configure-histogram-bucket-type:visible');
      var cardType = dialog.scope.customizedCard.getCurrentValue('cardType');

      expect(cardType).to.not.equal('histogram');
      expect(histogramConfigurationElement.length).to.equal(0);
    });

    it('should appear when the card type is a histogram', function() {
      var dialog = createDialog(options);
      var histogramConfigurationElement = dialog.element.find('.configure-histogram-bucket-type:visible');
      var cardType = dialog.scope.customizedCard.getCurrentValue('cardType');

      expect(cardType).to.equal('histogram');
      expect(histogramConfigurationElement.length).to.equal(1);
    });

    it('should have a default option of undefined if none is defined', function() {
      var dialog = createDialog(options);
      var scope = dialog.scope;

      expect(scope.histogramBucketOption).to.equal(undefined);
    });

    it('should have a default option of linear if linear is defined', function() {
      options.card.bucketType = 'linear';

      var dialog = createDialog(options);
      var scope = dialog.scope;

      expect(scope.histogramBucketOption).to.equal('linear');
    });

    it('should toggle on change of the dropdown', function() {
      options.card.bucketType = 'logarithmic';

      var dialog = createDialog(options);
      var scope = dialog.scope;

      var logarithmic = dialog.element.find('option:contains("Logarithmic")');
      var linear = dialog.element.find('option:contains("Linear")');
      var histogramBucketHelpText = dialog.element.find('.option-help-text');

      // Expect elements to exist
      expect(logarithmic.length).to.equal(1);
      expect(linear.length).to.equal(1);
      expect(histogramBucketHelpText.length).to.equal(1);

      // Expect default values
      expect(scope.histogramBucketOption).to.equal('logarithmic');
      expect(logarithmic.is(':selected')).to.be.true;
      expect(linear.is(':selected')).to.be.false;
      expect(histogramBucketHelpText.text()).to.equal(
        I18n.customizeCardDialog.histogramBucketType.logarithmicDesc
      );

      // Select linear
      linear.prop('selected', true).change();
      scope.$digest();

      expect(scope.histogramBucketOption).to.equal('linear');
      expect(histogramBucketHelpText.text()).to.equal(
        I18n.customizeCardDialog.histogramBucketType.linearDesc
      );

      // Select logarithmic
      logarithmic.prop('selected', true).change();
      scope.$digest();

      expect(scope.histogramBucketOption).to.equal('logarithmic');
      expect(histogramBucketHelpText.text()).to.equal(
        I18n.customizeCardDialog.histogramBucketType.logarithmicDesc
      );
    });

    it('should throw an error if one tries to manually force a non-existent bucket type', function() {
      options.card.bucketType = 'logarithmic';

      var dialog = createDialog(options);
      var scope = dialog.scope;

      var logarithmic = dialog.element.find('option:contains("Logarithmic")');
      var linear = dialog.element.find('option:contains("Linear")');
      var badBucketType = 'badBucketType';

      linear.val(badBucketType);
      expect(function() {
        linear.prop('selected', true).change();
        scope.$digest();
      }).to.throw('Unknown bucket type: {0}'.format(badBucketType));
    });

    it('should clear the filter on a histogram when changing bucket type', inject(function(Filter) {
      options.card.bucketType = 'logarithmic';
      options.card.activeFilters = [new Filter.ValueRangeFilter(0, 1).serialize()];

      var dialog = createDialog(options);
      var scope = dialog.scope;

      var linear = dialog.element.find('option:contains("Linear")');

      // Active filters is not empty
      expect(scope.customizedCard.getCurrentValue('activeFilters')).to.not.be.empty;

      // Change bucket type
      linear.prop('selected', true).change();
      scope.$digest();

      // Now active filters are empty
      expect(scope.customizedCard.getCurrentValue('activeFilters')).to.be.empty;
    }));

    it('should reapply the filter if the bucket type is toggled', inject(function(Filter) {
      options.card.bucketType = 'logarithmic';
      options.card.activeFilters = [new Filter.ValueRangeFilter(0, 1).serialize()];

      var dialog = createDialog(options);
      var scope = dialog.scope;

      var logarithmic = dialog.element.find('option:contains("Logarithmic")');
      var linear = dialog.element.find('option:contains("Linear")');

      // Active filters is not empty
      expect(scope.customizedCard.getCurrentValue('activeFilters')).to.not.be.empty;

      // Toggle bucket type
      linear.prop('selected', true).change();
      scope.$digest();
      logarithmic.prop('selected', true).change();
      scope.$digest();

      // Active filters is not empty
      expect(scope.customizedCard.getCurrentValue('activeFilters')).to.not.be.empty;
    }));
  });

  describe('feature map and choropleth settings', function() {
    describe('map base layer settings', function() {
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

      it('should provide baselayer options that change the choropleth baseLayerUrl', function() {
        var dialog = createDialog();
        var cardModel = dialog.scope.customizedCard;

        var simpleBlue = dialog.element.find('option:contains("Simple Blue")');
        var simpleGrey = dialog.element.find('option:contains("Simple Grey")');
        var esri = dialog.element.find('option:contains("Esri")');
        var custom = dialog.element.find('option:contains("Custom")');

        expect(simpleBlue.length).to.equal(1);
        expect(simpleGrey.length).to.equal(1);
        expect(esri.length).to.equal(1);
        expect(custom.length).to.equal(1);

        // Assert the default is right
        expect(simpleGrey.is(':selected')).to.be.false;
        expect(simpleBlue.is(':selected')).to.be.true;
        expect(esri.is(':selected')).to.be.false;

        // Select the Esri
        esri.prop('selected', true).change();
        dialog.scope.$digest();

        expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.ESRI_BASE_LAYER_URL);

        // Select Simple Grey
        simpleGrey.prop('selected', true).change();
        dialog.scope.$digest();

        expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.MAPBOX_SIMPLE_GREY_BASE_LAYER_URL);

        // Select Simple Blue
        simpleBlue.prop('selected', true).change();
        dialog.scope.$digest();

        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null; // because it's the default

        // Select Custom
        var input = dialog.element.find('input[name=customLayerUrl]')
        expect(input.is(':visible')).to.equal(false);

        custom.prop('selected', true).change();
        dialog.scope.$digest();

        expect(input.is(':visible')).to.equal(true);
        // Shouldn't change the baseLayerUrl yet
        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null;

        // Shouldn't change the baseLayerUrl when given a non-url
        input.val('foobar').trigger('input').trigger('change');
        dialog.scope.$digest();
        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null;

        // Shouldn't change the baseLayerUrl when given a url without {x}, {y}, {z}
        input.val('http://www.google.com/').trigger('input').trigger('change');
        dialog.scope.$digest();
        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null;

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

        var simpleBlue = dialog.element.find('option:contains("Simple Blue")');
        var simpleGrey = dialog.element.find('option:contains("Simple Grey")');
        var esri = dialog.element.find('option:contains("Esri")');
        var custom = dialog.element.find('option:contains("Custom")');

        expect(simpleGrey.length).to.equal(1);
        expect(simpleBlue.length).to.equal(1);
        expect(esri.length).to.equal(1);
        expect(custom.length).to.equal(1);

        // Assert the default is right
        expect(simpleBlue.is(':selected')).to.be.true;
        expect(simpleGrey.is(':selected')).to.be.false;
        expect(esri.is(':selected')).to.be.false;

        // Select the Esri
        esri.prop('selected', true).change();
        dialog.scope.$digest();

        expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.ESRI_BASE_LAYER_URL);

        // Select Simple Grey
        simpleGrey.prop('selected', true).change();
        dialog.scope.$digest();

        expect(cardModel.getCurrentValue('baseLayerUrl')).to.equal(Constants.MAPBOX_SIMPLE_GREY_BASE_LAYER_URL);

        // Select Simple Blue
        simpleBlue.prop('selected', true).change();
        dialog.scope.$digest();

        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null; // because it's the default

        // Select Custom
        var input = dialog.element.find('input[name=customLayerUrl]');
        expect(input.is(':visible')).to.equal(false);

        custom.prop('selected', true).change();
        dialog.scope.$digest();

        expect(input.is(':visible')).to.equal(true);

        // Shouldn't change the baseLayerUrl yet
        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null;

        // Shouldn't change the baseLayerUrl when given a non-url
        input.val('foobar').trigger('input').trigger('change');
        dialog.scope.$digest();
        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null;

        // Shouldn't change the baseLayerUrl when given a url without {x}, {y}, {z}
        input.val('http://www.google.com/').trigger('input').trigger('change');
        dialog.scope.$digest();
        expect(cardModel.getCurrentValue('baseLayerUrl')).to.be.null;

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
        var simpleBlue = dialog.element.find('option:contains("Simple Blue")');

        // Set a custom url
        var url = 'http://www.socrata.com/{x}/{y}/{z}';
        custom.prop('selected', true).change();
        expect(customInput.is(':visible')).to.equal(true);
        customInput.val(url).trigger('input').trigger('change');
        dialog.scope.$digest();
        expect(card.getCurrentValue('baseLayerUrl')).to.equal(url);

        // Now go back to the standard
        simpleBlue.prop('selected', true).change();
        expect(card.getCurrentValue('baseLayerUrl')).to.equal(null);

        // Now back to custom
        custom.prop('selected', true).change();

        // It should set the base layer back to the custom url from before
        expect(card.getCurrentValue('baseLayerUrl')).to.equal(url);
      });
    });

    describe('map flannel title column settings', function() {
      var featureMapCard = {
        fieldName: 'feature',
        cardSize: 2,
        cardType: 'feature',
        expanded: false
      };

      beforeEach(function() {
        ServerConfig.override('oduxEnableFeatureMapHover', true);
      });

      it('should appear when card is a feature map', function() {
        var dialog = createDialog({ card: featureMapCard });
        var cardType = dialog.scope.customizedCard.getCurrentValue('cardType');
        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');

        expect(cardType).to.equal('feature');
        expect(flannelTitleConfigurationElement.length).to.equal(1);
      });

      it('should not appear when the card is not a feature map', function() {
        var dialog = createDialog({
          card: {
            fieldName: 'bar',
            cardSize: 2,
            cardType: 'column',
            expanded: false
          }
        });
        var cardType = dialog.scope.customizedCard.getCurrentValue('cardType');
        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');

        expect(cardType).to.not.equal('feature');
        expect(flannelTitleConfigurationElement.length).to.equal(0);
      });

      it('should display column options excluding subcolumns and system columns and computed columns, plus a null option', function() {
        var dialog = createDialog({ card: featureMapCard });
        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');
        var options = flannelTitleConfigurationElement.find('option');
        var optionNames = _.map(options, function(option) { return $(option).attr('value'); });

        expect(optionNames).to.not.include(':system_column');
        expect(optionNames).to.not.include('sub_column');
        expect(optionNames).to.not.include(':@computed_column');
        expect(optionNames).to.include('null');


        // We expect to have an option for each column unless it is a system column
        // or subcolumn or computed column, plus one option for null.
        // (There are 2 computed columns in COLUMNS)
        var expectedLength = (_.keys(COLUMNS).length - 4) + 1;

        expect(options).to.have.length(expectedLength);
      });

      it('should default to null and show a hint entry if no title column is defined', function() {
        var dialog = createDialog({ card: featureMapCard });
        var scope = dialog.scope;
        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');
        var selectedOption = flannelTitleConfigurationElement.find('option:selected');

        expect(scope.selectedFlannelTitleColumnName).to.be.null;
        expect(selectedOption.attr('value')).to.equal('null');
        expect(selectedOption.text()).to.equal(I18n.customizeCardDialog.featureMapFlannel.defaultOption);
      });

      it('should default to the existing map flannel title column in dropdown if defined', function() {
        var dialog = createDialog({
          card: featureMapCard,
          cardOptions: {
            mapFlannelTitleColumn: 'bar'
          }
        });

        var scope = dialog.scope;
        var originalModel = dialog.outerScope.cardModel;

        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');
        var selectedOption = flannelTitleConfigurationElement.find('option:selected');

        expect(scope.selectedFlannelTitleColumnName).to.equal('bar');
        expect(selectedOption.attr('value')).to.equal('bar');
        expect(selectedOption.text()).to.equal(COLUMNS['bar'].name);
      });

      it('should toggle flannel title option in the dropdown menu', function() {
        var dialog = createDialog({ card: featureMapCard });

        var scope = dialog.scope;
        var originalModel = dialog.outerScope.cardModel;

        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');
        var selectedOption = flannelTitleConfigurationElement.find('option:selected');

        var manyKinds = dialog.element.find('option[value = "many_kinds"]');
        var bar = dialog.element.find('option[value = "bar"]');

        // Check defaults
        expect(scope.selectedFlannelTitleColumnName).to.be.null;
        expect(selectedOption.attr('value')).to.equal('null');
        expect(selectedOption.text()).to.equal(I18n.customizeCardDialog.featureMapFlannel.defaultOption);

        // Select a different title and see changes reflected
        manyKinds.prop('selected', true).change();
        selectedOption = flannelTitleConfigurationElement.find('option:selected');

        expect(scope.selectedFlannelTitleColumnName).to.equal('many_kinds');
        expect(selectedOption.attr('value')).to.equal('many_kinds');
        expect(selectedOption.text()).to.equal(COLUMNS['many_kinds'].name);

        // Select another title and see changes reflected
        bar.prop('selected', true).change();
        selectedOption = flannelTitleConfigurationElement.find('option:selected');

        expect(scope.selectedFlannelTitleColumnName).to.equal('bar');
        expect(selectedOption.attr('value')).to.equal('bar');
        expect(selectedOption.text()).to.equal(COLUMNS['bar'].name);
      });

      it('should allow you to reselect no title via the "(Default)" hint entry once another has been chosen', function() {
        var dialog = createDialog({ card: featureMapCard });

        var scope = dialog.scope;
        var flannelTitleConfigurationElement = dialog.element.find('.configure-flannel-title:visible');
        var selectedOption = flannelTitleConfigurationElement.find('option:selected');

        var manyKinds = dialog.element.find('option[value = "many_kinds"]');
        var defaults = dialog.element.find('option[value = null]');

        // Check defaults
        expect(scope.selectedFlannelTitleColumnName).to.be.null;
        expect(selectedOption.attr('value')).to.equal('null');
        expect(selectedOption.text()).to.equal(I18n.customizeCardDialog.featureMapFlannel.defaultOption);

        // Select a column as the flannel title column
        manyKinds.prop('selected', true).change();
        selectedOption = flannelTitleConfigurationElement.find('option:selected');

        expect(scope.selectedFlannelTitleColumnName).to.equal('many_kinds');
        expect(selectedOption.attr('value')).to.equal('many_kinds');
        expect(selectedOption.text()).to.equal(COLUMNS['many_kinds'].name);

        // Select '(Default)' to reset title back to defaults
        defaults.prop('selected', true).change();
        selectedOption = flannelTitleConfigurationElement.find('option:selected');

        // Value will now be null as a String rather than just null
        expect(scope.selectedFlannelTitleColumnName).to.equal('null');
        expect(selectedOption.attr('value')).to.equal('null');
        expect(selectedOption.text()).to.equal(I18n.customizeCardDialog.featureMapFlannel.defaultOption);
      });
    });

    describe('curated region selector', function() {
      var featureMapCard = {
        fieldName: 'feature',
        cardSize: 2,
        cardType: 'feature',
        expanded: false
      };

      var choroplethCard = {
        fieldName: 'feature',
        cardSize: 2,
        cardType: 'choropleth',
        expanded: false
      };

      it('should appear when card is a choropleth', function() {
        var dialog = createDialog({ card: choroplethCard });
        var cardType = dialog.scope.customizedCard.getCurrentValue('cardType');
        var curatedRegionSelectors = dialog.element.find('.curated-region-selector');

        expect(cardType).to.equal('choropleth');
        expect(curatedRegionSelectors.length).to.equal(1);
        expect(curatedRegionSelectors).to.not.have.class('ng-hide');
      });

      it('should not appear when the card is not a choropleth', function() {
        var dialog = createDialog({ card: featureMapCard });
        var cardType = dialog.scope.customizedCard.getCurrentValue('cardType');
        var curatedRegionSelectors = dialog.element.find('.curated-region-selector');

        expect(cardType).to.equal('feature');
        expect(curatedRegionSelectors.length).to.equal(1);
        expect(curatedRegionSelectors).to.have.class('ng-hide');
      });

      it('should display the correct number of curated regions in the dropdown', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', true);

        var curatedRegions = [
          { name: 'the most curated region ever', view: { id: 'rook-king' }},
          { name: 'the 2nd most curated region ever', view: { id: 'king-pawn' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({ card: choroplethCard });
        var options = dialog.element.find('.curated-region-selector option');

        // 1) mash-apes, as specified by 'choropleth' column
        // 2) rook-king, as specified by ':@computedColumn' column
        // 3) blank divider [disabled]
        // 4) header for non-computed regions [disabled]
        // 5) king-pawn, not specified by any column
        expect(options).to.have.length(5);
        expect(options.filter(':not(:disabled)')).to.have.length(3);

        CardDataService.getCuratedRegions.restore();
      });

      it('should display the correct number of curated regions in the dropdown when the flag is disabled', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', false);

        var curatedRegions = [
          { name: 'the most curated region ever', view: { id: 'rook-king' }},
          { name: 'the 2nd most curated region ever', view: { id: 'king-pawn' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({ card: choroplethCard });
        var options = dialog.element.find('.curated-region-selector option');

        // 1) mash-apes, as specified by 'choropleth' column
        // 2) rook-king, as specified by ':@computedColumn' column
        expect(options).to.have.length(2);

        CardDataService.getCuratedRegions.restore();
      });

      it('should display the correct number of curated regions in the dropdown when the user lacks write permissions', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', true);

        var curatedRegions = [
          { name: 'the most curated region ever', view: { id: 'rook-king' }},
          { name: 'the 2nd most curated region ever', view: { id: 'king-pawn' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({
          card: choroplethCard,
          datasetOverrides: { permissions: { rights: [ViewRights.READ] } }
        });
        var options = dialog.element.find('.curated-region-selector option');

        // 1) mash-apes, as specified by 'choropleth' column
        // 2) rook-king, as specified by ':@computedColumn' column
        // 3) blank divider [disabled]
        // 4) header for non-computed regions [disabled]
        // 5) king-pawn, not specified by any column [disabled]
        expect(options).to.have.length(5);
        expect(options.filter(':not(:disabled)')).to.have.length(2);

        CardDataService.getCuratedRegions.restore();
      });

      it('should set the computedColumn property on the card when an option is selected', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', true);

        var curatedRegions = [
          { name: 'the most curated region ever', uid: 'mash-apes', view: { id: 'mash-apes' }},
          { name: 'the 2nd most curated region ever', uid: 'mash-apes', view: { id: 'rook-king' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({ card: choroplethCard });

        dialog.scope.$digest();

        expect(dialog.scope.customizedCard.getCurrentValue('computedColumn')).to.equal('choropleth');
        dialog.element.find('option[value="rook-king"]').prop('selected', true).change();
        expect(dialog.scope.customizedCard.getCurrentValue('computedColumn')).to.equal(':@computedColumn');

        CardDataService.getCuratedRegions.restore();
      });

      it('should set the computedColumn property on the card when a nonComputed option is selected', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', true);

        var curatedRegions = [
          { name: 'the most curated region ever', uid: 'mash-apes', view: { id: 'mash-apes' }},
          { name: 'the 2nd most curated region ever', uid: 'king-pawn', view: { id: 'king-pawn' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({ card: choroplethCard });

        dialog.scope.$digest();

        expect(dialog.scope.customizedCard.getCurrentValue('computedColumn')).to.equal('choropleth');
        dialog.element.find('option[value="king-pawn"]').prop('selected', true).change();
        expect(dialog.scope.customizedCard.getCurrentValue('computedColumn')).to.equal(':@computed_region_king_pawn');
      });

      // NOTE: These tests are being skipped for now because
      // 1) they work in the browser
      // 2) while the first one seems to be working correctly, the second one is adding the blank separator
      //    in a case where there ought to be no possibility of two non-empty region partitions.
      // We could short-circuit some of the logic, but at that point we'd be testing Angular bindings
      // more than the actual logic of the directive.
      // Further investigation is needed but is probably not worth holding up this feature.

      xit('should not show the divider or nonComputed section if there are no nonComputed regions', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', true);

        var curatedRegions = [
          { name: 'the most curated region ever', uid: 'mash-apes', view: { id: 'mash-apes' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({ card: choroplethCard });

        dialog.scope.$digest();

        expect(dialog.element.find('.curated-region-selector option:disabled')).to.have.length(0);
        expect(dialog.element.find('.curated-region-selector option')).to.have.length(1);
      });

      xit('should not show the divider or the computed section if there are no already-computed regions', function() {
        ServerConfig.override('enableSpatialLensRegionCoding', true);

        var curatedRegions = [
          { name: 'the 2nd most curated region ever', uid: 'king-pawn', view: { id: 'king-pawn' }}
        ];

        sinon.stub(CardDataService, 'getCuratedRegions', function() {
          return $q.when(curatedRegions);
        });

        var dialog = createDialog({ card: choroplethCard });

        dialog.scope.$digest();

        expect(dialog.element.find('.curated-region-selector option:disabled')).to.have.length(1);
        expect(dialog.element.find('.curated-region-selector option')).to.have.length(2);
      });
    });
  });
});
