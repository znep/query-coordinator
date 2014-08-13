describe('table', function() {
  "use strict";
  var blockSize = 50; // The table loads chunks of this size. The tests shouldn't really know, but they do for now.
  var testJson = 'karma-test/dataCards/test-data/tableTest/test-rows.json';
  var testMetaJson = 'karma-test/dataCards/test-data/tableTest/test-meta.json';
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));
  beforeEach(module(testJson));
  beforeEach(module(testMetaJson));

  var testHelpers, q, scope, data, reversedData, metaData, columnCount;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    q = $injector.get('$q');
    scope = $injector.get('$rootScope').$new();
    data = testHelpers.getTestJson(testJson);
    reversedData = [].concat(data).reverse();
    metaData = testHelpers.getTestJson(testMetaJson);
  }));
  function createTableCard(expanded, getRows) {
    if (!expanded) expanded = false;
    var html =
      '<div class="card ' + (expanded ? 'expanded': '') + '" style="width: 640px; height: 480px;">' +
        '<div table class="table" row-count="rowCount" get-rows="getRows" where-clause="whereClause" filtered-row-count="filteredRowCount" expanded="expanded" column-details="columnDetails"></div>' +
      '</div>';
    var compiledElem = testHelpers.TestDom.compileAndAppend(html, scope);
    scope.expanded = expanded;
    scope.rowCount = 200;
    scope.filteredRowCount = 170;
    scope.columnDetails = {};
    columnCount = 0;
    _.each(metaData.columns, function(column) {
      if (column.name[0].match(/[a-zA-Z0-9]/g)) {
        column.sortable = true;
        scope.columnDetails[column.name] = column;
        columnCount += 1;
      }
    });
    if(getRows) {
      scope.getRows = getRows;
    } else {
      scope.getRows = function() {
        return q.when(data);
      };
    }
    scope.$digest();
    return compiledElem;
  };

  function destroyAllTableCards() {
    testHelpers.TestDom.clear();
  };
  describe('when not expanded', function() {
    it('should create', function() {
      var el = createTableCard(false);
      expect(el.find('.expand-message')).to.not.be.empty;
      destroyAllTableCards();
    });
  });
  describe('when expanded', function() {
    after(function() {
      destroyAllTableCards();
    });
    var immutableTable;
    before(function() {
      immutableTable = createTableCard(true);
    });
    it('should create and load data', function() {
      expect(immutableTable.find('.row-block .cell').length).to.equal(columnCount * blockSize * 3);
      expect(immutableTable.find('.th').length).to.equal(columnCount);
    });
    it('should format numbers correctly', function() {
      _.each(immutableTable.find('.row-block .cell'), function(cell, i) {
        var column = metaData.columns[$(cell).index()];
        var datatype = column.physicalDatatype;
        if (datatype === 'number') {
          expect($(cell).hasClass('number')).to.equal(true);
        }
      });
    });
    it('should load more rows upon scrolling', function(done) {
      var el = createTableCard(true);
      expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 3);
      $(el).find('.table-body').scrollTop($.relativeToPx('2rem')*51);
      _.defer(function() {
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 4);
        el.remove();
        done();
      });
    });
    describe('sorting', function() {
      var sortableTable = null;
      var rowCount = 5;
      var lastSort = null;
      // Fake data source. If the order is empty or ASC on any column, returns
      // the stub data. Otherwise, returns reversedData.
      function fakeDataSource(offset, limit, order, timeout, whereClause) {
        lastSort = order;

        if (offset > 0) return q.when([]);
        if (_.isEmpty(order) || order.indexOf('ASC') >= 0) {
          return q.when(_.take(data, rowCount));
        } else {
          return q.when(_.take(reversedData, rowCount));
        }
      };

      function getSortableTable() {
        if (!sortableTable) {
          sortableTable = createTableCard(true, fakeDataSource);
        }
        return sortableTable;
      };

      function verifySortingWithSortApplicator(columnIndexToClick, applicatorFunction) {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnMeta = metaData.columns[columnIndexToClick];
        // Sanity check - make sure our test data has different values in the first and
        // last row, otherwise we can't check the sort order.
        expect(_.last(data)[columnMeta.name]).to.not.equal(_.first(data)[columnMeta.name]);

        var computeDisplayedValue = columnMeta.physicalDatatype === 'number' ? $.commaify : _.identity;

        var el = getSortableTable();

        // Value in corresponding cell matches with first data item?
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(computeDisplayedValue(_.first(data)[columnMeta.name]));

        // Apply a sort. Expect it to be DESC
        applicatorFunction(el);


        expect(lastSort).to.equal(columnMeta.name + ' DESC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with last data item (since we're sorting in reverse).
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(computeDisplayedValue(_.last(data)[columnMeta.name]));

        // Now, reverse the sort.
        applicatorFunction(el);


        expect(lastSort).to.equal(columnMeta.name + ' ASC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with first data item (since we're sorting normally).
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(computeDisplayedValue(_.first(data)[columnMeta.name]));
      };

      it('should be able to sort using the header', function() {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnIndexToClick = 0;
        var columnMeta = metaData.columns[columnIndexToClick];

        verifySortingWithSortApplicator(columnIndexToClick, function(el) {
          var header = el.find('.th').eq(columnIndexToClick);
          expect(header.text().trim()).to.equal(columnMeta.title);

          header.click();
        });
      });

      it('should be able to sort using the flyout', function() {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnIndexToClick = 1;
        var columnMeta = metaData.columns[columnIndexToClick];

        verifySortingWithSortApplicator(columnIndexToClick, function(el) {
          el.find('.th').eq(columnIndexToClick).trigger('mouseenter');
          expect($('.flyout a').length).to.equal(1);
          $('.flyout a').click();
          scope.$digest();
        });
      });
    });

    it('should be able to filter', function(done) {
      var filteredData = _.take(data, 3);
      var unfilteredData = _.last(data, 6);
      var firstColumnName = metaData.columns[0].name;
      // Sanity check for test data - we need the first rows of filtered/unfiltered to be different in at least
      // their first column's value for the tests to work.
      expect(_.first(unfilteredData)[firstColumnName]).to.not.equal(_.first(filteredData)[firstColumnName]);

      var lastWhereClause = null;
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        lastWhereClause = whereClause;
        if (offset > 0) return q.when([]);
        if ($.isPresent(lastWhereClause)) {
          return q.when(filteredData);
        } else {
          return q.when(unfilteredData);
        }
      });

      scope.$digest();
      expect(el.find('.th').length).to.equal(columnCount);
      expect(el.find('.row-block .cell').length).to.equal(columnCount * unfilteredData.length);
      expect(lastWhereClause).to.be.undefined; // as opposed to null, which lastWhereClause is initialized to.
      // Verify first cell (= first column of first row).
      expect(el.find('.row-block .cell').eq(0).text()).to.equal($.commaify(_.first(unfilteredData)[firstColumnName]));

      scope.whereClause = 'district=004';
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * filteredData.length);
        expect(lastWhereClause).to.equal('district=004');
        // Verify first cell (= first column of first row).
        expect(el.find('.row-block .cell').eq(0).text()).to.equal($.commaify(_.first(filteredData)[firstColumnName]));
        el.remove();
        done();
      });
    });
  });
});
