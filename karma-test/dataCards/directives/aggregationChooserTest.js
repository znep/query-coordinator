describe('<aggregation-chooser/>', function() {
  'use strict';

  var DEFAULT_ROW_DISPLAY_UNIT = 'unique row unit';
  var DEFAULT_COLUMNS = {
    column1_number: {
      name: 'test column title',
      description: 'test column description',
      fred: 'amount',
      physicalDatatype: 'number',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    },
    column2_number: {
      name: 'second test column title',
      description: 'second test column description',
      fred: 'amount',
      physicalDatatype: 'number',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    },
    column3_money: {
      name: 'third test column title',
      description: 'third test column description',
      fred: 'amount',
      physicalDatatype: 'money',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    },
    column4_text: {
      name: 'fourth test column title',
      description: 'fourth test column description',
      fred: 'text',
      physicalDatatype: 'text',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    }
  };
  var ELEMENT_HTML = '<aggregation-chooser page="page"></aggregation-chooser>';

  var testHelpers;
  var $rootScope;
  var Mockumentary;
  var $q;
  var $compile;
  var ServerConfig;
  var Constants;

  beforeEach(function() {
    module('/angular_templates/dataCards/aggregationChooser.html');
    module('socrataCommon.services');
    module('dataCards');
    module('test');
    module(function($provide) {
      var mockCardDataService = {
        getData: function(){ return $q.when([]);},
        getChoroplethRegions: function() { return {then: _.noop}; },
        getRowCount: function() { return {then: _.noop}; },
        getTimelineDomain: function() { return {then: _.noop}; }
      };
      $provide.value('CardDataService', mockCardDataService);
    });
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
      Mockumentary = $injector.get('Mockumentary');
      $q = $injector.get('$q');
      $compile = $injector.get('$compile');
      ServerConfig = $injector.get('ServerConfig');
      Constants = $injector.get('Constants');
    });
  });

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  /**
   * Create models for directive
   * @param options
   * @returns {{dataset: *, page: *}}
   */
  function createModels(options) {
    options = options || {};

    _.defaults(options, {
      primaryAggregation: null,
      primaryAmountField: null,
      rowDisplayUnit: DEFAULT_ROW_DISPLAY_UNIT,
      columns: DEFAULT_COLUMNS
    });

    var pageOptions = {
      primaryAggregation: options.primaryAggregation,
      primaryAmountField: options.primaryAmountField
    };
    var datasetOptions = {
      rowDisplayUnit: options.rowDisplayUnit,
      columns: options.columns
    };
    var pageModel = Mockumentary.createPage(pageOptions, datasetOptions);

    return {
      page: pageModel
    };
  }

  /**
   * Create an element
   * @param {Object} baseScope
   * @returns {*}
   */
  function createElement(baseScope) {
    var scope;
    var directive;
    var element = angular.element(ELEMENT_HTML);

    scope = $rootScope.$new();
    _.extend(scope, baseScope);
    directive = $compile(element)(scope);
    scope.$digest();
    return directive;
  }

  it('should exist when created', function() {
    var models = createModels();
    var subjectUnderTest = createElement({page: models.page });

    expect(subjectUnderTest).to.match('aggregation-chooser');
    expect(subjectUnderTest.find('.aggregation-chooser-static-label').text().toLowerCase()).to.contain(DEFAULT_ROW_DISPLAY_UNIT);
    expect(subjectUnderTest.find('.aggregation-chooser-trigger').text().toLowerCase()).to.contain(DEFAULT_ROW_DISPLAY_UNIT);
  });

  it('should toggle visibility when clicked', function() {
    var models = createModels();
    var subjectUnderTest = createElement({ page: models.page });

    testHelpers.fireMouseEvent(subjectUnderTest.find('.aggregation-chooser-trigger')[0], 'click');

    expect(subjectUnderTest.isolateScope().panelActive).to.be.true;
    expect(subjectUnderTest.find('.tool-panel-main')).to.have.class('active');
    testHelpers.fireMouseEvent(subjectUnderTest.find('.aggregation-chooser-trigger')[0], 'click');
    expect(subjectUnderTest.isolateScope().panelActive).to.be.false;
    expect(subjectUnderTest.find('.tool-panel-main')).to.not.have.class('active');
  });

  it('should close when clicked outside of it', function() {
    var models = createModels();
    var subjectUnderTest = createElement({page: models.page });

    testHelpers.TestDom.append(subjectUnderTest);
    $rootScope.$apply(function() {
      subjectUnderTest.isolateScope().panelActive = true;
    });
    testHelpers.fireMouseEvent($('#test-root')[0], 'click');

    expect(subjectUnderTest.isolateScope().panelActive).to.be.false;
    expect(subjectUnderTest.find('.tool-panel-main')).to.not.have.class('active');
  });

  it('should not close when its controls are clicked', function() {
    var models = createModels();
    var subjectUnderTest = createElement({page: models.page });

    testHelpers.TestDom.append(subjectUnderTest);
    $rootScope.$apply(function() {
      subjectUnderTest.isolateScope().panelActive = true;
    });

    $(subjectUnderTest).find('.aggregation-option').each(function() {
      testHelpers.fireMouseEvent(this, 'click');
      expect(subjectUnderTest.isolateScope().panelActive).to.be.true;
      expect(subjectUnderTest.find('.tool-panel-main')).to.have.class('active');
    });
  });

  it('should highlight when options are hovered', function() {
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'column1_number'});
    var subjectUnderTest = createElement({page: models.page });

    testHelpers.TestDom.append(subjectUnderTest);
    $rootScope.$apply(function() {
      subjectUnderTest.isolateScope().panelActive = true;
    });

    var body = document.getElementsByTagName('body')[0];
    var hoverTarget = subjectUnderTest.find('.aggregation-functions [data-aggregation-type="count"]');
    testHelpers.fireMouseEvent(hoverTarget[0], 'mousemove');
    expect(subjectUnderTest.find('.aggregation-functions [data-aggregation-type="count"]')).to.have.class('active');
    expect(subjectUnderTest.find('.aggregation-columns [data-aggregation-type="count"]')).to.have.class('active');
  });

  it('should set attributes on the page model correctly when changing the primary', function() {
    var models = createModels();
    var subjectUnderTest = createElement({page: models.page });

    $rootScope.$apply(function() {
      subjectUnderTest.isolateScope().panelActive = true;
    });

    expect(models.page.getCurrentValue('primaryAggregation')).to.equal(null);
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal(null);
    testHelpers.fireMouseEvent(subjectUnderTest.find('[data-aggregation-type="sum"]')[0], 'click');
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal('sum');
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal('column1_number');
    testHelpers.fireMouseEvent(subjectUnderTest.find('[data-column-id="column2_number"]')[0], 'click');
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal('sum');
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal('column2_number');
    testHelpers.fireMouseEvent(subjectUnderTest.find('[data-aggregation-type="count"]')[0], 'click');
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal('count');
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal(null);
  });

  it('should only include money and number columns in the dropdown', function() {
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'column1_number' });
    var subjectUnderTest = createElement({ page: models.page });

    var columnEntriesWhereCountIsSupported = subjectUnderTest.find('.aggregation-columns.count');

    // 2 number columns (column, column2_number) and 1 money column (column3_money).
    expect(subjectUnderTest.find('[data-column-id]').length).to.equal(3);
    expect(subjectUnderTest.find('[data-column-id="column1_number"]').length).to.equal(1);
    expect(subjectUnderTest.find('[data-column-id="column2_number"]').length).to.equal(1);
    expect(subjectUnderTest.find('[data-column-id="column3_money"]').length).to.equal(1);
  });

  it('should not include field names specified in the field_names_that_cannot_be_aggregated feature flag in the dropdown', function() {
    ServerConfig.override('fieldNamesThatCannotBeAggregated', ['column2_number']);
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'column1_number' });
    var subjectUnderTest = createElement({ page: models.page });
    var columnEntriesWhereCountIsSupported = subjectUnderTest.find('.aggregation-columns.count');

    // expect only column2_number to be omitted
    expect(subjectUnderTest.find('[data-column-id]').length).to.equal(2);
    expect(subjectUnderTest.find('[data-column-id="column1_number"]').length).to.equal(1);
    expect(subjectUnderTest.find('[data-column-id="column2_number"]').length).to.equal(0);
    expect(subjectUnderTest.find('[data-column-id="column3_money"]').length).to.equal(1);
  });

  it('should fallback to including all money and number columns if field_names_that_cannot_be_aggregated feature flag is invalid', function() {
    ServerConfig.override('fieldNamesThatCannotBeAggregated', 'blah blah blah');
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'column1_number' });
    var subjectUnderTest = createElement({ page: models.page });
    var columnEntriesWhereCountIsSupported = subjectUnderTest.find('.aggregation-columns.count');

    expect(subjectUnderTest.find('[data-column-id]').length).to.equal(3);
    expect(subjectUnderTest.find('[data-column-id="column1_number"]').length).to.equal(1);
    expect(subjectUnderTest.find('[data-column-id="column2_number"]').length).to.equal(1);
    expect(subjectUnderTest.find('[data-column-id="column3_money"]').length).to.equal(1);
  });


  it('should select the appropriate aggregation function if one is present', function() {
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'column1_number' });
    var subjectUnderTest = createElement({page: models.page });

    expect(subjectUnderTest.find('[data-aggregation-type="sum"]')).to.have.class('active');
    expect(subjectUnderTest.find('[data-column-id="column1_number"]')).to.have.class('active');
  });

  it('should display a flyout for invalid selections', function() {
    var models = createModels();
    var subjectUnderTest = createElement({page: models.page });

    testHelpers.TestDom.append(subjectUnderTest);
    $rootScope.$apply(function() {
      subjectUnderTest.isolateScope().panelActive = true;
    });

    var body = document.getElementsByTagName('body')[0];
    var hoverTarget = subjectUnderTest.find('.aggregation-columns .disabled');
    testHelpers.fireMouseEvent(hoverTarget[0], 'mousemove');

    var flyout = $('#uber-flyout');
    expect(flyout).to.exist;
    expect(flyout.text()).to.match(/this column cannot be used with a/i);
  });

  it('should not be a dropdown if there are no number or money fields', function() {
    var models = createModels({
      columns: {
        pointMap_column: {
          name: 'pointMap_column',
          fred: 'location',
          physicalDatatype: 'point',
          defaultCardType: 'feature',
          availableCardTypes: ['feature']
        },
        search_column: {
          name: 'search_column',
          fred: 'text',
          physicalDatatype: 'text',
          defaultCardType: 'search',
          availableCardTypes: ['column', 'search']
        },
        '*': {
          name: 'table',
          description: 'table',
          fred: '*',
          physicalDatatype: '*',
          defaultCardType: 'table',
          availableCardTypes: ['table']
        }
      }
    });
    var subjectUnderTest = createElement({page: models.page });

    testHelpers.TestDom.append(subjectUnderTest);
    expect(subjectUnderTest.find('.aggregation-chooser-static-label')).to.be.visible;
    expect(subjectUnderTest.find('.aggregation-chooser-trigger')).to.not.be.visible;
  });

  it('should not be a dropdown if there are more than 15 number or money fields', function() {
    var columns = {};
    var numberColumns = Constants.AGGREGATION_MAX_COLUMN_COUNT + 2;
    var moneyThreshold = Math.floor(numberColumns / 2);
    _.each(_.range(numberColumns), function(value, index) {
      var column = {
        name: 'column_{0}'.format(value),
        description: 'test column description - {0}'.format(value),
        fred: 'amount',
        physicalDatatype: index > moneyThreshold ? 'money' : 'number',
        defaultCardType: 'column',
        availableCardTypes: ['column', 'search']
      };
      columns[column.name] = column;
    });
    var models = createModels({ columns: columns });
    var subjectUnderTest = createElement({page: models.page });

    testHelpers.TestDom.append(subjectUnderTest);
    expect(subjectUnderTest.find('.aggregation-chooser-static-label')).to.be.visible;
    expect(subjectUnderTest.find('.aggregation-chooser-trigger')).to.not.be.visible;
  });
});
