import _ from 'lodash';
import $ from 'jquery';
import testData from '../testData';
import { __RewireAPI__ as TableAPI } from 'common/visualizations/Table';

describe('Table', () => {
  let $container;
  const tableVIF = {
    columnName: '',
    configuration: {
      order: [
        {
          ascending: true,
          columnName: 'ward'
        }
      ]
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
    _.defer(() => {
      _.defer(done);
    });
  }

  beforeEach(() => {
    $container = $('<div>').attr('id', 'test-table').css({ width: 640, height: 480 });
    $('body').append($container);
  });

  afterEach(() => {
    $('#test-table').remove();
  });

  describe('jQuery component', () => {
    let revertRewire;
    let vif;
    let getTableDataSpy;
    let tableRenderSpy;
    let tableRenderErrorSpy;
    // Arbitrary choice, in real life MetadataProvider.getDisplayableColumns provides this for us.
    let theSingleNonDisplayableColumn = 'location_city';
    let displayableColumns;
    let displayableColumnNames;

    beforeEach((done) => {
      vif = _.cloneDeep(tableVIF);
      getTableDataSpy = sinon.spy(_.constant(
        Promise.resolve({
          rows: [],
          columns: testData.CHICAGO_CRIMES_DATASET_METADATA.columns
        })
      ));
      tableRenderSpy = sinon.spy();
      tableRenderErrorSpy = sinon.spy();

      displayableColumns = _.filter(
        testData.CHICAGO_CRIMES_DATASET_METADATA.columns,
        (column) => column.fieldName !== theSingleNonDisplayableColumn
      );
      displayableColumnNames = _.map(displayableColumns, 'fieldName');

      // Mock data providers
      TableAPI.__Rewire__('MetadataProvider', function() {
        this.getDatasetMetadata = _.constant(
          Promise.resolve(testData.CHICAGO_CRIMES_DATASET_METADATA)
        );
        this.getDisplayableColumns = () => displayableColumns;
      });

      TableAPI.__Rewire__('SoqlDataProvider', function() {
        this.getTableData = getTableDataSpy;
        this.getRowCount = _.constant(Promise.resolve(123));
        this.getConfigurationProperty = _.constant('configProperty');
      });

      TableAPI.__Rewire__('Table', function() {
        this.howManyRowsCanFitInHeight = _.constant(6);
        this.destroy = _.noop;
        this.render = tableRenderSpy;
        this.renderError = tableRenderErrorSpy;
        this.showBusyIndicator = _.noop;
        this.hideBusyIndicator = _.noop;
      });

      $container.socrataTable(vif);

      flushDataRequests(done);
    });

    afterEach(() => {
      TableAPI.__ResetDependency__('MetadataProvider');
      TableAPI.__ResetDependency__('SoqlDataProvider');
      TableAPI.__ResetDependency__('Table');

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

    it('displays only displayable columns', () => {
      // We're testing that Table delegates to MetadataProvider.getDisplayableColumns.
      const calls = tableRenderSpy.getCalls();

      assert.lengthOf(calls, 2);

      const columnNamesQueriedFor = _.map(
        calls[0].args[1].columns,
        'fieldName'
      );

      assert.include(columnNamesQueriedFor, 'ward');
      assert.notInclude(columnNamesQueriedFor, theSingleNonDisplayableColumn);
    });

    it('uses the order specified in the VIF', () => {
      const calls = getTableDataSpy.getCalls();
      assert.lengthOf(calls, 1);

      assert.deepEqual(
        getGetTableDataArgumentsHash(calls[0]),
        {
          columnNames: displayableColumnNames,
          order: tableVIF.configuration.order,
          limit: 6,
          offset: 0
        }
      );
    });

    describe('when order is not in VIF', () => {
      let originalMetadata;

      beforeEach(() => {
        originalMetadata = testData.CHICAGO_CRIMES_DATASET_METADATA;
      });

      afterEach(() => {
        testData.CHICAGO_CRIMES_DATASET_METADATA = originalMetadata;
      });

      it('uses the default sort order when the view has a sort in query', (done) => {
        delete vif.configuration.order;

        getTableDataSpy.reset();
        emitEvent($container, 'SOCRATA_VISUALIZATION_RENDER_VIF', vif);

        _.defer(() => {
          const calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 1);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[0]),
            {
              columnNames: displayableColumnNames,
              order: [{ ascending: false, columnName: 'date' }],
              limit: 6,
              offset: 0
            }
          );

          done();
        });
      });

      it('uses the system id when the view does not have a group by', (done) => {
        const newVif = _.cloneDeep(vif);
        delete newVif.configuration.order;
        // we're modifying the domain name to trick the memoized dataset metadata request to
        // invalidate its cache
        newVif.domain = 'unexample.com';

        delete testData.CHICAGO_CRIMES_DATASET_METADATA.query.orderBys;

        getTableDataSpy.reset();
        emitEvent($container, 'SOCRATA_VISUALIZATION_RENDER_VIF', newVif);

        _.defer(() => {
          const calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 1);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[0]),
            {
              columnNames: displayableColumnNames,
              order: [{ ascending: true, columnName: ':id' }],
              limit: 6,
              offset: 0
            }
          );

          done();
        });
      });

      it('it guesses an appropropriate order when the view has a group by', (done) => {
        const newVif = _.cloneDeep(vif);
        delete newVif.configuration.order;
        // we're modifying the domain name to trick the memoized dataset metadata request to
        // invalidate its cache
        newVif.domain = 'unexample.com';

        delete testData.CHICAGO_CRIMES_DATASET_METADATA.query.orderBys;
        testData.CHICAGO_CRIMES_DATASET_METADATA.query.groupBys = 'fake group by';
        testData.CHICAGO_CRIMES_DATASET_METADATA.flags = [];

        getTableDataSpy.reset();
        emitEvent($container, 'SOCRATA_VISUALIZATION_RENDER_VIF', newVif);

        _.defer(() => {
          const calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 1);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[0]),
            {
              columnNames: displayableColumnNames,
              order: [{ ascending: true, columnName: 'case_number' }],
              limit: 6,
              offset: 0
            }
          );

          done();
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_PAGINATION_NEXT', () => {
      beforeEach((done) => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        emitEvent($container, 'SOCRATA_VISUALIZATION_PAGINATION_NEXT');

        // Allow the mock data providers to resolve.
        flushDataRequests(done);
      });

      it('makes a data request for the next page', () => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[0]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'ward' }],
            limit: 6,
            offset: 0
          }
        );

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[1]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'ward' }],
            limit: 6,
            offset: 6
          }
        );
      });

      describe('then SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', (done) => {
        beforeEach((done) => {
          const calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 2); // Just test sanity.

          emitEvent($container, 'SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');

          // Allow the mock data providers to resolve.
          flushDataRequests(done);
        });

        it('makes a data request for the original page', () => {
          const calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 3);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[2]),
            {
              columnNames: displayableColumnNames,
              order: [{ ascending: true, columnName: 'ward' }],
              limit: 6,
              offset: 0
            }
          );
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED to sort a column in ASC order', () => {
      let vifUpdatedSpy;
      beforeEach((done) => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        vifUpdatedSpy = sinon.spy();
        $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', vifUpdatedSpy);

        emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', { columnName: 'district', ascending: true });
        // Allow the mock data providers to resolve.
        flushDataRequests(done);
      });

      it('makes a data request that sorts ASC on the "district" column', () => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[0]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'ward' }],
            limit: 6,
            offset: 0
          }
        );

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[1]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'district' }],
            limit: 6,
            offset: 0
          }
        );
      });

      it('emits SOCRATA_VISUALIZATION_VIF_UPDATED', () => {
        const calls = vifUpdatedSpy.getCalls();
        assert.lengthOf(calls, 1);

        const newVIF = calls[0].args[0].originalEvent.detail;
        const expectedVIF = _.cloneDeep(tableVIF);
        _.set(expectedVIF, 'configuration.order[0].columnName', 'district');
        _.set(expectedVIF, 'configuration.order[0].ascending', true);

        assert.deepEqual(
          _.get(newVIF, 'configuration.order'),
          _.get(expectedVIF, 'configuration.order')
        );
      });
    });

    describe('on SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED to sort a column in DESC order', () => {
      let vifUpdatedSpy;
      beforeEach((done) => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        vifUpdatedSpy = sinon.spy();
        $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', vifUpdatedSpy);

        emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', { columnName: 'district', ascending: false });
        // Allow the mock data providers to resolve.
        flushDataRequests(done);
      });

      it('makes a data request that sorts DESC on the "district" column', () => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[0]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'ward' }],
            limit: 6,
            offset: 0
          }
        );

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[1]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: false, columnName: 'district' }],
            limit: 6,
            offset: 0
          }
        );
      });

      it('emits SOCRATA_VISUALIZATION_VIF_UPDATED', () => {
        const calls = vifUpdatedSpy.getCalls();
        assert.lengthOf(calls, 1);

        const newVIF = calls[0].args[0].originalEvent.detail;
        const expectedVIF = _.cloneDeep(tableVIF);
        _.set(expectedVIF, 'configuration.order[0].columnName', 'district');
        _.set(expectedVIF, 'configuration.order[0].ascending', false);

        assert.deepEqual(
          _.get(newVIF, 'configuration.order'),
          _.get(expectedVIF, 'configuration.order')
        );
      });
    });

    describe('on SOCRATA_VISUALIZATION_COLUMN_CLICKED for a currently unsorted column', () => {
      let vifUpdatedSpy;
      beforeEach((done) => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        vifUpdatedSpy = sinon.spy();
        $container.on('SOCRATA_VISUALIZATION_VIF_UPDATED', vifUpdatedSpy);

        emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
        // Allow the mock data providers to resolve.
        flushDataRequests(done);
      });

      it('makes a data request that sorts ASC on the column', () => {
        const calls = getTableDataSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[0]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'ward' }],
            limit: 6,
            offset: 0
          }
        );

        assert.deepEqual(
          getGetTableDataArgumentsHash(calls[1]),
          {
            columnNames: displayableColumnNames,
            order: [{ ascending: true, columnName: 'district' }],
            limit: 6,
            offset: 0
          }
        );
      });

      it('emits SOCRATA_VISUALIZATION_VIF_UPDATED', () => {
        const calls = vifUpdatedSpy.getCalls();
        assert.lengthOf(calls, 1);

        const newVIF = calls[0].args[0].originalEvent.detail;
        const expectedVIF = _.cloneDeep(tableVIF);
        _.set(expectedVIF, 'configuration.order[0].columnName', 'district');

        assert.deepEqual(
          _.get(newVIF, 'configuration.order'),
          _.get(expectedVIF, 'configuration.order')
        );
      });

      describe('then another SOCRATA_VISUALIZATION_COLUMN_CLICKED on the same column', () => {
        beforeEach((done) => {
          emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
          // Allow the mock data providers to resolve.
          flushDataRequests(done);
        });

        it('makes a data request that sorts DESC on the column', () => {
          const calls = getTableDataSpy.getCalls();
          assert.lengthOf(calls, 3);

          assert.deepEqual(
            getGetTableDataArgumentsHash(calls[2]),
            {
              columnNames: displayableColumnNames,
              order: [{ ascending: false, columnName: 'district' }],
              limit: 6,
              offset: 0
            }
          );
        });

        describe('then yet another another SOCRATA_VISUALIZATION_COLUMN_CLICKED on the same column', () => {
          beforeEach((done) => {
            emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
            // Allow the mock data providers to resolve.
            flushDataRequests(done);
          });

          it('makes a data request that sorts ASC on the column', () => {
            const calls = getTableDataSpy.getCalls();
            assert.lengthOf(calls, 4);

            assert.deepEqual(
              getGetTableDataArgumentsHash(calls[3]),
              {
                columnNames: displayableColumnNames,
                order: [{ ascending: true, columnName: 'district' }],
                limit: 6,
                offset: 0
              }
            );
          });
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_CELL_FLYOUT', () => {
      it('emits a flyout render event', (done) => {
        $container.on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
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

    describe('on SOCRATA_VISUALIZATION_COLUMN_FLYOUT', () => {
      it('emits a flyout render event', (done) => {
        $container.on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
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
