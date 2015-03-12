describe('<aggregation-chooser/>', function() {
  'use strict';

  var DEFAULT_ROW_DISPLAY_UNIT = 'unique row unit';
  var ELEMENT_HTML = '<aggregation-chooser page="page"></aggregation-chooser>';
  var testHelpers;
  var $rootScope;
  var Model;
  var Page;
  var AngularRxExtensions;
  var $q;
  var $compile;

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
      Model = $injector.get('Model');
      Page = $injector.get('Page');
      AngularRxExtensions = $injector.get('AngularRxExtensions');
      $q = $injector.get('$q');
      $compile = $injector.get('$compile');
    });
  });

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  /**
   * Create duck-typed Dataset model
   * @param {Object} options
   * @returns {Model}
   */
  function createDatasetModel(options) {
    var datasetModel = new Model();

    options = options || {};
    _.defaults(options, {
      rowDisplayUnit: DEFAULT_ROW_DISPLAY_UNIT,
      columns: {
        statBar_column: {
          name: 'test column title',
          description: 'test column description',
          fred: 'amount',
          physicalDatatype: 'number',
          importance: 2
        },
        statBar_column2: {
          name: 'second test column title',
          description: 'second test column description',
          fred: 'amount',
          physicalDatatype: 'number',
          importance: 2
        }
      }
    });
    _.forOwn(options.columns, function(column) {
      column.dataset = datasetModel;
    });
    datasetModel.id = 'rant-lerz';
    datasetModel.fieldName = 'ward';
    datasetModel.version = '1';
    datasetModel.defineObservableProperty('rowDisplayUnit', options.rowDisplayUnit);
    datasetModel.defineObservableProperty('columns', options.columns);

    return datasetModel;
  }

  /**
   * Create a page model with defaults
   * @param {Model} datasetModel
   * @param {Object} options
   * @returns {Page}
   */
  function createPageModel(datasetModel, options) {
    options = options || {};
    _.defaults(options, {
      primaryAmountField: null,
      primaryAggregation: null
    });
    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('primaryAmountField', options.primaryAmountField);
    pageModel.set('primaryAggregation', options.primaryAggregation);
    pageModel.set('cards', []);

    return pageModel;
  }

  /**
   * Create models for directive
   * @param options
   * @returns {{dataset: *, page: *}}
   */
  function createModels(options) {
    options = options || {};
    var datasetModel = createDatasetModel({
      rowDisplayUnits: options.rowDisplayUnits,
      columns: options.columns
    });
    var pageModel = createPageModel(datasetModel, {
      primaryAmountField: options.primaryAmountField,
      primaryAggregation: options.primaryAggregation
    });

    return {
      dataset: datasetModel,
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
    var subjectUnderTest = createElement(
      { page: models.page }
    );
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

  it('should highlight when options are hovered', function() {
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'statBar_column'});
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

  it('should set attributes on the Page model correctly', function() {
    var models = createModels();
    var subjectUnderTest = createElement({page: models.page });
    $rootScope.$apply(function() {
      subjectUnderTest.isolateScope().panelActive = true;
    });
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal(null);
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal(null);
    testHelpers.fireMouseEvent(subjectUnderTest.find('[data-aggregation-type="sum"]')[0], 'click');
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal('sum');
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal('statBar_column');
    testHelpers.fireMouseEvent(subjectUnderTest.find('[data-column-id="statBar_column2"]')[0], 'click');
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal('sum');
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal('statBar_column2');
    testHelpers.fireMouseEvent(subjectUnderTest.find('[data-aggregation-type="count"]')[0], 'click');
    expect(models.page.getCurrentValue('primaryAggregation')).to.equal('count');
    expect(models.page.getCurrentValue('primaryAmountField')).to.equal(null);
  });

  it('should select the appropriate aggregation function if one is present', function() {
    var models = createModels({ primaryAggregation: 'sum', primaryAmountField: 'statBar_column' });
    var subjectUnderTest = createElement({page: models.page });
    expect(subjectUnderTest.find('[data-aggregation-type="sum"]')).to.have.class('active');
    expect(subjectUnderTest.find('[data-column-id="statBar_column"]')).to.have.class('active');
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

  it('should not be a dropdown if there are no number fields', function() {
    var models = createModels({
      columns: {
        pointMap_column: {
          name: 'pointMap_column',
          fred: 'location',
          physicalDatatype: 'point'
        },
        search_column: {
          name: 'search_column',
          fred: 'text',
          physicalDatatype: 'text'
        },
        '*': {
          fred: '*'
        }
      }
    });
    var subjectUnderTest = createElement({page: models.page });
    testHelpers.TestDom.append(subjectUnderTest);
    expect(subjectUnderTest.find('.aggregation-chooser-static-label')).to.be.visible;
    expect(subjectUnderTest.find('.aggregation-chooser-trigger')).to.not.be.visible;
  });

  it('should not be a dropdown if there are more than 10 number fields', function() {
    var columns = {};
    _.each(_.range(12), function(value) {
      var column = {
        name: 'column_{0}'.format(value),
        title: 'test column title - {0}'.format(value),
        description: 'test column description - {0}'.format(value),
        fred: 'amount',
        physicalDatatype: 'number',
        importance: 2
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
