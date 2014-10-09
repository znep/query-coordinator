
describe('table', function() {

  function createTableCard(expanded, getRows) {

    outerScope.expanded = expanded || false;
    outerScope.rowCount = 200;
    outerScope.filteredRowCount = 170;
    outerScope.columnDetails = {};

    columnCount = 0;

    _.each(fixtureMetadata.columns, function(column) {
      if (column.name[0].match(/[a-zA-Z0-9]/g)) {
        column.sortable = true;
        outerScope.columnDetails[column.name] = column;
        columnCount += 1;
      }
    });

    // Provide a default sort column. It's a text/category column, so the default sort
    // order is ASC.
   outerScope.defaultSortColumnName = outerScope.columnDetails[fixtureMetadata.columns[beatColumnIndex].name].name;
    if (getRows) {
      outerScope.getRows = getRows;
    } else {
      outerScope.getRows = function() {
        return $q.when(fixtureData);
      };
    }
    outerScope.$digest();

    var html =
      '<div class="card {0}" style="width: 640px; height: 480px;">' +
        '<div table class="table" row-count="rowCount" get-rows="getRows" where-clause="whereClause" ' +
        'filtered-row-count="filteredRowCount" expanded="expanded" column-details="columnDetails" ' +
        'default-sort-column-name="defaultSortColumnName"></div>' +
      '</div>'.format(expanded ? 'expanded': '');
    
    var compiledElem = testHelpers.TestDom.compileAndAppend(html, outerScope);

    return compiledElem;
  }

  function destroyAllTableCards() {
    testHelpers.TestDom.clear();
  }

  // Fake data source. If the order is empty or ASC on any column, returns
  // the stub data. Otherwise, returns reversedData.
  function fakeDataSource(offset, limit, order, timeout, whereClause) {
    lastSort = order;

    if (offset > 0) return $q.when([]);

    if (_.isEmpty(order) || order.indexOf('ASC') >= 0) {
      return $q.when(_.take(fixtureData, rowCount));
    } else {
      return $q.when(_.take(reversedFixtureData, rowCount));
    }
  }

  var testHelpers;
  var $rootScope;
  var outerScope;
  var $q;
  var fixtureData;
  var reversedFixtureData;
  var fixtureMetadata;
  var testJson = 'karma-test/dataCards/test-data/tableTest/test-rows.json';
  var testMetaJson = 'karma-test/dataCards/test-data/tableTest/test-meta.json';
  var blockSize = 50; // The table loads chunks of this size. The tests shouldn't really know, but they do for now.
  var columnCount;
  var rowCount = 5;
  var lastSort = null;
  var idColumnIndex = 8;
  var beatColumnIndex = 0;
  var dateColumnIndex = 4;
  var descriptionColumnIndex = 5;

  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(module(testJson));
  beforeEach(module(testMetaJson));

  beforeEach(inject(function($injector) {
    try {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
      outerScope = $rootScope.$new();
      $q = $injector.get('$q');
      fixtureData = testHelpers.getTestJson(testJson);
      reversedFixtureData = [].concat(fixtureData).reverse();
      fixtureMetadata = testHelpers.getTestJson(testMetaJson);
    } catch (e) {
      console.log(e);
    }
  }));

  describe('when rendering cell data', function() {

    it('should render point cells with latitude & longitude', function(done) {
      var el = createTableCard(true, fakeDataSource);
      var pointCell = el.find('.table-row .cell.point').first();
      var cellContent = pointCell.html();

      expect(cellContent).to.match(/span.*Longitude.*-122\.511054.*\/span/);
      expect(cellContent).to.match(/span.*Latitude.*37\.771343.*\/span.*,/);
      done();
    });

    it('should render timestamp cells with date & time as YYYY MMM DD HH:mm:ss', function(done) {
      var el = createTableCard(true, fakeDataSource);
      var timestampCell = el.find('.table-row .cell.timestamp').first();

      expect(timestampCell.html()).to.match(/\d{4}\s\w{3}\s\d{2}\s\d{2}:\d{2}:\d{2}/);
      done();
    });

    it('should render number cells with commas when number of digits is greater than 4', function(done) {
      var el = createTableCard(true, fakeDataSource);
      var timestampCell = el.find('.table-row .cell.number').first();
      var cellContent = timestampCell.html();

      expect(cellContent).to.match(/\d+,\d+/);
      expect(cellContent.length).to.equal('12,345'.length);
      done();
    });

  });

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
      _.each(immutableTable.find('.row-block .cell'), function(cell) {
        var column = fixtureMetadata.columns[$(cell).index()];
        var datatype = column.physicalDatatype;
        if (datatype === 'number') {
          expect($(cell).hasClass('number')).to.equal(true);
        }
      });
    });

    it('should load more rows upon scrolling', function(done) {
      this.timeout(20000); // IE10!
      var el = createTableCard(true);
      var tableBody = el.find('.table-body');
      _.defer(function(){
        expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 3);
        tableBody.scroll(function() {
          _.defer(function() {
            expect(el.find('.th').length).to.equal(columnCount);
            expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 4);
            el.remove();
            done();
          });
        });
        var originalScrollTop = tableBody.scrollTop();
        var targetScrollTop = $.relativeToPx('2rem') * (blockSize + 1);

        if (originalScrollTop === targetScrollTop) {
          throw new Error('Test implementation error - we expect to be triggering a scroll here, but apparently the content is already scrolled to where we want to go. We do not want this. The scroll pos was: ' + targetScrollTop);
        }

        tableBody.scrollTop($.relativeToPx('2rem') * (blockSize + 1));
      });
    });

    describe('sorting', function() {
      var sortableTable = null;

      function getSortableTable() {
        if (!sortableTable) {
          sortableTable = createTableCard(true, fakeDataSource);
        }

        return sortableTable;
      }

      function verifySortingWithSortApplicator(columnIndexToClick, applicatorFunction) {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnMeta = fixtureMetadata.columns[columnIndexToClick];
        // Sanity check - make sure our test data has different values in the first and
        // last row, otherwise we can't check the sort order.
        expect(_.last(fixtureData)[columnMeta.name]).to.not.equal(_.first(fixtureData)[columnMeta.name]);

        var computeDisplayedValue = columnMeta.physicalDatatype === 'number' ? $.commaify : _.identity;
        var el = getSortableTable();

        // Value in corresponding cell matches with first data item?
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(computeDisplayedValue(_.first(fixtureData)[columnMeta.name]));

        // Apply a sort. Expect it to be DESC
        applicatorFunction(el);
        $rootScope.$digest();

        //NOTE: this assumes the column defaults to a DESC sort. Not always true, see story 5.04 for details.
        expect(lastSort).to.equal(columnMeta.name + ' DESC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with last data item (since we're sorting in reverse).
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(computeDisplayedValue(_.last(fixtureData)[columnMeta.name]));

        // Now, reverse the sort.
        applicatorFunction(el);
        $rootScope.$digest();

        expect(lastSort).to.equal(columnMeta.name + ' ASC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with first data item (since we're sorting normally).
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(computeDisplayedValue(_.first(fixtureData)[columnMeta.name]));
      }

      it('should only reflect the first value of the default sort', function() {
        var el = getSortableTable();
        var defaultSortColumnName = el.scope().defaultSortColumnName;
        expect(lastSort).to.equal(defaultSortColumnName + ' ASC');

        el.scope().defaultSortColumnName = 'bad';
        $rootScope.$digest();
        expect(lastSort).to.equal(defaultSortColumnName + ' ASC'); // shouldn't change
      });

      it('should be able to sort using the header', function() {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnIndexToClick = 0;
        var columnMeta = fixtureMetadata.columns[columnIndexToClick];

        verifySortingWithSortApplicator(columnIndexToClick, function(el) {
          var header = el.find('.th').eq(columnIndexToClick);

          expect(header.text().trim()).to.equal(columnMeta.title);
          header.click();
        });
      });

      it('should be able to sort using the flyout', function() {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnIndexToClick = 0;

        verifySortingWithSortApplicator(columnIndexToClick, function(el) {
          el.find('.th').eq(columnIndexToClick).trigger('mouseenter');
          expect($('.flyout a').length).to.equal(1);
          $('.flyout a').click();
        });

        $('.flyout').remove();
      });

      it('should not sort when clicking the header resize thumb', function() {
        var origSort = lastSort;

        getSortableTable().find('.th .resize').eq(beatColumnIndex).click();
        $rootScope.$digest();
        expect(lastSort).to.equal(origSort);
      });

      it('should not show flyout when hovering over the header resize handle', function() { // CORE-3140
        getSortableTable().find('.th .resize').eq(beatColumnIndex).mouseover();
        $rootScope.$digest();
        expect($('.flyout').length).to.equal(0);
      });

      describe('toggling sort on an unsorted column', function() {

        it('should be correct for numbers', function() {
          getSortableTable().find('.th').eq(idColumnIndex).click();
          $rootScope.$digest();
          getSortableTable().find('.th').eq(idColumnIndex).click();
          $rootScope.$digest();
          expect(lastSort).to.match(/ ASC/);
        });

        it('should be correct for text', function() {
          getSortableTable().find('.th').eq(beatColumnIndex).click();
          $rootScope.$digest();
          getSortableTable().find('.th').eq(beatColumnIndex).click();
          $rootScope.$digest();
          expect(lastSort).to.match(/ DESC/);
        });

        it('should be correct for dates', function() {
          getSortableTable().find('.th').eq(dateColumnIndex).click();
          $rootScope.$digest();
          getSortableTable().find('.th').eq(dateColumnIndex).click();
          $rootScope.$digest();
          expect(lastSort).to.match(/ ASC/);
        });

      });

      describe('default sort', function() {

        it('should be correct for numbers', function() {
          getSortableTable().find('.th').eq(idColumnIndex).click();
          $rootScope.$digest();
          expect(lastSort).to.match(/ DESC$/);
        });

        it('should be correct for text', function() {
          getSortableTable().find('.th').eq(beatColumnIndex).click();
          $rootScope.$digest();
          expect(lastSort).to.match(/ ASC/);
        });

        it('should be correct for dates', function() {
          getSortableTable().find('.th').eq(dateColumnIndex).click();
          $rootScope.$digest();
          expect(lastSort).to.match(/ DESC$/);
        });

      });

      describe('sort hint caret', function() {

        it('should be correct for numbers', function() {
          expect(immutableTable.find('.th').eq(idColumnIndex).find('.caret')[0].className).to.not.have.string('sortUp');
        });

        it('should be correct for text', function() {
          expect(immutableTable.find('.th').eq(beatColumnIndex).find('.caret')[0].className).to.have.string('sortUp');
        });

        it('should be correct for dates', function() {
          expect(immutableTable.find('.th').eq(dateColumnIndex).find('.caret')[0].className).to.not.have.string('sortUp');
        });

      });

      describe('sort hint text', function() {

        afterEach(function() {
          $('.flyout').remove();
        });

        it('should be correct for numbers', function() {
          immutableTable.find('.th').eq(idColumnIndex).trigger('mouseenter');
          expect($('.flyout a').text()).to.equal('Click to sort largest first');
        });

        it('should be correct for text', function() {
          immutableTable.find('.th').eq(descriptionColumnIndex).trigger('mouseenter');
          expect($('.flyout a').text()).to.equal('Click to sort A-Z');
        });

        it('should be correct for dates', function() {
          immutableTable.find('.th').eq(dateColumnIndex).trigger('mouseenter');
          expect($('.flyout a').text()).to.equal('Click to sort newest first');
        });

      });

    });

    it('should be able to filter', function(done) {
      var filteredData = _.take(fixtureData, 3);
      var unfilteredData = _.last(fixtureData, 6);
      var firstColumnName = fixtureMetadata.columns[0].name;
      // Sanity check for test data - we need the first rows of filtered/unfiltered to be different in at least
      // their first column's value for the tests to work.
      expect(_.first(unfilteredData)[firstColumnName]).to.not.equal(_.first(filteredData)[firstColumnName]);

      var lastWhereClause = null;
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        lastWhereClause = whereClause;
        if (offset > 0) return $q.when([]);
        if ($.isPresent(lastWhereClause)) {
          return $q.when(filteredData);
        } else {
          return $q.when(unfilteredData);
        }
      });

      $rootScope.$digest();
      expect(el.find('.th').length).to.equal(columnCount);
      expect(el.find('.row-block .cell').length).to.equal(columnCount * unfilteredData.length);
      expect(lastWhereClause).to.be.undefined; // as opposed to null, which lastWhereClause is initialized to.
      // Verify first cell (= first column of first row).
      expect(el.find('.row-block .cell').eq(beatColumnIndex).text()).to.equal(_.first(unfilteredData)[firstColumnName]);

      $rootScope.whereClause = 'district=004';
      $rootScope.$digest();

      _.defer(function() {
        $rootScope.$digest();
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * filteredData.length);
        expect(lastWhereClause).to.equal('district=004');
        // Verify first cell (= first column of first row).
        expect(el.find('.row-block .cell').eq(beatColumnIndex).text()).to.equal(_.first(filteredData)[firstColumnName]);
        el.remove();
        done();
      });

    });

  });

});
