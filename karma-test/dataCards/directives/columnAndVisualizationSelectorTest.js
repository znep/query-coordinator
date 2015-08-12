describe('columnAndVisualizationSelectorTest', function() {
  'use strict';

  var testHelpers;
  var Card;
  var Mockumentary;
  var Model;
  var $rootScope;
  var $controller;
  var $provide;

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

    var outerScope = $rootScope.$new();

    outerScope.page = pageModel;
    outerScope.cardSize = 1;

    var html =
      '<column-and-visualization-selector ' +
        'style="display:block" ' +
        'page="page" ' +
        'card-size="cardSize" ' +
        'supported-card-types="supportedCardTypes" ' +
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
  beforeEach(module('/angular_templates/dataCards/columnAndVisualizationSelector.html'));
  beforeEach(module('/angular_templates/dataCards/visualizationTypeSelector.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));

  beforeEach(function() {
    module(['$provide', function(_$provide) {
      $provide = _$provide;
    }]);
  });

  beforeEach(
    inject([
      'testHelpers',
      'Card',
      'Mockumentary',
      'Model',
      '$rootScope',
      '$controller',
      function(
        _testHelpers,
        _Card,
        _Mockumentary,
        _Model,
        _$rootScope,
        _$controller) {

          testHelpers = _testHelpers;
          Card = _Card;
          Mockumentary = _Mockumentary;
          Model = _Model;
          $rootScope = _$rootScope;
          $controller = _$controller;

          testHelpers.mockDirective($provide, 'card');
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

    describe('customize button', function() {
      function findButton() {
        return directive.element.find('.add-card-controls .add-card-settings');
      }

      it('should be visible if the selected card is customizable', function() {
        var directive = createDirective();
        var customizeButton = findButton();

        // With no card selected, the button should be hidden.
        expect(customizeButton).to.have.length(0);

        // With a non-customizable card selected, the button should be hidden.
        directive.element.find('select > option[value="bar"]').prop('selected', true).trigger('change');

        customizeButton = findButton();
        expect(customizeButton).to.have.length(0);

        // With a customizable card selected, the button should show.
        directive.element.find('select > option[value="ward"]').prop('selected', true).trigger('change');

        customizeButton = findButton();
        expect(customizeButton).to.have.length(1);
        expect(customizeButton).to.be.visible;

        /* Technically, there should be a flyout here. But since we're using the same mechanism to give
         * this button a flyout, as we are for the other card-controls in a card-layout, the flyout is
         * only registered in the card-layout code. So just test to make sure the conditions are met for
         * the card-layout-registered flyout to work.
         */
        expect(customizeButton.prop('title')).to.match(/customize this card/i);
      });
    });
  });

  describe('availableColumns scope variable', function() {
    var directive;
    var currentColumns;

    beforeEach(function() {
      directive = createDirective();
      currentColumns = directive.scope.page.
        getCurrentValue('dataset').
        getCurrentValue('columns');
    });

    it('should include non-subcolumns', function() {
      expect(directive.scope.availableColumns.sort()).to.
        deep.equal(_.keys(currentColumns).sort());
    });

    it('not include subcolumns', function() {
      var newColumns = _.mapValues(currentColumns, function(column) {
        column = _.cloneDeep(column);
        column.isSubcolumn = true;
        return column;
      });

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.availableColumns).to.be.empty;
    });

    it('should be sorted in alphabetical order', function() {
      var currentColumnFieldNames = _.keys(currentColumns);
      var expectedFieldNameOrder = [].concat(currentColumnFieldNames).sort();
      expect(directive.scope.availableColumns).to.deep.equal(expectedFieldNameOrder);
    });

    it('should not include system columns', function() {
      var newColumns = {
        ':id': {},
        'normal_column': {}
      };

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.availableColumns).to.have.length(1);
      expect(directive.scope.availableColumns).to.include('normal_column');
    });

    it('should include computed columns', function() {
      var newColumns = {
        ':@computed_column': {},
        'normal_column': {}
      };

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.availableColumns).to.have.length(2);
      expect(directive.scope.availableColumns).to.include('normal_column');
      expect(directive.scope.availableColumns).to.include(':@computed_column');
    });

    describe('if supportedCardTypes is set', function() {
      function setSupportedCardTypes(value) {
        directive.outerScope.supportedCardTypes = value;
        directive.outerScope.$apply();
      }

      describe('to an empty array', function() {
        it('should include no columns', function() {
          var currentColumnFieldNames = _.keys(currentColumns);
          setSupportedCardTypes([]);
          expect(directive.scope.availableColumns.sort()).to.be.empty;
        });
      });

      describe('to an array including `column` and `timeline`', function() {
        it('should include columns that can be visualized as column or timeline', function() {
          setSupportedCardTypes(['column', 'timeline']);
          var expectedAvailable = [
            'bar',
            'distribution',
            'multipleVisualizations'
          ];

          expect(directive.scope.availableColumns.sort()).to.
            deep.equal(expectedAvailable.sort());
        });
      });
    });

  });

  describe('unsupportedColumns scope variable', function() {
    var directive;
    var currentColumns;

    function makeAllColumnsUnsupported() {
      var newColumns = _.mapValues(currentColumns, function(column) {
        column = _.cloneDeep(column);
        column.defaultCardType = 'invalid';
        return column;
      });

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);
    }

    beforeEach(function() {
      directive = createDirective();
      currentColumns = directive.scope.page.
        getCurrentValue('dataset').
        getCurrentValue('columns');
    });

    it('should not include columns with a defaultCardType that is not `invalid`', function() {
      // All default columns are supported.
      expect(directive.scope.unsupportedColumns).to.be.empty;
    });

    it('should include columns with a defaultCardType of `invalid`', function() {
      makeAllColumnsUnsupported();

      expect(directive.scope.unsupportedColumns.sort()).to.
        deep.equal(_.keys(currentColumns).sort());
    });

    it('should be sorted in alphabetical order', function() {
      var currentColumnFieldNames = _.keys(currentColumns);
      var expectedFieldNameOrder = [].concat(currentColumnFieldNames).sort();

      makeAllColumnsUnsupported();

      expect(directive.scope.unsupportedColumns).to.deep.equal(expectedFieldNameOrder);
    });


    it('not include subcolumns unless their defaultCardType is `invalid`', function() {
      var newColumns = _.mapValues(currentColumns, function(column) {
        column = _.cloneDeep(column);
        column.isSubcolumn = true;
        return column;
      });

      newColumns['bar'].defaultCardType = 'invalid';

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.unsupportedColumns).to.have.length(1);
      expect(directive.scope.unsupportedColumns).to.include('bar');
    });

    it('should not include system columns', function() {
      var newColumns = {
        ':id': {},
        'normal_column': {}
      };

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.unsupportedColumns).to.be.empty;
    });

    describe('if supportedCardTypes is set', function() {
      function setSupportedCardTypes(value) {
        directive.outerScope.supportedCardTypes = value;
        directive.outerScope.$apply();
      }

      describe('to an empty array', function() {
        it('should include all columns', function() {
          var currentColumnFieldNames = _.keys(currentColumns);
          setSupportedCardTypes([]);
          expect(directive.scope.unsupportedColumns.sort()).to.
            deep.equal(currentColumnFieldNames.sort());
        });
      });

      describe('to an array including `column` and `timeline`', function() {
        it('should include columns that cannot be visualized as column or timeline', function() {
          setSupportedCardTypes(['column', 'timeline']);
          var expectedUnsupported = [
            'spot',
            'point',
            'ward'
          ];

          expect(directive.scope.unsupportedColumns.sort()).to.
            deep.equal(expectedUnsupported.sort());
        });
      });
    });
  });
});
