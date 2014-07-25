describe('table', function() {

  var testJson = 'karma-test/dataCards/test-data/tableTestRows.json';
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module(testJson));

  var testHelpers, q, scope, data;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    q = $injector.get('$q');
    scope = $injector.get('$rootScope').$new();
    data = testHelpers.getTestJson(testJson);
  }));
  afterEach(function() {
    testHelpers.TestDom.clear();
  });
  var createTableCard = function(expanded, getRows) {
    if (!expanded) expanded = false;
    var html =
      '<div class="card ' + (expanded ? 'expanded': '') + '" style="width: 640px; height: 480px;">' +
        '<div table class="table" row-count="rowCount" get-rows="getRows" where-clause="whereClause" filtered-row-count="filteredRowCount" expanded="expanded"></div>' +
      '</div>';
    var compiledElem = testHelpers.TestDom.compileAndAppend(html, scope);
    scope.expanded = expanded;
    scope.rowCount = 200;
    scope.filteredRowCount = 170;
    if(getRows) {
      scope.getRows = getRows;
    } else {
      scope.getRows = function() {
        return q.when(data);
      }
    }
    scope.$digest();
    return compiledElem;
  }
  describe('when not expanded', function() {
    it('should create', function() {
      var el = createTableCard(false);
    });
  });
  describe('when expanded', function() {
    it('should create and load data', function(done) {
      var el = createTableCard(true);
      var columnCount = _.keys(data[0]).length;
      _.defer(function() {
        scope.$digest();
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        expect($('.th').length).to.equal(columnCount);
        done();
      });
    });
    it('should be able to scroll', function(done) {
      var el = createTableCard(true);
      $(el).find('.table-body').scrollTop($.relativeToPx('2rem')*51);
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 200);
        done();
      });
    });
    it('should be able to sort using the caret', function(done) {
      var sort = '';
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        sort = order;
        return q.when(data);
      });
      $(el).find('.caret').eq(0).click();
      expect($('.row-block .cell').length).to.equal(0);
      expect(sort).to.equal('beat DESC');
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        done();
      });
    });
    it('should be able to sort using the flyout', function(done) {
      var sort = '';
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        sort = order;
        return q.when(data);
      });
      $(el).find('.th').eq(0).trigger('mouseenter');
      expect($('.flyout a').length).to.equal(1);
      $('.flyout a').click();
      expect($('.row-block .cell').length).to.equal(0);
      expect(sort).to.equal('beat DESC');
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        done();
      });
    });
    it('should be able to sort ASC', function() {
      var sort = '';
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        sort = order;
        return q.when(data);
      });
      expect(sort).to.equal('');
      $(el).find('.caret').eq(0).click();
      expect(sort).to.equal('beat DESC');
      scope.$digest();
      $(el).find('.caret').eq(0).click();
      expect(sort).to.equal('beat ASC');
    });
    it('should be able to filter', function(done) {
      var hasCorrectWhereClause = false;
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        if(!hasCorrectWhereClause) hasCorrectWhereClause = whereClause == 'district=004';
        return q.when(data);
      });
      scope.$digest();
      scope.whereClause = 'district=004';
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        expect(hasCorrectWhereClause).to.equal(true);
        done();
      });
    });
    it('should format numbers correctly', function(done) {
      var el = createTableCard(true);
      var columnCount = _.keys(data[0]).length;
      _.defer(function() {
        scope.$digest();
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        expect($('.th').length).to.equal(columnCount);
        _.each($('.row-block .cell'), function(cell) {
          var text = $(cell).text();
          // TODO: Use metadata to determine if should be number.
          var stripped = text.replace(/,/g, '');
          if (!_.isNaN(Number(stripped))) {
            expect($(cell).hasClass('number')).to.be.true;
          }
        });
        done();
      });
    });
  });
});
