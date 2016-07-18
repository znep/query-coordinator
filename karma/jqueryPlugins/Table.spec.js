var _ = require('lodash');
var $ = require('jquery');
var rewire = require('rewire');
var Table = rewire('../../src/Table');

describe('views/Table', function() {

  'use strict';

  var $container;
  var tableVIF = {
    columnName: '',
    configuration: {
      localization: {
        previous: 'translation for previous button',
        next: 'translation for next button',
        no_rows: 'translation for no rows',
        only_row: 'translation for only one row',
        many_rows: 'translation for many rows',
        all_rows: 'translation for all rows',
        latitude: 'translation for latitude',
        longitude: 'translation for longitude'
      },
      order: [
        {
          ascending: true,
          columnName: 'ward'
        }
      ],
    },
    datasetUid: 'snuk-a5kv',
    domain: 'dataspace.demo.socrata.com',
    filters: [],
    type: 'table',
    unit: {
      one: 'row',
      other: 'rows'
    }
  };

  function destroyVisualization($container) {
    $container.trigger('SOCRATA_VISUALIZATION_DESTROY');
    $container.remove();
  }

  // Maps a sinon spy call object on getTableData to a destructured
  // argument hash.
  function getGetTableDataArgumentsHash(call) {
    // function getTableData(columnNames, order, offset, limit) { ... }
    return {
      columnNames: call.args[0],
      order: call.args[1],
      offset: call.args[2],
      limit: call.args[3]
    };
  }

  function flushDataRequests(done) {
    // Allow the mock data providers to resolve.
    // There are two data requests (dataset metadata, dataset rows),
    // and they're done sequentially.
    // Native promises need one frame to resolve.
    // Hende the two defers.
    _.defer(function() {
      _.defer(done);
    });
  }

  beforeEach(function() {
    $container = $('<div>').attr('id', 'test-table').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  afterEach(function() {
    $('#test-table').remove();
  });

  describe('jQuery component', function() {
    var revertRewire;
    var vif;
    var getTableDataSpy;
    var tableRenderSpy;
    var tableRenderErrorSpy;
    // Arbitrary choice, in real life MetadataProvider.getDisplayableColumns provides this for us.
    var theSingleNonDisplayableColumn = 'location_city';
    var displayableColumns;
    var displayableColumnNames;

    beforeEach(function(done) {
      vif = _.cloneDeep(tableVIF);
      getTableDataSpy = sinon.spy(_.constant(
        Promise.resolve({
          rows: [],
          columns: window.testData.CHICAGO_CRIMES_DATASET_METADATA.columns
        })
      ));
      tableRenderSpy = sinon.spy();
      tableRenderErrorSpy = sinon.spy();

      displayableColumns = _.filter(
        window.testData.CHICAGO_CRIMES_DATASET_METADATA.columns,
        function(column) {
          return column.fieldName !== theSingleNonDisplayableColumn;
        }
      );
      displayableColumnNames = _.map(displayableColumns, 'fieldName');

      // Mock data providers

      revertRewire = Table.__set__({
        MetadataProvider: function() {
          this.getDatasetMetadata = _.constant(
            Promise.resolve(window.testData.CHICAGO_CRIMES_DATASET_METADATA)
          );
          this.getDisplayableColumns = function() {
            return displayableColumns;
          };
        },
        SoqlDataProvider: function() {
          this.getTableData = getTableDataSpy;
          this.getRowCount = _.constant(Promise.resolve(123));
          this.getConfigurationProperty = _.constant('configProperty')
        },
        Table: function() {
          this.howManyRowsCanFitInHeight = _.constant(6);
          this.destroy = _.noop;
          this.render = tableRenderSpy;
          this.renderError = tableRenderErrorSpy;
        }
      });

      $container.socrataTable(vif);

      flushDataRequests(done);
    });

    afterEach(function() {
      revertRewire();
      destroyVisualization($container);
    });

    function emitEvent(element, name, payload) {
      element[0].dispatchEvent(
        new window.CustomEvent(
          name,
          { detail: payload, bubbles: true }
        )
      );
    }

    it('displays only displayable columns', function() {
      // We're testing that Table delegates to MetadataProvider.getDisplayableColumns.
      var calls = tableRenderSpy.getCalls();

      assert.lengthOf(calls, 1);

      var columnNamesQueriedFor = _.map(
        calls[0].args[0].columns,
        'fieldName'
      );

      assert.include(columnNamesQueriedFor, 'ward');
      assert.notInclude(columnNamesQueriedFor, theSingleNonDisplayableColumn);
    });

    describe('on SOCRATA_VISUALIZATION_PAGINATION_NEXT', function() {
      beforeEach(function(done) {
        var calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        emitEvent($container, 'SOCRATA_VISUALIZATION_PAGINATION_NEXT');

        // Allow the mock data providers to resolve.
        flushDataRequests(done);
      });

      it('makes a data request for the next page', function() {
        var calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[0]),
          {
            columnNames: displayableColumnNames,
            order: [ { ascending: true, columnName: 'ward' } ],
            limit: 6,
            offset: 0
          }
        );

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[1]),
          {
            columnNames: displayableColumnNames,
            order: [ { ascending: true, columnName: 'ward' } ],
            limit: 6,
            offset: 6
          }
        );
      });

      describe('then SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', function(done) {
        beforeEach(function(done) {
          var calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 2); // Just test sanity.

          emitEvent($container, 'SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');

          // Allow the mock data providers to resolve.
          flushDataRequests(done);
        });

        it('makes a data request for the original page', function() {
          var calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 3);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[2]),
            {
              columnNames: displayableColumnNames,
              order: [ { ascending: true, columnName: 'ward' } ],
              limit: 6,
              offset: 0
            }
          );
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_COLUMN_CLICKED for a currently unsorted column', function() {
      var vifUpdatedSpy;
      beforeEach(function(done) {
        var calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        vifUpdatedSpy = sinon.spy();
        $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', vifUpdatedSpy);

        emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
        // Allow the mock data providers to resolve.
        flushDataRequests(done);
      });

      it('makes a data request that sorts ASC on the column', function() {
        var calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[0]),
          {
            columnNames: displayableColumnNames,
            order: [ { ascending: true, columnName: 'ward' } ],
            limit: 6,
            offset: 0
          }
        );

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[1]),
          {
            columnNames: displayableColumnNames,
            order: [ { ascending: true, columnName: 'district' } ],
            limit: 6,
            offset: 0
          }
        );
      });

      it('emits SOCRATA_VISUALIZATION_VIF_UPDATED', function() {
        var calls = vifUpdatedSpy.getCalls();
        assert.lengthOf(calls, 1);

        var newVIF = calls[0].args[0].originalEvent.detail;
        var expectedVIF = _.cloneDeep(tableVIF);
        _.set(expectedVIF, 'configuration.order[0].columnName', 'district');

        assert.deepEqual(
          newVIF,
          expectedVIF
        );
      });

      describe('then another SOCRATA_VISUALIZATION_COLUMN_CLICKED on the same column', function() {
        beforeEach(function(done) {
          emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
          // Allow the mock data providers to resolve.
          flushDataRequests(done);
        });

        it('makes a data request that sorts DESC on the column', function() {
          var calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 3);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[2]),
            {
              columnNames: displayableColumnNames,
              order: [ { ascending: false, columnName: 'district' } ],
              limit: 6,
              offset: 0
            }
          );
        });

        describe('then yet another another SOCRATA_VISUALIZATION_COLUMN_CLICKED on the same column', function() {
          beforeEach(function(done) {
            emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
            // Allow the mock data providers to resolve.
            flushDataRequests(done);
          });

          it('makes a data request that sorts ASC on the column', function() {
            var calls = getTableDataSpy.getCalls();
            assert.lengthOf(calls, 4);

            assert.deepEqual(
              getGetTableDataArgumentsHash(calls[3]),
              {
                columnNames: displayableColumnNames,
                order: [ { ascending: true, columnName: 'district' } ],
                limit: 6,
                offset: 0
              }
            );
          });
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_CELL_FLYOUT', function() {
      it('emits a flyout render event', function(done) {
        $container.on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {
          assert.deepEqual(event.originalEvent.detail, {
            stuff: 'things'
          });
          done();
        });

        emitEvent($container, 'SOCRATA_VISUALIZATION_CELL_FLYOUT', {
          stuff: 'things'
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function() {
      it('emits a flyout render event', function(done) {
        $container.on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {
          assert.deepEqual(event.originalEvent.detail, {
            stuff: 'things'
          });
          done();
        });

        emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_FLYOUT', {
          stuff: 'things'
        });
      });
    });
  });
});
