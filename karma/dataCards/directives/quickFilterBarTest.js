describe('quickFilterBar', function() {
  'use strict';

  var self;
  var $provide;
  var testHelpers;
  var dependencies = [
    '$rootScope',
    'Filter',
    'ServerConfig',
    'Mockumentary'
  ];

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(angular.mock.module(function(_$provide_) {
    $provide = _$provide_;
  }));

  beforeEach(inject(function($injector) {
    self = this;
    testHelpers = $injector.get('testHelpers');
    testHelpers.injectDependencies(this, dependencies);
    testHelpers.mockDirective($provide, 'aggregationChooser');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function createQuickFilterBar(pageProps, datasetProps) {
    testHelpers.TestDom.clear();
    self.$scope = self.$rootScope.$new();
    self.$scope.page = self.Mockumentary.createPage(pageProps, datasetProps);
    self.$scope.dataset = self.$scope.page.getCurrentValue('dataset');
    self.element = testHelpers.TestDom.compileAndAppend('<quick-filter-bar></quick-filter-bar>', self.$scope);
    setCards('field1');
  }

  // e.g. setCards('fieldName1', 'fieldName2');
  function setCards() {
    var cards = _.map(arguments, function(fieldName) {
      return self.Mockumentary.createCard(self.$scope.page, fieldName);
    });

    self.$scope.page.set('cards', cards);

    return cards;
  }

  describe('quickFilterBarTitle', function() {
    it('should contain the correct title if the page is not filtered', function() {
      createQuickFilterBar();

      expect(self.element.scope().quickFilterBarTitle).to.equal(
        'Showing <span class="light">all rows</span>'
      );
    });

    it('should contain the correct title if the page is filtered', inject(function(Filter) {
      createQuickFilterBar();
      var cards = setCards('field1');
      cards[0].set('activeFilters', [ new self.Filter.IsNullFilter(true) ]);
      expect(self.element.scope().quickFilterBarTitle).to.equal(
        'Showing <span class="light">rows</span>'
      );
    }));
  });

  describe('appliedFiltersForDisplay', function() {
    it('should be empty if no card filters are applied and no base filter is applied', function() {
      createQuickFilterBar();
      setCards('field1', 'field2');
      expect(self.element.scope().appliedFiltersForDisplay).to.be.empty;
    });

    it('should be empty if a base filter is applied', function() {
      createQuickFilterBar();
      setCards('field1', 'field2');
      self.$scope.page.set('baseSoqlFilter', 'something=nothing');
      expect(self.element.scope().appliedFiltersForDisplay).to.be.empty;
    });

    it('should clear filters when clearAllFilters is called', function() {
      createQuickFilterBar();
      var cards = setCards('field1', 'field2');
      var nullFilter = new self.Filter.IsNullFilter(true);
      var binaryFilter = new self.Filter.BinaryOperatorFilter('=', 'pony');

      // Apply filters
      self.$scope.$apply(function() {
        cards[0].set('activeFilters', [nullFilter]);
        cards[1].set('activeFilters', [binaryFilter]);
      });

      expect(self.element.scope().appliedFiltersForDisplay).to.have.length(2);

      // Clear filters
      self.element.scope().clearAllFilters();

      expect(self.element.scope().appliedFiltersForDisplay).to.be.empty;
      expect(cards[0].getCurrentValue('activeFilters')).to.be.empty;
      expect(cards[1].getCurrentValue('activeFilters')).to.be.empty;
    });

    it('should register a flyout for the "Clear All" button', function() {
      createQuickFilterBar();

      var filter = new self.Filter.IsNullFilter(true);
      self.$scope.page.getCurrentValue('cards')[0].set('activeFilters', [filter]);

      expect($('.flyout-title').length).to.equal(0);

      testHelpers.fireMouseEvent(self.element.find('.clear-all-filters-button')[0], 'mousemove');

      var flyout = $('.flyout-title');
      expect(flyout).to.exist;
      expect(flyout.text()).to.contain('Click to reset all filters');

      testHelpers.fireMouseEvent(self.element.find('.clear-all-filters-button .icon-close')[0], 'mousemove');

      expect(flyout).to.exist;
      expect(flyout.text()).to.contain('Click to reset all filters');
    });

    it('should contain data that corresponds to the filters on the cards', function() {
      createQuickFilterBar();
      var cards = setCards('field1', 'field2', 'field2');
      var filterOne = new self.Filter.IsNullFilter(false);
      var filterTwo = new self.Filter.BinaryOperatorFilter('=', 'test');
      var $scope = self.element.scope();

      // Just one card
      cards[0].set('activeFilters', [ filterOne ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);

      // Two filtered cards
      cards[1].set('activeFilters', [ filterTwo ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not', 'is' ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', filterTwo.operand ]);

      // One filtered card, with two filters.
      cards[0].set('activeFilters', [ filterOne, filterTwo ]);
      cards[1].set('activeFilters', []);
      expect(_.map($scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);

      // Two identical filtered cards
      cards[0].set('activeFilters', []);
      cards[1].set('activeFilters', [ filterOne ]);
      cards[2].set('activeFilters', [ filterTwo ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not', 'is' ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', filterTwo.operand ]);
    });

    it('should render a whitespace-only operand filter the same way as a null filter', function() {
      createQuickFilterBar();
      var cards = setCards('field1', 'field2', 'field2');
      var filterOne = new self.Filter.IsNullFilter(true);
      var filterTwo = new self.Filter.BinaryOperatorFilter('=', ' ');
      var $scope = self.element.scope();

      cards[0].set('activeFilters', [ filterOne ]);
      cards[1].set('activeFilters', [ filterTwo ]);

      expect(_.map($scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is', 'is' ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', 'blank' ]);

      // Two identical filtered cards
      cards[0].set('activeFilters', []);
      cards[1].set('activeFilters', [ filterOne ]);
      cards[2].set('activeFilters', [ filterTwo ]);

      expect(_.map($scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is', 'is' ]);
      expect(_.map($scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', 'blank' ]);
    });
  });
});
