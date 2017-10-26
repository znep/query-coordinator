const _ = require('lodash');
const $ = require('jquery');
const Table = require('common/visualizations/views/Table');
const I18n = require('common/i18n').default;
const allLocales = require('common/i18n/config/locales').default;

describe('Table', function() {

  function createTable(overrideVIF) {
    var element = $('<div>', { 'id': 'table' });

    $('body').append(element);

    var tableVIF = {
      configuration: {
        order: [{
          columnName: 'test',
          ascending: true
        }],
        // If you change to true, make sure to mock out the resultant MetadataProvider request.
        viewSourceDataLink: false
      },
      datasetUid: 'test-test',
      domain: 'example.com',
      type: 'table'
    };

    if (overrideVIF) {
      _.merge(tableVIF, overrideVIF);
    }

    var table = new Table(element, tableVIF);

    var data = {
      rows: [],
      columns: []
    };

    return {
      element: element,
      table: table,
      vif: tableVIF,
      data: data
    };
  }

  function removeTable(table) {

    if (table && table.table && table.table.hasOwnProperty('destroy')) {
      table.table.destroy();
      assert.lengthOf(table.element.find('.socrata-table'), 0);
    }

    $('#table').remove();
  }

  function columns(override, numberOfColumns) {
    if (override) {
      return override;
    }

    var columns = [];
    numberOfColumns = isFinite(numberOfColumns) ? numberOfColumns : 2;

    for (var index = 0; index < numberOfColumns; index++) {
      columns[index] = {
        fieldName: 'header:' + index,
        name: 'header:' + index,
        renderTypeName: 'text'
      };
    }

    return columns;
  }

  function rows(columns, override, numberOfRows) {
    if (override) {
      return override;
    }

    var rows = [];
    numberOfRows = isFinite(numberOfRows) ? numberOfRows : 2;

    columns.forEach(function(column) {
      for (var index = 0; index < numberOfRows; index++) {
        rows[index] = rows[index] || [];
        rows[index][column] = '' + column + ':' + index;
      }
    });

    return rows;
  }

  function render(table, argv) {
    argv = argv || {};

    var generatedColumns = columns(argv.columns);
    var generatedRows = rows(generatedColumns, argv.rows);

    table.table.render(
      table.vif,
      {
        columns: generatedColumns,
        rows: generatedRows,
        rowIds: argv.rowIds
      }
    );
  }

  /**
   * Tests begin here
   */

  var table;

  beforeEach(function() {
    I18n.translations.en = allLocales.en;
  });

  afterEach(function() {
    if ($('#table').length) {
      throw new Error('A test in this spec file did not clean up its table. This may cause downstream test failures.');
    }

    I18n.translations = {};
  });

  describe('instantiation', function() {
    describe('when given incorrect arguments', function() {
      it('throws when missing an `element`', function() {
        assert.throws(function() {
          new Table();
        });
      });

      it('throws when missing a VIF', function() {
        assert.throws(function() {
          new Table($('<div>'));
        });
      });
    });
  });

  describe('destroy', function() {
    beforeEach(function() {
      table = createTable();
    });

    afterEach(function() {
      removeTable();
    });

    it('removes .socrata-table', function() {
      table.table.destroy();

      assert.lengthOf(table.element.find('.socrata-table'), 0);
    });

    it('removes event handlers', function() {
      var eventHandlerHasBeenFired = false;

      table.element.on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', function(event) {
        throw 'Table did not remove handlers correctly';
      });

      table.table.destroy();
    });
  });

  describe('layout', function() {
    beforeEach(function() {
      table = createTable(
        {
          configuration:{
            order: [{ ascending: true, columnName: 'hello' }],
            // If you change to true, make sure to mock out the resultant MetadataProvider request.
            viewSourceDataLink: false
          }
        }
      );
      render(table);
    });

    afterEach(function() {
      removeTable(table);
    });

    it('renders .socrata-table', function() {
      assert.lengthOf(table.element.find('.socrata-table'), 1);
    });

    describe('table headers', function() {
      it('renders the correct table headers', function() {
        render(
          table,
          {
            columns: [
              { fieldName: 'hello', name: 'hello', renderTypeName: 'text' },
              { fieldName: 'world', name: 'world', renderTypeName: 'text' }
            ]
          }
        );

        assert.lengthOf(table.element.find('th'), 2);
        assert.match(table.element.find('th:first-child').find('.column-header-content-column-name').text(), /hello/);
        assert.match(table.element.find('th:nth-child(2)').find('.column-header-content-column-name').text(), /world/);
      });

      it('chooses the specified sort column', function() {
        render(
          table,
          {
            columns: [
              { fieldName: 'hello', name: 'hello', renderTypeName: 'text' }
            ]
          }
        );

        assert.match(table.element.find('th div[data-sort]').find('.column-header-content-column-name').text(), /hello/);
      });
    });

    describe('table data rows', function() {
      it('renders the correct number of table data rows', function() {
        render(
          table,
          {
            columns: [
              { fieldName: 'hello', name: 'hello', renderTypeName: 'text' }
            ],
            rows: [
              ['something']
            ]
          }
        );

        assert.lengthOf(table.element.find('td'), 1);
        assert.equal(table.element.find('td').text().trim(), 'something');
      });
    });

    describe('rendering NBE url columns', function() {
      const nbeUrlColumns = [
        { fieldName: 'link_description', name: 'Link (description)', renderTypeName: 'text' },
        { fieldName: 'link', name: 'Link', renderTypeName: 'text' }
      ];
      const nbeUrlRows = [['Google', 'www.google.com']];

      it('renders exploded URL columns as a single OBE-like URL column', function() {
        render(
          table,
          {
            columns: nbeUrlColumns,
            rows: nbeUrlRows
          }
        );

        // Check column headers
        assert.lengthOf(table.element.find('.column-header-content-column-name'), 1);
        assert.equal(table.element.find('.column-header-content-column-name')[0].textContent.trim(), 'Link');

        // Check row contents
        assert.lengthOf(table.element.find('td'), 1);
        assert.equal(table.element.find('td a')[0].getAttribute('href'), 'www.google.com');
        assert.equal(table.element.find('td a')[0].textContent.trim(), 'Google');
      });

    });

    describe('re-rendering', function() {
      beforeEach(function() {
        table = createTable();
      });

      afterEach(function() {
        removeTable();
      });

      it('persists columnar widths.', function() {
        var cellWidth;
        var cellWidthAfter;

        render(table);
        cellWidth = table.element.find('.socrata-table').width();

        render(
          table,
          {
            columns: [
              { fieldName: 'hello', name: 'hello', renderTypeName: 'text' }
            ],
            rows: [
              ['something']
            ]
          }
        );
        cellWidthAfter = table.element.find('.socrata-table').width();

        assert.equal(cellWidth, cellWidthAfter);
      });

      it('persists scrollLeft', function() {
        var scrollLeft;
        var scrollLeftAfter;
        var columns = _.fill(
          Array(100),
          { fieldName: 'placeholder', field: 'placeholder', renderTypeName: 'text' }
        );

        render(table, { columns: columns });

        scrollLeft = table.element.
          find('.socrata-table').
          scrollLeft(100).
          scrollLeft();

        render(table, { columns: columns });

        scrollLeftAfter = table.element.
          find('.socrata-table').
          scrollLeft(100).
          scrollLeft();

        assert.equal(scrollLeft, scrollLeftAfter);
      });
    });
  });

  describe('howManyRowsCanFitInHeight()', function() {
    beforeEach(function() {
      table = createTable();
      render(table);
    });

    afterEach(function() {
      removeTable(table);
    });

    it('returns 0 when a Number is not passed as an argument', function() {
      assert.equal(table.table.howManyRowsCanFitInHeight(), 0);
    });

    describe('when passed an arbitrary height', function() {
      it('returns zero', function() {
        assert.equal(table.table.howManyRowsCanFitInHeight(10), 0);
      });

      it('returns a non-zero number', function() {
        assert.isAbove(table.table.howManyRowsCanFitInHeight(500), 0);
      });

      it('renders an arbitrary amount of rows that is under the height specified', function() {
        var height = 500;
        var amountOfRows = table.table.howManyRowsCanFitInHeight(height);
        var rows = _.fill(Array(amountOfRows), ['']);

        table.element.height(height);

        render(
          table,
          {
            columns: [
              { fieldName: 'hello', name: 'hello', renderTypeName: 'text' }
            ],
            rows: rows
          }
        );

        var totalHeight = _.sum(
          table.element.find('.socrata-table tr').map(function() {
            return $(this).height();
          })
        );

        assert.isTrue(height >= totalHeight);
      });
    });
  });

  describe('events', function() {
    beforeEach(function() {
      table = createTable();
      render(table);
    });

    afterEach(function() {
      removeTable(table);
    });

    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    describe('Sort Menu', () => {

      const data = {
        columns: [
          { fieldName: 'hello0', name: 'hello0', renderTypeName: 'text' },
          { fieldName: 'hello1', name: 'hello1', renderTypeName: 'text', description: lorem }
        ]
      };

      const delay = () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 5);
        });
      };

      it('closes sort menu on kebab blur, unless focus on child', (done) => {
        render(table, data);

        const btn = $('.sort-menu-button')[0];
        btn.focus();
        btn.click();

        assert.equal($('#sort-menu').length, 1);

        let $asc = $('#sort-menu-sort-asc-button');
        $asc[0].focus();

        // Internally, there is a 1 ms delay to allow a follow up
        // focus event on a child, in order to determine if the
        // sort-menu should still be open.
        delay().then(() => {
          assert.equal($('#sort-menu').length, 1);
        }).then(() => {
          $('.sort-menu-button')[1].focus();
        }).then(delay).then(() => {
          assert.equal($('#sort-menu').length, 0);
        }).then(done);
      });

      it('shows More link for long column descriptions in sort menu', (done) => {
        render(table, data);

        const btn = $('.sort-menu-button')[1];
        btn.focus();
        btn.click();

        // Before clicking "More", description should not match full description.
        assert.notEqual($('#sort-menu-description-container p').text(), lorem);

        const more = $('#sort-menu-more-link')[0];
        more.click();

        assert.equal($('#sort-menu-description-container p').text(), lorem);

        delay().then(done);
      });
    });

    // NOTE: The string SOCRATA_VISUALIZATION_COLUMN_BUTTON_CLICKED is never used outside of this file.
    describe('SOCRATA_VISUALIZATION_COLUMN_BUTTON_CLICKED', function() {

      var data = {
        columns: [
          { fieldName: 'hello0', name: 'hello0', renderTypeName: 'text' },
          { fieldName: 'hello1', name: 'hello1', renderTypeName: 'text', description: 'hello description' }
        ]
      };

      it('displays the sort menu when clicking a column header button', function() {
        render(table, data);

        // Initially hidden
        //
        assert.lengthOf(table.element.find('#sort-menu'), 0);

        // Shown after click
        //
        table.element.find('th:first-child').find('.socrata-icon-kebab').click();
        assert.lengthOf(table.element.find('#sort-menu'), 1);

        // Hidden after second click
        //
        table.element.find('th:first-child').find('.socrata-icon-kebab').click();
        assert.lengthOf(table.element.find('#sort-menu'), 0);
      });

      it('displays "No description provided" when clicking first column header button', function() {

        render(table, data);

        table.element.find('th:first-child').find('.socrata-icon-kebab').click();
        assert.equal(table.element.find('#sort-menu').find('p').text().trim(), 'No description provided');
      });

      it('displays "hello description" when clicking second column header button', function() {

        render(table, data);

        table.element.find('th:nth-child(2)').find('.socrata-icon-kebab').click();
        assert.equal(table.element.find('#sort-menu').find('p').text().trim(), 'hello description');
      });

      it('emits event when clicking Sort ASC button', function(done) {

        render(table, data);

        // Show menu
        //
        table.element.find('th:first-child').find('.socrata-icon-kebab').click();

        table.element.on('SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', function(event) {

          var payload = event.originalEvent.detail;
          assert.equal(payload.ascending, true);
          assert.equal(payload.columnName, 'hello0');
          done();
        });

        table.element.find('#sort-menu-sort-asc-button').click();
      });

      it('emits event when clicking Sort DESC button', function(done) {

        render(table, data);

        // Show menu
        //
        table.element.find('th:first-child').find('.socrata-icon-kebab').click();

        table.element.on('SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', function(event) {

          var payload = event.originalEvent.detail;
          assert.equal(payload.ascending, true);
          assert.equal(payload.columnName, 'hello0');
          done();
        });

        table.element.find('#sort-menu-sort-asc-button').click();
      });
    });

    describe('SOCRATA_VISUALIZATION_COLUMN_CLICKED', function() {

      beforeEach(() => {
        sinon.stub(table.table, 'isMobile').returns(false);
      });

      afterEach(() => {
        table.table.isMobile.restore();
      });

      var data = {
        columns: [
          { fieldName: 'hello', name: 'hello', renderTypeName: 'text' },
          { fieldName: 'hello', name: 'hello', renderTypeName: 'point' }
        ]
      };

      it('emits event when clicking a column header', function(done) {

        render(table, data);

        table.element.on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', function(event) {

          var payload = event.originalEvent.detail;
          assert.equal(payload, 'hello');
          done();
        });

        table.element.find('th:first-child').find('.column-header-content').click();
      });

      it('does not emit an event when the column is a geometry type', function(done) {
        render(table, data);

        table.element.on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', function(event) {
          done('SOCRATA_VISUALIZATION_COLUMN_CLICKED should not be emitted.');
        });

        table.element.find('th:nth-child(2)').find('.column-header-content').click();

        _.delay(function() {
          done();
        }, 10);
      });
    });

    describe('SOCRATA_VISUALIZATION_ROW_DOUBLE_CLICKED', function() {

      beforeEach(() => {
        sinon.stub(table.table, 'isMobile').returns(false);
      });

      afterEach(() => {
        table.table.isMobile.restore();
      });

      describe('when row ids are provided', function() {
        var data = {
          columns: [
            { fieldName: 'hello', name: 'hello column', renderTypeName: 'text' },
            { fieldName: 'goodbye', name: 'goodbye column', renderTypeName: 'number' }
          ],
          rows: [
            ['incorrect', 3],
            ['incorrect', 2],
            ['correct', 1],
            ['incorrect', 0]
          ],
          rowIds: ['0', '1', '2', '3']
        };

        it('emits event when double-clicking a row', function(done) {

          render(table, data);

          table.element.on('SOCRATA_VISUALIZATION_ROW_DOUBLE_CLICKED', function(event) {
            var payload = event.originalEvent.detail;

            assert.equal(_.get(payload, 'row.id'), data.rowIds[2]);
            assert.equal(_.get(payload, 'row.data'), data.rows[2]);
            done();
          });

          table.element.find('tr[data-row-id="2"]').dblclick();
        });
      });

      describe('when row ids are not provided', function() {
        var data = {
          columns: [
            { fieldName: 'hello', name: 'hello column', renderTypeName: 'text' },
            { fieldName: 'goodbye', name: 'goodbye column', renderTypeName: 'number' }
          ],
          rows: [
            ['correct', 3],
            ['incorrect', 2],
            ['incorrect', 1],
            ['incorrect', 0]
          ]
        };

        it('does not emit event when double-clicking a row', function(done) {

          render(table, data);

          table.element.on('SOCRATA_VISUALIZATION_ROW_DOUBLE_CLICKED', function(event) {
            assert(false);
          });

          table.element.find('tr').dblclick();

          setTimeout(
            function() { done(); },
            200
          );
        });
      });
    });

    describe('SOCRATA_VISUALIZATION_CELL_FLYOUT', function() {
      var data;

      beforeEach(function() {
        data = {
          rows: [
            ['tiny']
          ]
        };
      });

      it('does not emit event when column does not overflow', function(done) {
        render(table, data);

        table.element.on('SOCRATA_VISUALIZATION_CELL_FLYOUT', function(event) {
          done('SOCRATA_VISUALIZATION_CELL_FLYOUT should not be triggered!');
        });

        table.element.find('td').trigger('mouseenter');
        // TODO: sinon should probably be used to determine that the handler is NOT called.
        //       Using a timeout here is kind of hacky.
        setTimeout(done, 100);
      });

      it('emits event when column overflows', function(done) {
        data.rows = [['a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think. a very gosh-darn long string of text that should overflow, I think.']];

        render(table, data);

        table.element.on('SOCRATA_VISUALIZATION_CELL_FLYOUT', function(event) {
          var payload = event.originalEvent.detail;

          assert.property(payload, 'element');
          assert.property(payload, 'content');
          assert.equal(payload.content.trim(), data.rows[0][0]);

          done();
        });

        table.element.find('td').trigger('mouseenter');
      });

      it('emits event to hide flyout on mouseleave', function(done) {
        render(table, data);

        table.element.on('SOCRATA_VISUALIZATION_CELL_FLYOUT', function(event) {
          var payload = event.originalEvent.detail;

          assert.isNull(payload);
          done();
        });

        table.element.find('td').trigger('mouseleave');
      });
    });
  });

  describe('cell alignment', function() {
    beforeEach(function() {
      table = createTable();
      render(table, {
        columns: [
          { fieldName: 'number', name: 'number', renderTypeName: 'number' },
          { fieldName: 'numberAligned', name: 'numberAligned', renderTypeName: 'number', format: { align: 'center' } },
          { fieldName: 'money', name: 'money', renderTypeName: 'money' },
          { fieldName: 'moneyAligned', name: 'moneyAligned', renderTypeName: 'money', format: { align: 'center' } },
          { fieldName: 'percent', name: 'percent', renderTypeName: 'percent' },
          { fieldName: 'percentAligned', name: 'percentAligned', renderTypeName: 'percent', format: { align: 'center' } },
          { fieldName: 'star', name: 'star', renderTypeName: 'star' },
          { fieldName: 'starAligned', name: 'starAligned', renderTypeName: 'star', format: { align: 'center' } },
          { fieldName: 'check', name: 'check', renderTypeName: 'checkbox' },
          { fieldName: 'checkAligned', name: 'checkAligned', renderTypeName: 'checkbox', format: { align: 'right' } },
          { fieldName: 'text', name: 'text', renderTypeName: 'text' },
          { fieldName: 'textAligned', name: 'textAligned', renderTypeName: 'text', format: { align: 'right' } }
        ]
      });
    });

    afterEach(function() {
      removeTable(table);
    });

    it('should align number types to right if the alignment is not set explicitly', function() {
      const columns = table.element.find('tbody tr:first-child td');

      // number default and explicitly aligned
      expect(columns[0].getAttribute('data-cell-alignment')).to.equal('right');
      expect(columns[1].getAttribute('data-cell-alignment')).to.equal('center');

      // money default and explicitly aligned
      expect(columns[2].getAttribute('data-cell-alignment')).to.equal('right');
      expect(columns[3].getAttribute('data-cell-alignment')).to.equal('center');

      // percent default and explicitly aligned
      expect(columns[4].getAttribute('data-cell-alignment')).to.equal('right');
      expect(columns[5].getAttribute('data-cell-alignment')).to.equal('center');

      // star default and explicitly aligned
      expect(columns[6].getAttribute('data-cell-alignment')).to.equal('right');
      expect(columns[7].getAttribute('data-cell-alignment')).to.equal('center');
    });

    it('should align checkboxes to center if the alignment is not set explicitly', function() {
      const checkboxColumns = table.element.find('tbody tr:first-child td[data-cell-render-type="checkbox"]');

      expect(checkboxColumns[0].getAttribute('data-cell-alignment')).to.equal('center');
      expect(checkboxColumns[1].getAttribute('data-cell-alignment')).to.equal('right');
    });

    it('should align others to left if the alignment is not set explicitly', function() {
      const textColumns = table.element.find('tbody tr:first-child td[data-cell-render-type="text"]');

      expect(textColumns[0].getAttribute('data-cell-alignment')).to.equal('left');
      expect(textColumns[1].getAttribute('data-cell-alignment')).to.equal('right');
    });
  });
});
