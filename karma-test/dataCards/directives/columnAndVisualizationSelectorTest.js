describe('columnAndVisualizationSelectorTest', function() {
  'use strict';

  var testHelpers;
  var Card;
  var Mockumentary;
  var Model;
  var $rootScope;
  var $controller;
  var $httpBackend;
  var $templateCache;

  function createDirective() {

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
    outerScope.cardSize = 1;
    outerScope.$bindObservable('datasetColumns', datasetColumns);

    var html =
      '<column-and-visualization-selector ' +
        'style="display:block" ' +
        'dataset-columns="datasetColumns" ' +
        'page="page" ' +
        'card-size="cardSize" ' +
      '></column-and-visualization-selector>';

    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Because we have an ng-if, the element returned by $compile isn't the one we want (it's a
    // comment). So grab all the children of the element's parent.
    element = element.parent().children();

    return {
      outerScope: outerScope,
      element: element,

      // The ng-if introduces another scope
      scope: outerScope.$$childHead
    };
  }

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
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

  it('should show all columns as options in the "Choose a column..." select control', function() {
    var directive = createDirective();
    var selectableColumnOptions = directive.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(6);
  });

  it('should show columns currently represented as cards in the select control', function() {
    var directive = createDirective();
    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardType: 'column',
      expanded: false
    };
    directive.scope.page.set('cards', [Card.deserialize(directive.scope.page, serializedCard)]);

    var selectableColumnOptions = directive.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(6);
  });

  it('should display a sample card visualization when an enabled column in the "Choose a column..." select control is selected', function() {
    var directive = createDirective();

    expect(directive.element.find('card').length).to.equal(0);

    directive.scope.cardSize = 2;
    directive.element.find('option[value=ward]').prop('selected', true).trigger('change');

    expect(directive.element.find('card').length).to.equal(1);
  });

  it('should display multiple visualization choices when a column in the "Choose a column..." select control is selected which allows multiple visualizations', function() {
    var directive = createDirective();

    expect(directive.element.find('.visualization-type:visible').length).to.equal(0);

    directive.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');

    expect(directive.element.find('.visualization-type:visible').length).to.equal(2);
    expect(directive.element.find('.visualization-type.icon-bar-chart').length).to.equal(1);
    expect(directive.element.find('.visualization-type.icon-search').length).to.equal(1);

  });

  it('should display a warning for "column" card type option buttons when a column\'s cardinality is greater than 100', function() {
    var directive = createDirective();

    expect(directive.element.find('.visualization-type:visible').length).to.equal(0);

    directive.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');

    expect(directive.element.find('.visualization-type:visible').length).to.equal(2);

    // We show / hide the icon itself with CSS, which is not included in
    // this test file.  Thus, instead we test for the 'warn' class.
    expect(directive.element.find('.icon-bar-chart').hasClass('warn')).to.be.true;

  });

  describe('when an enabled column is selected', function() {
    var selectedColumnFieldName = 'ward';
    var directive;

    function doSelectCard() {
      directive.element.find('option[value={0}]'.format(selectedColumnFieldName)).
        prop('selected', true).trigger('change');
    };

    beforeEach(function() {
      var serializedCard = {
        fieldName: 'spot',
        cardSize: 1,
        cardType: 'column',
        expanded: false
      };
      directive = createDirective();
      directive.scope.page.set('cards', [Card.deserialize(directive.scope.page, serializedCard)]);
    });

    describe('card-model-selected scope event', function() {
      var seenEventPayloads;
      beforeEach(function() {
        seenEventPayloads = [];
        directive.outerScope.$on('card-model-selected', function(event, payload) {
          seenEventPayloads.push(payload); // is a card model
        });
      });

      describe('card object', function() {
        it('should have the correct cardSize', function() {
          var expectedCardSize = 3;

          directive.scope.cardSize = expectedCardSize;

          doSelectCard();

          expect(seenEventPayloads[0].getCurrentValue('cardSize')).to.equal(expectedCardSize);
        });

        it('should have the correct fieldName', function() {
          doSelectCard();

          expect(seenEventPayloads[0].fieldName).to.equal(selectedColumnFieldName);

        });
      });

      afterEach(function() {
        // For now all these tests emit only one card-model-selected.
        expect(seenEventPayloads).to.have.length(1);
      });
    });

    describe('that supports customization', function() {
      // Ward is already customizable
      describe('customize button', function() {
        it('should emit customize-card-with-model scope event', function(done) {
          var directive = createDirective();
          var customizeButton = directive.element.find('.card-control[title^="Customize"]');

          // This button should only appear for cards that support it
          expect(customizeButton.length).to.equal(0);

          directive.element.find('select > option[value="bar"]').prop('selected', true).trigger('change');
          customizeButton = directive.element.find('.card-control[title^="Customize"]');

          // Button should still be hidden.
          expect(customizeButton).to.be.hidden;

          // Now select the choropleth
          directive.element.find('select > option[value="ward"]').prop('selected', true).trigger('change');

          customizeButton = directive.element.find('.card-control[title^="Customize"]');
          expect(customizeButton).to.be.visible;

          /* Technically, there should be a flyout here. But since we're using the same mechanism to give
           * this button a flyout, as we are for the other card-controls in a card-layout, the flyout is
           * only registered in the card-layout code. So just test to make sure the conditions are met for
           * the card-layout-registered flyout to work.
           */
          expect(customizeButton.hasClass('card-control')).to.be.true;
          expect(customizeButton.prop('title')).to.match(/customize this card/i);

          directive.outerScope.$on('customize-card-with-model', function(e, cardModel) {
            expect(cardModel).to.be.ok;
            done();
          });

          // Trigger the customize button click event.
          customizeButton.click();
        });
      });
    });
  });

  describe('datasetColumns scope variable', function() {

    it('should add non-subcolumns to the available columns', function() {
      var directive = createDirective();

      var currentColumns = directive.scope.page.
        getCurrentValue('dataset').
        getCurrentValue('columns');

      expect(directive.scope.datasetColumns.available.sort()).to.
        deep.equal(_.keys(currentColumns).sort());
    });

    it('should not add subcolumns to the available columns', function() {
      var directive = createDirective();

      var currentColumns = directive.scope.page.
        getCurrentValue('dataset').
        getCurrentValue('columns');

      var newColumns = _.map(currentColumns, function(column) {
        column.isSubcolumn = true;
        return column;
      });

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.datasetColumns.available.length).to.equal(0);
    });

  });
});
