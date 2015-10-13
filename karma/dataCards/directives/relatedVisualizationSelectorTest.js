describe('relatedVisualizationSelector', function() {
  'use strict';

  var I18n;
  var testHelpers;
  var Card;
  var Mockumentary;
  var Model;
  var $rootScope;
  var $controller;
  var $provide;

  var minimalScopeProperties = {
    columnNameToReadableNameFn: function(column) { return column; },
    relatedVisualizations: [],
    highlightedColumns: []
  };

  function createDirective(scopeProperties) {
    var scope = $rootScope.$new();

    _.extend(scope, scopeProperties);

    var html =
      '<related-visualization-selector></related-visualization-selector>';

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    return {
      element: element,
      scope: scope
    };
  }

  beforeEach(module('dataCards'));
  beforeEach(module('/angular_templates/dataCards/relatedVisualizationSelector.html'));
  beforeEach(module('/angular_templates/dataCards/relatedVisualization.html'));

  beforeEach(function() {
    module(['$provide', function(_$provide) {
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
      '$rootScope',
      '$controller',
      function(
        _I18n,
        _testHelpers,
        _Card,
        _Mockumentary,
        _Model,
        _$rootScope,
        _$controller) {

          I18n = _I18n;
          testHelpers = _testHelpers;
          Card = _Card;
          Mockumentary = _Mockumentary;
          Model = _Model;
          $rootScope = _$rootScope;
          $controller = _$controller;
      }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('parent scope', function() {
    it('should not throw on correct setup', function() {
      createDirective(minimalScopeProperties);
    });

    it('should throw on missing columnNameToReadableNameFn', function() {
      expect(function() {
        createDirective(_.omit(minimalScopeProperties, 'columnNameToReadableNameFn'));
      }).to.throw();
    });
  });

  describe('with a set of related visualizations', function() {
    var directive;
    var relatedVisualizations;

    function buildRelatedVisualization(columnName) {
      var relatedVisualizationPageMetadata = Mockumentary.createPageMetadata();
      var relatedVisualizationVIF = {
        title: 'Test Viz ' + columnName,
        description: 'Test Viz Description ' + columnName,
        type: 'test',
        columnName: columnName,
        origin: {
          type: 'unit tests'
        },
        filters: []
      };
      relatedVisualizationPageMetadata.sourceVif = relatedVisualizationVIF;
      relatedVisualizationPageMetadata.cards = [Mockumentary.createCardMetadata()];
      return relatedVisualizationPageMetadata;
    }

    beforeEach(function() {
      relatedVisualizations = _.map(
        [ '1', '2', '3' ],
        buildRelatedVisualization
      );

      directive = createDirective({
        columnNameToReadableNameFn: function(columnName) {
          return 'Human Name ' + columnName;
        },
        relatedVisualizations: relatedVisualizations,
        highlightedColumns: [],
        supportedCardTypes: ['column', 'feature', 'timeline']
      });
    });

    it('displays the visualization title', function() {
      var texts = _.map(directive.element.find('h4'), function(item) {
        return $(item).text().trim();
      });

      expect(texts).to.deep.equal([
        'Test Viz 1',
        'Test Viz 2',
        'Test Viz 3'
      ]);
    });

    it('displays the visualization description', function() {
      var texts = _.map(directive.element.find('p'), function(item) {
        return $(item).text().trim();
      });

      expect(texts).to.deep.equal([
        'Test Viz Description 1',
        'Test Viz Description 2',
        'Test Viz Description 3',
      ]);
    });

    it('uses the human name for the "based on" text', function() {
      var texts = _.map(directive.element.find('.related-visualization-metadata'), function(item) {
        return $(item).text().trim();
      });

      expect(texts).to.deep.equal([
        'Based on Human Name 1',
        'Based on Human Name 2',
        'Based on Human Name 3'
      ]);
    });

    describe('clicking on visualization', function() {
      it('should emit "related-visualization-selected"', function() {
        var payloads = [];
        directive.scope.$on('related-visualization-selected', function(event, payload) {
          payloads.push(payload);
        });

        directive.element.find('li a').click();

        expect(_.pluck(payloads, 'sourceVif.columnName')).to.deep.equal([
          '1',
          '2',
          '3'
        ]);
      });
    });

    describe('shouldDisable', function() {
      function getVisualizationDisabledStatus() {
        return _.reduce(directive.element.find('li'), function(acc, item) {
          var columnName = $(item).scope().visualization.sourceVif.columnName;
          acc[columnName] = $(item).hasClass('disabled');
          return acc;
        }, {});
      }
      it('should apply the `disabled` class to all related visualizations that are not supported', function() {
        directive.scope.relatedVisualizations[0].cards[0].cardType = 'choropleth';
        directive.scope.$apply();
        expect(getVisualizationDisabledStatus()).to.deep.equal({
          '1': true,
          '2': false,
          '3': false
        });
      });
    });

    describe('sort order', function() {
      function getColumnNamesInDisplayOrder() {
        return _.map(directive.element.find('li'), function(item) {
          return $(item).scope().visualization.sourceVif.columnName;
        });
      }
      it('should place all unsupported visualizations at the end', function() {
        directive.scope.relatedVisualizations[0].cards[0].cardType = 'choropleth'; // not supported
        directive.scope.$apply();
        expect(getColumnNamesInDisplayOrder()).to.deep.equal([
          '2',
          '3',
          '1'
        ]);
      });
    });

    describe('highlightedColumns', function() {
      function getVisualizationDimStatus() {
        return _.reduce(directive.element.find('li'), function(acc, item) {
          var columnName = $(item).scope().visualization.sourceVif.columnName;
          acc[columnName] = $(item).hasClass('dim');
          return acc;
        }, {});
      }

      function getVisualizationHighlightStatus() {
        return _.reduce(directive.element.find('li'), function(acc, item) {
          var columnName = $(item).scope().visualization.sourceVif.columnName;
          acc[columnName] = $(item).find('.related-visualization-metadata').hasClass('highlight');
          return acc;
        }, {});
      }

      describe('when set to an empty array', function() {
        beforeEach(function() {
          directive.scope.highlightedColumns = [];
          directive.scope.$apply();
        });

        it('should not dim anything', function() {
          expect(getVisualizationDimStatus()).to.deep.equal({
            '1': false,
            '2': false,
            '3': false
          });
        });

        it('should not highlight anything', function() {
          expect(getVisualizationHighlightStatus()).to.deep.equal({
            '1': false,
            '2': false,
            '3': false
          });
        });
      });

      describe('when set to an array containing a fieldName', function() {
        beforeEach(function() {
          directive.scope.highlightedColumns = [ '2' ];
          directive.scope.$apply();
        });

        it('should dim the visualizations not based on that fieldName', function() {
          expect(getVisualizationDimStatus()).to.deep.equal({
            '1': true,
            '2': false,
            '3': true
          });
        });

        it('should highlight the visualization metadata that uses the fieldName', function() {
          expect(getVisualizationHighlightStatus()).to.deep.equal({
            '1': false,
            '2': true,
            '3': false
          });
        });
      });
    });
  });
});
