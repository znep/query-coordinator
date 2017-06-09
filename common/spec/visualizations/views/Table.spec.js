var _ = require('lodash');
var $ = require('jquery');
var Table = require('common/visualizations/views/Table');

describe('Table', function() {

  function createTable(overrideVIF) {
    var element = $( '<div>', {'id': 'table'});

    $('body').append(element);

    var tableVIF = {
      configuration: {
        order: [{
          columnName: 'test',
          ascending: true
        }]
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
      }
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
        rows[index] = rows[index] || {};
        rows[index][column] = column + ':' + index;
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
        rows: generatedRows
      }
    );
  }

  /**
   * Tests begin here
   */

  var table;

  afterEach(function() {
    if ($('#table').length) {
      throw new Error('A test in this spec file did not clean up its table. This may cause downstream test failures.');
    }
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
        throw 'Table did not remove handlers correctly'
      });

      table.table.destroy();
    });
  });

  describe('layout', function() {
    beforeEach(function() {
      table = createTable(
        {
          configuration:{
            order: [{ascending: true, columnName: 'hello'}]
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

    describe('SOCRATA_VISUALIZATION_COLUMN_CLICKED', function() {
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

    describe('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function() {
      var data;

      var emit = function(event) {
        return function (selector) {
          table.element.find(selector).trigger(event);
        }
      };
      var mouseenter = emit('mouseenter');
      var mouseleave = emit('mouseleave');
      var onmouseenter = function(callback, done) {
        table.element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function(event) {
          callback(event.originalEvent.detail);
          done();
        });
      };

      beforeEach(function() {
        data = {
          columns: [
            { description: 'world', fieldName: 'hello', name: 'hello', renderTypeName: 'text' },
            { description: null, fieldName: 'rawr', name: 'rawr', renderTypeName: 'text' }
          ]
        }
      });

      describe('when the column has a description', function() {
        it('emits event with content that contains both the column name and description', function(done) {
          render(table, data);

          onmouseenter(function(payload) {
            assert.property(payload, 'element');
            assert.property(payload, 'content');
            assert.match(payload.content, /hello/);
            assert.match(payload.content, /world/);
          }, done);

          mouseenter('th:first-child');
        });
      });

      describe('when the column does not have a description', function() {
        it('emits event with content that contains the column name and no_column_description localization', function(done) {
          render(table, data);

          onmouseenter(function(payload) {
            assert.property(payload, 'element');
            assert.property(payload, 'content');
            assert.match(payload.content, /no description provided/i);
          }, done);

          mouseenter('th:nth-child(2)');
        });
      });

      it('emits event to hide flyout on mouseleave', function(done) {
        render(table, data);

        onmouseenter(function(payload) {
          assert.isNull(payload);
        }, done);

        mouseleave('th:first-child');
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
