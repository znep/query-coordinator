import { expect, assert } from 'chai';
const angular = require('angular');

describe('columnAndVisualizationSelectorTest', function() {
  'use strict';

  var I18n;
  var testHelpers;
  var Card;
  var Mockumentary;
  var Model;
  var ServerConfig;
  var $rootScope;
  var $controller;
  var $provide;
  var $httpBackend;

  function createDirective(pageOverrides) {

    var columns = {
      'bar': {
        'name': 'A bar where cool froods hang out.',
        'fieldName': 'bar',
        'description': '???',
        'physicalDatatype': 'text',
        'position': 0,
        'cardType': 'column',
        'defaultCardType': 'column',
        'availableCardTypes': ['column', 'search']
      },
      'distribution': {
        'name': 'Place where things are distributed',
        'fieldName': 'distribution',
        'description': '???',
        'physicalDatatype': 'number',
        'position': 1,
        'cardinality': 20,
        'cardType': 'histogram',
        'defaultCardType': 'histogram',
        'availableCardTypes': ['histogram', 'column', 'search']
      },
      'point': {
        'name': 'Points where crimes have been committed.',
        'fieldName': 'point',
        'description': 'Points.',
        'physicalDatatype': 'point',
        'position': 2,
        'cardType': 'feature',
        'defaultCardType': 'feature',
        'availableCardTypes': ['feature'],
        'computedColumn': 'fakeComputedColumn'
      },
      'multipleVisualizations': {
        'name': 'A card for which multiple visualizations are possible.',
        'fieldName': 'multipleVisualizations',
        'description': '???',
        'physicalDatatype': 'text',
        'position': 3,
        'cardinality': 2000,
        'cardType': 'search',
        'defaultCardType': 'search',
        'availableCardTypes': ['column', 'search']
      }
    };

    var pageOverrides = _.merge(
      {
        pageId: 'asdf-fdsa',
        datasetId: 'rook-king'
      },
      pageOverrides
    );
    var datasetOverrides = {
      id: 'rook-king',
      columns: columns
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var outerScope = $rootScope.$new();

    outerScope.page = pageModel;
    outerScope.cardSize = 1;
    outerScope.addCardSelectedColumnFieldName = null;

    var html =
      '<column-and-visualization-selector ' +
        'style="display:block" ' +
        'page="page" ' +
        'card-size="cardSize" ' +
        'supported-card-types="supportedCardTypes" ' +
        'add-card-prompt="false" ' +
        'add-card-selected-column-field-name="addCardSelectedColumnFieldName"' +
        'classic-visualization="classicVisualization" ' +
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

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(['$provide', function(_$provide) {
      $provide = _$provide;
    }]);
  });

  beforeEach(
    inject([
      'I18n',
      'testHelpers',
      'Card',
      'Mockumentary',
      'Model',
      'ServerConfig',
      '$rootScope',
      '$controller',
      '$httpBackend',
      function(
        _I18n,
        _testHelpers,
        _Card,
        _Mockumentary,
        _Model,
        _ServerConfig,
        _$rootScope,
        _$controller,
        _$httpBackend) {

          I18n = _I18n;
          testHelpers = _testHelpers;
          Card = _Card;
          Mockumentary = _Mockumentary;
          Model = _Model;
          ServerConfig = _ServerConfig;
          $rootScope = _$rootScope;
          $controller = _$controller;
          $httpBackend = _$httpBackend;

          $httpBackend.whenGET(/\/api\/curated_regions.*/).respond([]);
          $httpBackend.whenGET(/\/api\/id\/rook-king.json\?%24query=select\+count\(0\).*/).respond([]);

          testHelpers.mockDirective($provide, 'card');
          testHelpers.mockDirective($provide, 'classicVisualizationPreviewer');
      }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  xit('should show all valid columns as options in the "Choose a column..." select control', function() {
    var directive = createDirective();
    var selectableColumnOptions = directive.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(4);
  });

  xit('should show columns currently represented as cards in the select control', function() {
    var directive = createDirective();
    var serializedCard = {
      fieldName: 'spot',
      cardSize: 1,
      cardType: 'column',
      expanded: false
    };
    directive.scope.page.set('cards', [Card.deserialize(directive.scope.page, serializedCard)]);

    var selectableColumnOptions = directive.element.find('option:enabled');

    expect(selectableColumnOptions.length).to.equal(4);
  });

  it('should display a sample card visualization when an enabled column in the "Choose a column..." select control is selected', function() {
    var directive = createDirective();

    expect(directive.element.find('card').length).to.equal(0);

    directive.scope.cardSize = 2;
    directive.element.find('option[value=point]').prop('selected', true).trigger('change');

    var card = directive.element.find('card');
    expect(card.length).to.equal(1);
    expect(directive.scope.selectedCardModel.fieldName).to.eq('point');
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

    expect(directive.element.find('.icon-bar-chart').find('.icon-warning').css('display')).to.not.equal('none');

  });

  it('should display "(Custom...)" in the dropdown if classicVisualization is set', function() {
    var directive = createDirective();
    var customOptionSelector = '.classic-visualization-option';

    expect(directive.element.find(customOptionSelector)).to.have.length(0);
    directive.outerScope.classicVisualization = 'I am truthy';
    directive.outerScope.$apply();
    expect(directive.element.find(customOptionSelector)).to.have.length(1);
    expect(directive.element.find(customOptionSelector).prop('selected')).to.equal(true);
  });

  describe('with classicVisualization set', function() {
    var directive;
    beforeEach(function() {
      directive = createDirective();

      directive.outerScope.classicVisualization = 'I am truthy';
      directive.outerScope.$apply();
    });

    it('should display the preview', function() {
      assert.isTrue(directive.element.find('.classic-visualization-preview').is(':visible'));
    });

    it('should hide the card preview placeholder', function() {
      assert.isFalse(directive.element.find('.add-card-preview-placeholder').is(':visible'));
    });
  });

  describe('when addCardSelectedColumnFieldName is changed externally', function() {
    var directive;

    function setFieldName(fieldName) {
      directive.outerScope.addCardSelectedColumnFieldName = fieldName;
      directive.outerScope.$digest();
    }

    beforeEach(function() {
      directive = createDirective();
    });

    it('should display the correct card in the preview', function() {
      function currentlyShownCardModel() {
        return directive.scope.selectedCardModel;
      }

      expect(currentlyShownCardModel()).to.eq(null); // Test sanity
      setFieldName('point');
      expect(currentlyShownCardModel().fieldName).to.eq('point');
    });

    it('should update the dropdown', function() {
      function selectedDropdownOption() {
        return directive.element.find('select').val();
      }

      expect(selectedDropdownOption()).to.not.eq('point'); // Test sanity
      setFieldName('point');
      expect(selectedDropdownOption()).to.eq('point');
    });
  });

  describe('when an enabled column is selected', function() {
    var selectedColumnFieldName = 'point';
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

    describe('card-model-changed scope event', function() {
      var seenEventPayloads;

      beforeEach(function() {
        seenEventPayloads = [];
        directive.outerScope.$on('card-model-changed', function(event, payload) {
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
        directive.element.find('select > option[value="point"]').prop('selected', true).trigger('change');

        customizeButton = findButton();
        expect(customizeButton).to.have.length(1);
        assert.isTrue(customizeButton.is(':visible'));

        /* Technically, there should be a flyout here. But since we're using the same mechanism to give
         * this button a flyout, as we are for the other card-controls in a card-layout, the flyout is
         * only registered in the card-layout code. So just test to make sure the conditions are met for
         * the card-layout-registered flyout to work.
         */
        expect(customizeButton.prop('title')).to.equal(I18n.cardControls.customizeEnabled);
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

    it('should be sorted in order of the position keys of the scope variable', function() {
      var expectedFieldNameOrder = _.map(_.sortBy(currentColumns, 'position'), 'fieldName');
      expect(directive.scope.availableColumns).to.deep.equal(expectedFieldNameOrder);
    });

    it('should not include subcolumns', function() {
      var newColumns = _.mapValues(currentColumns, function(column) {
        column = _.cloneDeep(column);
        column.isSubcolumn = true;
        return column;
      });

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      assert.lengthOf(directive.scope.availableColumns, 0);
    });

    it('should not include system columns', function() {
      var newColumns = {
        ':id': { isSystemColumn: true },
        'normal_column': {}
      };

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.availableColumns).to.have.length(1);
      expect(directive.scope.availableColumns).to.include('normal_column');
    });

    it('should not include computed columns', function() {
      var newColumns = {
        ':@computed_column': {computationStrategy: {}, fieldName: ':@computed_column'},
        'normal_column': {fieldName: 'normal_column'}
      };

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      expect(directive.scope.availableColumns).to.have.length(1);
      expect(directive.scope.availableColumns).to.include('normal_column');
      expect(directive.scope.availableColumns).to.not.include(':@computed_column');
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
          assert.lengthOf(directive.scope.availableColumns.sort(), 0);
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
      assert.lengthOf(directive.scope.unsupportedColumns, 0);
    });

    it('should include columns with a defaultCardType of `invalid`', function() {
      makeAllColumnsUnsupported();

      expect(directive.scope.unsupportedColumns.sort()).to.
        deep.equal(_.keys(currentColumns).sort());
    });

    it('should be sorted in order of the position keys of the column', function() {
      var currentColumnFieldNames = _.map(_.sortBy(currentColumns, 'position'), 'fieldName');

      makeAllColumnsUnsupported();

      expect(directive.scope.unsupportedColumns).to.deep.equal(currentColumnFieldNames);
    });

    it('should not include system columns', function() {
      var newColumns = {
        ':id': { isSystemColumn: true },
        'normal_column': {}
      };

      directive.scope.page.
        getCurrentValue('dataset').
        set('columns', newColumns);

      assert.lengthOf(directive.scope.unsupportedColumns, 0);
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
            'point'
          ];

          expect(directive.scope.unsupportedColumns.sort()).to.
            deep.equal(expectedUnsupported.sort());
        });
      });
    });
  });

  describe('addVisualizationPrompt scope variable', function() {

    var directive;

    beforeEach(function() {
      directive = createDirective();
    });

    it('should show the default message if no `addVisualiztionPrompt` value is provided', function() {

      var prompt = directive.element.find('.placeholder-inner-text').find('span').text();

      expect(prompt).to.equal(I18n.addCardDialog.prompt);
    });

    it('should override the default message if a `addVisualizationPrompt` value is provided', function() {

      directive.scope.$safeApply(function() {
        directive.scope.addVisualizationPrompt = 'addCardDialog.genericPrompt';
      });

      var prompt = directive.element.find('.placeholder-inner-text').find('span').text();

      expect(prompt).to.equal(I18n.addCardDialog.genericPrompt);
    });
  });

  describe('shouldShowAggregationSelector scope variable', function() {
    it('should not show card aggregation when no column is selected', function() {
      var directive = createDirective();
      var cardAggregationSelector = directive.element.find('card-aggregation-selector');

      assert.lengthOf(cardAggregationSelector, 0);
    });

    it('should not show card aggregation when card type is blacklisted', function() {
      var directive = createDirective();
      directive.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');
      directive.element.find('.icon-search').trigger('click');
      var cardAggregationSelector = directive.element.find('card-aggregation-selector');

      assert.lengthOf(cardAggregationSelector, 0);
    });

    it('should show card aggregation when column is selected', function() {
      var directive = createDirective();
      directive.element.find('option[value=multipleVisualizations]').prop('selected', true).trigger('change');
      directive.element.find('.icon-bar-chart').trigger('click');
      var cardAggregationSelector = directive.element.find('card-aggregation-selector');

      assert.lengthOf(cardAggregationSelector, 1);
    });
  });
});
