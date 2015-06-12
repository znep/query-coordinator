describe('table directive', function() {
  'use strict';

  function createTableCard(expanded, getRows, rowCount, showCount, rowDisplayUnit) {
    outerScope.expanded = expanded || false;
    outerScope.rowCount = rowCount >= 0 ? rowCount : 200;
    outerScope.filteredRowCount = rowCount >= 0 ? rowCount : 170;
    outerScope.columnDetails = [];
    outerScope.showCount = showCount;
    outerScope.whereClause = '';
    outerScope.rowDisplayUnit = rowDisplayUnit || 'row';

    columnCount = 0;

    _.each(fixtureMetadata.testColumnDetailsAsTableWantsThem, function(column) {
      // TODO: Version as a string here is questionable
      column.dataset = { version: '1' };
      if (column.fieldName[0].match(/[a-zA-Z0-9]/g)) {
        outerScope.columnDetails.push(column);
        if (!(column.cardinality <= 1 || column.isSubcolumn)) {
          columnCount += 1;
        }
      }
    });

    // Provide a default sort column. It's a text/category column, so the default sort
    // order is ASC.
    var beatColumnName = fixtureMetadata.testColumnDetailsAsTableWantsThem[beatColumnIndex].fieldName;
    var defaultSortColumn = _.find(outerScope.columnDetails, function(column) {
      return column.fieldName === beatColumnName;
    });
    outerScope.defaultSortColumnName = defaultSortColumn.fieldName;

    if (getRows) {
      outerScope.getRows = getRows;
    } else {
      outerScope.getRows = function() {
        return $q.when(fixtureData);
      };
    }
    outerScope.$digest();

    var html =
      '<div class="card {0}" style="width: 640px; height: 480px; position: relative;">'.
      format(expanded ? 'expanded': '') +
        '<div table class="table" row-count="rowCount" get-rows="getRows" where-clause="whereClause" ' +
        'filtered-row-count="filteredRowCount" expanded="expanded" column-details="columnDetails" ' +
        'show-count="showCount" row-display-unit="rowDisplayUnit" ' +
        'default-sort-column-name="defaultSortColumnName"></div>' +
      '</div>';

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

  // Fake null data source. If the order is empty or ASC on any column, returns
  // the stub data. Otherwise, returns reversedData.
  function fakeNullDataSource(offset, limit, order, timeout, whereClause) {
    lastSort = order;

    if (offset > 0) return $q.when([]);

    if (_.isEmpty(order) || order.indexOf('ASC') >= 0) {
      return $q.when(_.take(fixtureNullData, rowCount));
    } else {
      return $q.when(_.take(reversedFixtureNullData, rowCount));
    }
  }

  var timeout;
  var testHelpers;
  var SoqlHelpers;
  var $rootScope;
  var outerScope;
  var $q;
  var fixtureData;
  var fixtureNullData;
  var reversedFixtureData;
  var reversedFixtureNullData;
  var fixtureMetadata;
  var testJson = 'karma-test/dataCards/test-data/tableTest/test-rows.json';
  var testNullJson = 'karma-test/dataCards/test-data/tableTest/test-null-rows.json';
  var testMetaJson = 'karma-test/dataCards/test-data/tableTest/test-meta.json';
  var blockSize = 50; // The table loads chunks of this size. The tests shouldn't really know, but they do for now.
  var columnCount;
  var rowCount = 5;
  var lastSort = null;
  var beatColumnIndex;
  var dateColumnIndex;
  var descriptionColumnIndex;
  var idColumnIndex;

  beforeEach(module('/angular_templates/dataCards/table.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards/card.sass'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/table.sass'));

  beforeEach(module(testJson));
  beforeEach(module(testNullJson));
  beforeEach(module(testMetaJson));

  beforeEach(inject(function($injector) {
    try {
      timeout = $injector.get('$timeout');
      testHelpers = $injector.get('testHelpers');
      SoqlHelpers = $injector.get('SoqlHelpers');
      $rootScope = $injector.get('$rootScope');
      outerScope = $rootScope.$new();
      $q = $injector.get('$q');
      fixtureData = testHelpers.getTestJson(testJson);
      reversedFixtureData = [].concat(fixtureData).reverse();
      fixtureNullData = testHelpers.getTestJson(testNullJson);
      reversedFixtureNullData = [].concat(fixtureData).reverse();
      fixtureMetadata = testHelpers.getTestJson(testMetaJson);

      var columnNames = _.pluck(fixtureMetadata['testColumnDetailsAsTableWantsThem'], 'fieldName');
      beatColumnIndex = columnNames.indexOf('beat');
      dateColumnIndex = columnNames.indexOf('date');
      descriptionColumnIndex = columnNames.indexOf('description');
      idColumnIndex = columnNames.indexOf('id');
    } catch (e) {
      console.log(e);
    }
  }));

  describe('subcolumns', function() {
    var el;
    beforeEach(function() {
      if (!el) {
        el = createTableCard(true, fakeDataSource);
      }
    });
    after(destroyAllTableCards);

    // CORE-4645: Never show subcolumns in table card
    it('are omitted', function() {
      expect(el.find('.table-head .th:contains("Location (X Coordinate)")').length).to.equal(0);
      // Make sure non-empty columns are still included
      expect(el.find('.table-head .th:contains("Location (Y Coordinate)")').length).to.equal(0);
    });
  });
  describe('when rendering cell data', function() {
    var el;

    beforeEach(function() {
      if (!el) {
        el = createTableCard(true, fakeDataSource);
      }
    });
    after(destroyAllTableCards);

    it('should render point cells with latitude & longitude', function(done) {
      var pointCell = el.find('.table-row .cell.point').first();
      var cellContent = pointCell.html();

      expect(cellContent).to.match(/span.*Longitude.*-122\.511054.*\/span/);
      expect(cellContent).to.match(/span.*Latitude.*37\.771343.*\/span.*,/);
      done();
    });

    it('should render timestamp cells with date & time as YYYY MMM DD HH:mm:ss', function(done) {
      var timestampCell = el.find('.table-row .cell.timestamp').first();

      expect(timestampCell.html()).to.match(/\d{4}\s\w{3}\s\d{2}\s\d{2}:\d{2}:\d{2}/);
      done();
    });

    it('should render floating_timestamp cells with date & time as YYYY MMM DD HH:mm:ss', function(done) {
      var floatingTimestampCell = el.find('.table-row .cell.floating_timestamp').first();

      expect(floatingTimestampCell.html()).to.match(/\d{4}\s\w{3}\s\d{2}\s\d{2}:\d{2}:\d{2}/);
      done();
    });

    it('should render number cells with commas when number of digits is greater than 4', function(done) {
      var timestampCell = el.find('.table-row .cell.number').first();
      var cellContent = timestampCell.html();

      expect(cellContent).to.match(/\d+,\d+/);
      expect(cellContent.length).to.equal('12,345'.length);
      done();
    });

    it('should render boolean cells with checkboxes for true, empty for false', function() {
      var booleanCells = el.find('.table-row .cell.boolean');
      var cellContent = booleanCells.html();

      // The first row in the test fixture is false
      expect(booleanCells[0].innerHTML).to.equal('');
      // The second row in the test fixture is true
      expect(booleanCells[1].innerHTML).to.equal('✓');
      // The third row in the test fixture is null
      expect(booleanCells[2].innerHTML).to.equal('');
      // The fourth row in the test fixture is undefined
      expect(booleanCells[3].innerHTML).to.equal('');
    });

  });

  describe('when rendering null cell data', function() {
    var el;

    beforeEach(function() {
      if (!el) {
        el = createTableCard(true, fakeNullDataSource);
      }
    });
    after(destroyAllTableCards);

    it('should render invalid dates as blank cells', function() {
      var invalidTimestampCell = el.find('.table-row .cell.timestamp').first();
      var cellContent = invalidTimestampCell.html();

      expect(cellContent).to.equal('');
    });
  });

  describe('when expanded', function() {

    after(destroyAllTableCards);

    var immutableTable;

    beforeEach(function() {
      // For some reason, if we do this in a before() block instead of a beforeEach(), then if we
      // describe.only this block, the before() block will run before the global beforeEach()
      // blocks, causing outerScope to be undefined whic makes createTableCard fail.
      if (!immutableTable)
        immutableTable = createTableCard(true);
    });

    afterEach(function() {
      testHelpers.cleanUp();
    });

    it('should create and load data', function() {
      expect(immutableTable.find('.row-block .cell').length).to.equal(columnCount * blockSize * 3);
      expect(immutableTable.find('.th').length).to.equal(columnCount);
    });

    it('should format numbers correctly', function() {
      var cells = immutableTable.find('.row-block .cell');
      var checkedYear = false;
      expect(cells.length).to.not.equal(0);

      var filteredColumns = _.filter(fixtureMetadata.testColumnDetailsAsTableWantsThem, function(column) {
        return !(column.isSubcolumn || column.cardinality <= 1);
      });
      _.each(cells, function(cell) {
        var column = filteredColumns[$(cell).index()];
        var datatype = column.physicalDatatype;
        if (datatype === 'number') {
          expect($(cell).hasClass('number')).to.equal(true);

          if (column.name === 'Year') {
            expect($(cell).text()).to.match(/^[1-9][0-9]{3}$/);
            checkedYear = true;
          };
        }
      });

      expect(checkedYear).to.equal(true);
    });

    it('should load more rows upon scrolling', function(done) {
      this.timeout(20000); // IE10!
      var didScroll = false;
      var el = createTableCard(true);
      var tableBody = el.find('.table-body');
      tableBody.scroll(function() {
        if (didScroll) {
          _.defer(function() {
            expect(el.find('.th').length).to.equal(columnCount);
            expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 4);
            el.remove();
            done();
          });
        }
      });

      _.defer(function() {
        expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 3);
        var originalScrollTop = tableBody.scrollTop();
        var targetScrollTop = $.relativeToPx('2rem') * (blockSize + 1);

        if (originalScrollTop === targetScrollTop) {
          throw new Error([
            'Test implementation error -',
            'we expect to be triggering a scroll here, but apparently the content',
            'is already scrolled to where we want to go. We do not want this.',
            'The scroll pos was: {0}'.format(targetScrollTop)
          ].join(' '));
        }

        didScroll = true;
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
        var columnMeta = fixtureMetadata.testColumnDetailsAsTableWantsThem[columnIndexToClick];
        // Sanity check - make sure our test data has different values in the first and
        // last row, otherwise we can't check the sort order.
        expect(_.last(fixtureData)[columnMeta.fieldName]).to.not.equal(_.first(fixtureData)[columnMeta.fieldName]);

        var computeDisplayedValue = columnMeta.physicalDatatype === 'number' ? $.commaify : _.identity;
        var el = getSortableTable();

        // Value in corresponding cell matches with first data item?
        var expectedFirstDataItem = computeDisplayedValue(_.first(fixtureData)[columnMeta.fieldName]);
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(expectedFirstDataItem);

        // Apply a sort. Expect it to be DESC
        applicatorFunction(el);
        $rootScope.$digest();

        //NOTE: this assumes the column defaults to a DESC sort. Not always true, see story 5.04 for details.
        expect(lastSort).to.equal(SoqlHelpers.formatFieldName(columnMeta.fieldName) + ' DESC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with last data item (since we're sorting in reverse).
        var expectedLastDataItem = computeDisplayedValue(_.last(fixtureData)[columnMeta.fieldName]);
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(expectedLastDataItem);

        // Now, reverse the sort.
        applicatorFunction(el);
        $rootScope.$digest();

        expect(lastSort).to.equal(SoqlHelpers.formatFieldName(columnMeta.fieldName) + ' ASC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with first data item (since we're sorting normally).
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text()).to.equal(expectedFirstDataItem);
      }

      it('should only reflect the first value of the default sort', function() {
        var el = getSortableTable();
        var defaultSortColumnName = SoqlHelpers.formatFieldName(el.scope().defaultSortColumnName);
        expect(lastSort).to.equal(defaultSortColumnName + ' ASC');

        el.scope().defaultSortColumnName = SoqlHelpers.formatFieldName('bad');
        $rootScope.$digest();
        expect(lastSort).to.equal(defaultSortColumnName + ' ASC'); // shouldn't change
      });

      it('should be able to sort using the header', function() {
        // Note - this test only checks the value of the first cell to make sure it's updated
        // after the sort. It should probably check all the visible rows.
        var columnIndexToClick = 0;
        var columnMeta = fixtureMetadata.testColumnDetailsAsTableWantsThem[columnIndexToClick];

        verifySortingWithSortApplicator(columnIndexToClick, function(el) {
          var header = el.find('.th').eq(columnIndexToClick);

          expect(header.text().trim()).to.equal(columnMeta.name);
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

        var thumb = getSortableTable().find('.th .resize').eq(beatColumnIndex);
        expect(thumb.length).to.not.equal(0);
        thumb.click();
        $rootScope.$digest();
        expect(lastSort).to.equal(origSort);
      });

      it('should not trigger a sort on unsortable columns', function() {
        var origSort = lastSort;
        getSortableTable().find('.th[data-column-id="point"]').click();
        $rootScope.$digest();
        expect(lastSort).to.equal(origSort);
      });

      it('should not show flyout when hovering over the header resize handle', function() { // CORE-3140
        var resizeHandle = getSortableTable().find('.th .resize').eq(beatColumnIndex);
        expect(resizeHandle.length).to.not.equal(0);
        resizeHandle.mouseover();
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
          expect(immutableTable.find('.th').eq(idColumnIndex).find('.caret')).to.not.have.class('sortUp');
        });

        it('should be correct for text', function() {
          expect(immutableTable.find('.th').eq(beatColumnIndex).find('.caret')).to.have.class('sortUp');
        });

        it('should be correct for dates', function() {
          expect(immutableTable.find('.th').eq(dateColumnIndex).find('.caret')).to.not.have.class('sortUp');
        });

      });

      describe('sort hint text', function() {

        afterEach(function() {
          $('.flyout').remove();
        });

        it('should be correct for numbers', function() {
          immutableTable.find('.th').eq(idColumnIndex).trigger('mouseenter');

          // Verify the title is there, and not a description
          var element = $('.flyout .flyout-title');
          expect($.trim(element.text())).to.equal('Id');

          expect($('.flyout a').text()).to.equal('Click to sort largest first');
        });

        it('should be correct for text', function() {
          immutableTable.find('.th').eq(descriptionColumnIndex).trigger('mouseenter');

          // Verify the title and description are there
          var element = $('.flyout .flyout-title');
          var title = element.children().eq(0).text();
          var description = element.children().eq(1).html();
          expect($.trim(title)).to.equal('Description');
          expect($.trim(description)).to.equal('describe enscribe proscribe prescribe');

          expect($('.flyout a').text()).to.equal('Click to sort A-Z');
        });

        it('should be correct for dates', function() {
          immutableTable.find('.th').eq(dateColumnIndex).trigger('mouseenter');

          // Verify the title and description are there
          var element = $('.flyout .flyout-title');
          var title = element.children().eq(0).text();
          var description = element.children().eq(1).html();
          expect($.trim(title)).to.equal('Date');
          expect($.trim(description)).to.equal('the oblong edible fruit of a palm');

          expect($('.flyout a').text()).to.equal('Click to sort newest first');
        });

      });

    });

    it('should be able to filter', function(done) {
      var filteredData = _.take(fixtureData, 3);
      var unfilteredData = _.takeRight(fixtureData, 6);
      var firstColumnName = fixtureMetadata.testColumnDetailsAsTableWantsThem[0].fieldName;
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
      expect(lastWhereClause).to.equal(''); // as opposed to null, which lastWhereClause is initialized to.
      // Verify first cell (= first column of first row).
      expect(el.find('.row-block .cell').eq(beatColumnIndex).text()).to.equal(_.first(unfilteredData)[firstColumnName]);

      el.scope().whereClause = 'district=004';
      $rootScope.$digest();

      _.defer(function() {
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

  describe('table label & no-rows message', function() {
    afterEach(destroyAllTableCards);

    it('should update if there are no filtered rows', function() {
      var el = createTableCard(true, _.constant($q.when([])), 103);

      outerScope.filteredRowCount = 0;
      $rootScope.$digest();

      expect(el.find('.has-rows').length).to.equal(0);
      expect(el.find('.table-label').text()).to.equal('Row 0-0 out of 0');
    });

    it('should update if there are rows', function() {
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        return $q.when(_.take(fixtureData, 10));
      }, 101);

      outerScope.filteredRowCount = 10;
      $rootScope.$digest();
      expect(el.find('.has-rows').length).to.equal(1);
      expect(el.find('.table-label').text()).to.equal('Row 1-10 out of 10');
    });

    it('should not show the row count if the "show-count" attribute is false', function() {
      var el = createTableCard(true, _.constant($q.when([])), 103, false);
      var rowCountLabel = el.find('.table-label');
      expect(rowCountLabel.length).to.not.equal(0);
      expect(rowCountLabel.is(':visible')).to.be.false;
    });

    it('should escape rowDisplayUnit', function() {
      var el = createTableCard(true, _.constant($q.when([])), 103, true, '<img src="http://placehold.it/100x100" />');
      outerScope.filteredRowCount = 0;
      $rootScope.$digest();
      expect(el.find('.table-label').text()).to.equal('<img src="http://placehold.it/100x100" /> 0-0 out of 0');
    });
  });

  describe('render timing events', function() {
    afterEach(destroyAllTableCards);
    it('should emit render:start and render:complete events on rendering', function(done) {
      var renderEvents = outerScope.$eventToObservable('render:start').
        merge(outerScope.$eventToObservable('render:complete'));

      renderEvents.take(2).toArray().subscribe(
        function(events) {
          // Vis id is a string and is the same across events.
          expect(events[0].additionalArguments[0].source).to.satisfy(_.isString);
          expect(events[1].additionalArguments[0].source).to.equal(events[0].additionalArguments[0].source);

          // Times are ints and are in order.
          expect(events[0].additionalArguments[0].timestamp).to.satisfy(_.isFinite);
          expect(events[1].additionalArguments[0].timestamp).to.satisfy(_.isFinite);

          expect(events[0].additionalArguments[0].timestamp).to.be.below(events[1].additionalArguments[0].timestamp);
          done();
        }
      );

      createTableCard(true, fakeDataSource);
      timeout.flush(); // Needed to simulate a frame. Render:complete won't be emitted otherwise.
    });
  });

  describe('table flyout events', function() {
    var el;
    var textWhichCausesEllipsis = Array(100).join('a');
    beforeEach(function() {
      if (!el) {
        el = createTableCard(true, fakeDataSource);
      }
    });
    afterEach(destroyAllTableCards);
    afterEach(function() {
      $('.flyout').remove();
      el = null;
    });

    it('should display a flyout if cell text ends in an ellipsis', function() {
      var cell = el.find('.cell.text').first();
      cell.html(textWhichCausesEllipsis);
      cell.
        trigger('mouseover');

      var flyout = cell.find('.flyout');
      expect(flyout).to.have.length(0);
    });
  });
});
