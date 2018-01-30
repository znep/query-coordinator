import { expect, assert } from 'chai';
const angular = require('angular');

describe('tableCard', function() {
  'use strict';

  function createTableCard(expanded, getRows, rowCount, showCount, rowDisplayUnit) {
    outerScope.expanded = expanded || false;
    outerScope.rowCount = rowCount >= 0 ? rowCount : 200;
    outerScope.filteredRowCount = rowCount >= 0 ? rowCount : 170;
    outerScope.columnDetails = [];
    outerScope.allColumnsMetadata = [];
    outerScope.showCount = showCount;
    outerScope.whereClause = '';
    outerScope.rowDisplayUnit = rowDisplayUnit || 'row';

    columnCount = 0;

    _.each(fixtureMetadata.testColumnDetailsAsTableWantsThem, function(column) {
      // TODO: Version as a string here is questionable
      column.dataset = { version: '1' };
      if (column.fieldName[0].match(/[a-zA-Z0-9]/g)) {
        outerScope.columnDetails.push(column);
        outerScope.allColumnsMetadata.push(column);
        columnCount += 1;
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

    $controllerProvider.register('TableCardController', function($scope) {
      $scope.getRows = outerScope.getRows;
      $scope.expanded = outerScope.expanded;
      $scope.rowCount = outerScope.rowCount;
      $scope.filteredRowCount = outerScope.filteredRowCount;
      $scope.columnDetails = outerScope.columnDetails;
      $scope.allColumnsMetadata = outerScope.allColumnsMetadata;
      $scope.showCount = outerScope.showCount;
      $scope.whereClause = outerScope.whereClause;
      $scope.rowDisplayUnit = outerScope.rowDisplayUnit;
      $scope.defaultSortColumnName = outerScope.defaultSortColumnName;
      $scope.whereClause = outerScope.whereClause;
      outerScope = $scope;
    });

    var html =
      '<div class="card {0}" style="width: 640px; height: 480px; position: relative;">'.
      format(expanded ? 'expanded': '') +
        '<table-card where-clause="whereClause"></table-card>' +
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
  var $controllerProvider;
  var fixtureData;
  var fixtureNullData;
  var reversedFixtureData;
  var reversedFixtureNullData;
  var fixtureMetadata;
  var testJson = require('karma/dataCards/test-data/tableTest/test-rows.json');
  var testNullJson = require('karma/dataCards/test-data/tableTest/test-null-rows.json');
  var testMetaJson = require('karma/dataCards/test-data/tableTest/test-meta.json');
  var blockSize = 150; // The table loads chunks of this size. The tests shouldn't really know, but they do for now.
  var columnCount;
  var rowCount = 5;
  var lastSort = null;
  var beatColumnIndex;
  var dateColumnIndex;
  var descriptionColumnIndex;
  var idColumnIndex;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/card.scss');
  require('app/styles/dataCards/cards.scss');
  require('app/styles/dataCards/table.scss');

  beforeEach(angular.mock.module(function(_$controllerProvider_) {
    $controllerProvider = _$controllerProvider_;
  }));

  beforeEach(inject(function($injector) {
    try {
      timeout = $injector.get('$timeout');
      testHelpers = $injector.get('testHelpers');
      SoqlHelpers = $injector.get('SoqlHelpers');
      $rootScope = $injector.get('$rootScope');
      outerScope = $rootScope.$new();
      $q = $injector.get('$q');
      fixtureData = testJson;
      reversedFixtureData = [].concat(fixtureData).reverse();
      fixtureNullData = testNullJson;
      reversedFixtureNullData = [].concat(fixtureData).reverse();
      fixtureMetadata = testMetaJson;

      var columnNames = _.map(fixtureMetadata['testColumnDetailsAsTableWantsThem'], 'fieldName');
      beatColumnIndex = columnNames.indexOf('beat');
      dateColumnIndex = columnNames.indexOf('date');
      descriptionColumnIndex = columnNames.indexOf('description');
      idColumnIndex = columnNames.indexOf('id');
    } catch (e) {
      console.log(e);
    }
  }));

  describe('when rendering cell data', function() {
    var el;
    // 2014 Jun 28 12:34:56 PM
    var TIMESTAMP_REGEX = /^\d{4}\s\w{3}\s[0-3][0-9]\s[01][0-9]:[0-5][0-9]:[0-5][0-9]\s[AP]M$/;
    // Jun 28, 2014 12:34 PM
    var TIMESTAMP_WITH_USER_FORMAT_REGEX = /^\w{3}\s[0-3][0-9],\s\d{4}\s[01][0-9]:[0-5][0-9]\s[AP]M$/;
    // -23.198741°
    var LATLNG_REGEX = /^-?\d+\.\d+°$/;
    // 1234 | -12,345.67
    var NUMBER_REGEX = /^-?(?:\d{1,4}|\d{1,3}(?:,\d{3})*)(?:\.\d+)?$/;
    // 12345 | -12345.67
    var NUMBER_NOCOMMAS_REGEX = /^-?\d+(?:\.\d+)?$/;
    // 1234% | -12,345.67%
    var PERCENT_REGEX = /^-?(?:\d{1,4}|\d{1,3}(?:,\d{3})*)(?:\.\d+)?%$/;
    // 12345% | -12345.67%
    var PERCENT_NOCOMMAS_REGEX = /^-?\d+(?:\.\d+)?%$/;
    // -$12,345.67
    var MONEY_REGEX = /^-?\$\d{1,3}(?:,\d{3})*\.\d{2}$/;
    // -£12.345,6
    var MONEY_WITH_USER_FORMAT_REGEX = /^-?£\d{1,3}(?:\.\d{3})*,\d{1}$/;
    // -$123.45 | -$12.3K
    var MONEY_HUMANE_FORMAT_REGEX = /^-?\$(?:\d{1,3}\.\d{2}|\d{1,3}(?:\.\d{1,2})?[KMBTPEZY])$/;

    beforeEach(function() {
      // This test file relies heavily on its global beforeEach handlers and
      // several helper functions, which in turn rely on state variables.
      // It may have been an accident that the `rowCount` variable isn't passed
      // as an argument to the `fake[Null]DataSource` functions, but in lieu of
      // a significant refactor we can override the value here and reset it for
      // other tests which are depending on the globally-set value.
      rowCount = 50;
      el = createTableCard(true, fakeDataSource);
    });
    afterEach(function() {
      destroyAllTableCards();
      rowCount = 5;
    });

    it('should render point cells with latitude & longitude', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var pointCell = $(row).find('.cell.point .cell-content').first();
        var pointCellSpans = pointCell.children('span');

        expect(pointCellSpans).to.have.length(2);
        expect(pointCellSpans.first().attr('title')).to.equal('Latitude');
        expect(pointCellSpans.first().html()).to.match(LATLNG_REGEX);
        expect(pointCellSpans.last().attr('title')).to.equal('Longitude');
        expect(pointCellSpans.last().html()).to.match(LATLNG_REGEX);
      });
    });

    it('should render timestamp cells with date & time as YYYY MMM DD hh:mm:ss A by default', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var timestampCell = $(row).find('.cell.timestamp .cell-content').first();
        var cellContent = timestampCell.html();

        expect(cellContent).to.match(TIMESTAMP_REGEX);
      });
    });

    it('should render timestamp cells with a custom timestamp format property', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var timestampCell = $(row).find('.cell.timestamp .cell-content').eq(1);
        var cellContent = timestampCell.html();

        expect(cellContent).to.match(TIMESTAMP_WITH_USER_FORMAT_REGEX);
      });
    });

    it('should render floating_timestamp cells with date & time as YYYY MMM DD hh:mm:ss A by default', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var floatingTimestampCell = $(row).find('.cell.floating_timestamp .cell-content').first();
        var cellContent = floatingTimestampCell.html();

        expect(cellContent).to.match(TIMESTAMP_REGEX);
      });
    });

    it('should render number cells with commas by default', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var idCell = $(row).find('.cell.number .cell-content').first();
        var cellContent = idCell.html();

        expect(cellContent).to.match(NUMBER_REGEX);
      });
    });

    it('should render number cells without commas when a noCommas format property is present', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var idNoCommasCell = $(row).find('.cell.number .cell-content').eq(1);
        var cellContent = idNoCommasCell.html();

        expect(cellContent).to.match(NUMBER_NOCOMMAS_REGEX);
      });
    });

    it('should render number cells without commas when number of digits is 4 as a special case', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var yearCell = $(row).find('.cell.number .cell-content').last();
        var cellContent = yearCell.html();

        expect(cellContent).to.match(/\d{4}/);
      });
    });

    it('should render number cells as percent values when the dataTypeName is percent', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var percentCell = $(row).find('.cell.number .cell-content').eq(-2);
        var cellContent = percentCell.html();

        expect(cellContent).to.match(PERCENT_REGEX);
        expect(cellContent).to.not.match(/^-?0\d/); // no leading zeroes in integer portion after string shift
      });
    });

    it('should render number cells as percent values in combination with a noCommas format property', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var percentNoCommasCell = $(row).find('.cell.number .cell-content').eq(-3);
        var cellContent = percentNoCommasCell.html();

        expect(cellContent).to.match(PERCENT_NOCOMMAS_REGEX);
        expect(cellContent).to.not.match(/^-?0\d/); // no leading zeroes in integer portion after string shift
      });
    });

    it('should render boolean cells with checkboxes for true, empty for false', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var booleanCell = $(row).find('.cell.boolean .cell-content');
        var cellContent = booleanCell.html();

        if (fixtureData[index].checkbox_test) {
          expect(cellContent).to.equal('✓');
        } else {
          expect(cellContent).to.equal('');
        }
      });
    });

    it('should render money cells as US currency with cents by default', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var moneyCell = $(row).find('.cell.money .cell-content').first();
        var cellContent = moneyCell.html();

        expect(cellContent).to.match(MONEY_REGEX);
      });
    });

    it('should render money cells with custom format properties', function() {
      var rows = el.find('.table-row');

      rows.each(function(index, row) {
        var moneyCells = $(row).find('.cell.money .cell-content');
        var cellContentFunky = moneyCells.eq(1).html();
        var cellContentHumane = moneyCells.eq(2).html();

        expect(cellContentFunky).to.match(MONEY_WITH_USER_FORMAT_REGEX);
        expect(cellContentHumane).to.match(MONEY_HUMANE_FORMAT_REGEX);
      });
    });

    it('should not hide columns with cardinality of 1', function() {
      var columnDetails = fixtureMetadata.testColumnDetailsAsTableWantsThem;
      var columnHeader = $('.content > .ng-binding');

      // Find the names of all columns with a cardinality of one.
      var uniformColumnNames = _(columnDetails).filter(function(column) {
        return column.cardinality === 1;
      }).map('name').value();

      // Find all column elements whose text matches one of the above column names.
      var uniformColumnElements = columnHeader.filter(function() {
        return _.includes(uniformColumnNames, $(this).text());
      });

      expect(uniformColumnElements.length).to.equal(uniformColumnNames.length);
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
      var invalidTimestampCell = el.find('.table-row .cell.timestamp .cell-content').first();
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
      expect(immutableTable.find('.row-block .cell').length).to.equal(columnCount * blockSize * 2);
      expect(immutableTable.find('.th').length).to.equal(columnCount);
    });

    it('should format numbers correctly', function() {
      var cells = immutableTable.find('.row-block .cell');
      var checkedYear = false;
      expect(cells.length).to.not.equal(0);

      var columns = fixtureMetadata.testColumnDetailsAsTableWantsThem;

      _.each(cells, function(cell) {
        var column = columns[$(cell).index()];
        var datatype = column.physicalDatatype;
        if (datatype === 'number') {
          expect($(cell).hasClass('number')).to.equal(true);

          if (column.name === 'Year') {
            expect($(cell).text().trim()).to.match(/^[1-9][0-9]{3}$/);
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
            expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 5);
            el.remove();
            done();
          });
        }
      });

      _.defer(function() {
        expect(el.find('.row-block .cell').length).to.equal(columnCount * blockSize * 2);
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

        var computeDisplayedValue = columnMeta.physicalDatatype === 'number' ? window.socrata.utils.commaify : _.identity;
        var el = getSortableTable();

        // Value in corresponding cell matches with first data item?
        var expectedFirstDataItem = computeDisplayedValue(_.first(fixtureData)[columnMeta.fieldName]);
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text().trim()).to.equal(expectedFirstDataItem);

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
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text().trim()).to.equal(expectedLastDataItem);

        // Now, reverse the sort.
        applicatorFunction(el);
        $rootScope.$digest();

        expect(lastSort).to.equal(SoqlHelpers.formatFieldName(columnMeta.fieldName) + ' ASC');
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .table-row').length).to.equal(rowCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * rowCount);

        // Value in corresponding cell matches with first data item (since we're sorting normally).
        expect(el.find('.row-block .cell').eq(columnIndexToClick).text().trim()).to.equal(expectedFirstDataItem);
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
          assert.isFalse($(immutableTable.find('.th').eq(idColumnIndex).find('.caret')).hasClass('sortUp'));
        });

        it('should be correct for text', function() {
          assert.isTrue(immutableTable.find('.th').eq(beatColumnIndex).find('.caret').hasClass('sortUp'));
        });

        it('should be correct for dates', function() {
          assert.isFalse($(immutableTable.find('.th').eq(dateColumnIndex).find('.caret')).hasClass('sortUp'));
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

        // x'ing this for now, because it is a constant source of pain and timeouts when running FE tests
        xit('should be correct for the first column', function() {
          fixtureMetadata['testColumnDetailsAsTableWantsThem'][0].description = 'duhscreepshin';
          var table = createTableCard(true);
          table.find('.th').eq(0).trigger('mouseenter');

          // Verify the title and description are there
          var element = $('.flyout .flyout-title');
          var description = element.children().eq(1).html();
          expect($.trim(description)).to.equal('duhscreepshin');
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
      expect(el.find('.row-block .cell').eq(beatColumnIndex).text().trim()).to.equal(_.first(unfilteredData)[firstColumnName]);

      el.scope().whereClause = 'district=004';
      $rootScope.$digest();

      _.defer(function() {
        expect(el.find('.th').length).to.equal(columnCount);
        expect(el.find('.row-block .cell').length).to.equal(columnCount * filteredData.length);
        expect(lastWhereClause).to.equal('district=004');
        // Verify first cell (= first column of first row).
        expect(el.find('.row-block .cell').eq(beatColumnIndex).text().trim()).to.equal(_.first(filteredData)[firstColumnName]);
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
      expect(el.find('.table-label').text()).to.equal('Row 0 out of 0');
    });

    it('should update if there is one filtered row', function() {
      var el = createTableCard(true, _.constant($q.when([])), 103);

      outerScope.filteredRowCount = 1;
      $rootScope.$digest();

      expect(el.find('.has-rows').length).to.equal(1);
      expect(el.find('.table-label').text()).to.equal('Row 1 out of 1');
    });

    it('should update if there is more than 1 row', function() {
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        return $q.when(_.take(fixtureData, 10));
      }, 101);

      outerScope.filteredRowCount = 10;
      $rootScope.$digest();
      expect(el.find('.has-rows').length).to.equal(1);
      expect(el.find('.table-label').text()).to.equal('Rows 1-10 out of 10');
    });

    it('should not show the row count if the "show-count" attribute is false', function() {
      var el = createTableCard(true, _.constant($q.when([])), 103, false);
      var rowCountLabel = el.find('.table-label');
      expect(rowCountLabel.length).to.not.equal(0);
      assert.isFalse(rowCountLabel.is(':visible'));
    });

    it('should escape rowDisplayUnit', function() {
      var el = createTableCard(true, _.constant($q.when([])), 103, true, '<img src="http://placehold.it/100x100" />');
      outerScope.filteredRowCount = 0;
      $rootScope.$digest();
      expect(el.find('.table-label').text()).to.equal('<img src="http://placehold.it/100x100" /> 0 out of 0');
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

  // Note: The following scrolling tests are failing and thus xit'ed because:
  // 1) It is difficult to simulate 'DOMMouseScroll' events on Firefox
  // 2) It is difficult to monitor scroll position (especially on PhantomJS)
  // Consequently, testing the complex scrolling behavior on tables lends itself
  // to integration testing instead (Roark).
  describe('when scrolling', function() {

    var el;
    var tableBody;

    function scrollEvent(delta) {
     return $.Event('mousewheel', {
       originalEvent: {
         wheelDelta: delta
       }
     });
    }

    beforeEach(function() {
      el = createTableCard(true);
      tableBody = el.find('.table-body');
    });

    afterEach(destroyAllTableCards);

    xit('should add hidden class if scrolling down and the page is not at the bottom', function() {
      el.css('top', 900);
      tableBody.trigger(scrollEvent(-10));
      assert.isTrue(tableBody.hasClass('vertically-hidden'));
    });

    xit('should not add hidden class if scrolling down and the page is at the bottom', function() {
      tableBody.trigger(scrollEvent(-10));
      assert.isFalse(tableBody.hasClass('vertically-hidden'));
    });

    xit('should not add hidden class if scrolling up and the page is not at the bottom', function() {
      tableBody.scrollTop(100);
      el.css('top', 1000);
      tableBody.trigger(scrollEvent(10));
      assert.isFalse(tableBody.hasClass('vertically-hidden'));
    });

    xit('should not add hidden class if scrolling up and the page is at the bottom', function() {
      tableBody.scrollTop(100);
      tableBody.trigger(scrollEvent(10));
      assert.isFalse(tableBody.hasClass('vertically-hidden'));
    });
  });
});
