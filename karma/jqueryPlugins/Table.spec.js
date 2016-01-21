var rewire = require('rewire');
var Table = rewire('../../src/Table');

describe('Table', function() {

  'use strict';

  var $container;
  var tableVIF = {
    configuration: {
      localization: {
        PREVIOUS: 'translation for previous button',
        NEXT: 'translation for next button',
        NO_ROWS: 'translation for no rows',
        ONLY_ROW: 'translation for only one row',
        MANY_ROWS: 'translation for many rows',
        LATITUDE: 'translation for latitude',
        LONGITUDE: 'translation for longitude'
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
    unit: {
      one: 'row',
      other: 'rows'
    }
  };

  function destroyVisualization($container) {
    $container.trigger('SOCRATA_VISUALIZATION_DESTROY');
    $container.remove();
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
    var getRowsSpy;
    var tableRenderSpy;

    beforeEach(function(done) {
      vif = _.cloneDeep(tableVIF);
      getRowsSpy = sinon.spy(_.constant(
        Promise.resolve({
          rows: [],
          columns: _.pluck(window.testData.CHICAGO_CRIMES_DATASET_METADATA.columns, 'fieldName')
        })
      ));
      tableRenderSpy = sinon.spy();

      // Mock data providers
      revertRewire = Table.__set__({
        MetadataProvider: function() {
          this.getDatasetMetadata = _.constant(
            Promise.resolve(window.testData.CHICAGO_CRIMES_DATASET_METADATA)
          );
          this.isSubcolumn = function(columnName) {
            return columnName === 'location_city';
          };
        },
        SoqlDataProvider: function() {
          this.getRows = getRowsSpy;
          this.getRowCount = _.constant(Promise.resolve(123));
        },
        Table: function() {
          this.howManyRowsCanFitInHeight = _.constant(6);
          this.destroy = _.noop;
          this.render = tableRenderSpy;
        }
      });

      $container.socrataTable(vif);

      // Allow the mock data providers to resolve.
      _.defer(done);
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

    it('rejects subcolumns', function() {
      // Note that isSubcolumn is stubbed to only return true on 'location_city'
      var calls = tableRenderSpy.getCalls();

      assert.lengthOf(calls, 1);
      assert.include(calls[0].args[0].columns, 'ward');
      assert.notInclude(calls[0].args[0].columns, 'location_city');
    });

    describe('on SOCRATA_VISUALIZATION_PAGINATION_NEXT', function() {
      beforeEach(function(done) {
        var calls = getRowsSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        emitEvent($container, 'SOCRATA_VISUALIZATION_PAGINATION_NEXT');

        // Allow the mock data providers to resolve.
        _.defer(done);
      });

      it('makes a data request for the next page', function() {
        var calls = getRowsSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.equal(calls[0].args[0], '$order=`ward`+ASC&$limit=6&$offset=0')
        assert.equal(calls[1].args[0], '$order=`ward`+ASC&$limit=6&$offset=6')
      });

      describe('then SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', function(done) {
        beforeEach(function(done) {
          var calls = getRowsSpy.getCalls();
          assert.lengthOf(calls, 2); // Just test sanity.

          emitEvent($container, 'SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');

          // Allow the mock data providers to resolve.
          _.defer(done);
        });

        it('makes a data request for the original page', function() {
          var calls = getRowsSpy.getCalls();
          assert.lengthOf(calls, 3);

          assert.equal(calls[2].args[0], '$order=`ward`+ASC&$limit=6&$offset=0')
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_COLUMN_CLICKED for a currently unsorted column', function() {
      beforeEach(function(done) {
        var calls = getRowsSpy.getCalls();
        assert.lengthOf(calls, 1); // Just test sanity.

        emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
        // Allow the mock data providers to resolve.
        _.defer(done);

      });

      it('makes a data request that sorts ASC on the column', function() {
        var calls = getRowsSpy.getCalls();
        assert.lengthOf(calls, 2);

        assert.equal(calls[0].args[0], '$order=`ward`+ASC&$limit=6&$offset=0')
        assert.equal(calls[1].args[0], '$order=`district`+ASC&$limit=6&$offset=0')
      });

      describe('then another SOCRATA_VISUALIZATION_COLUMN_CLICKED on the same column', function() {
        beforeEach(function(done) {
          emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
          // Allow the mock data providers to resolve.
          _.defer(done);
        });

        it('makes a data request that sorts DESC on the column', function() {
          var calls = getRowsSpy.getCalls();
          assert.lengthOf(calls, 3);

          assert.equal(calls[2].args[0], '$order=`district`+DESC&$limit=6&$offset=0')
        });

        describe('then yet another another SOCRATA_VISUALIZATION_COLUMN_CLICKED on the same column', function() {
          beforeEach(function(done) {
            emitEvent($container, 'SOCRATA_VISUALIZATION_COLUMN_CLICKED', 'district');
            // Allow the mock data providers to resolve.
            _.defer(done);
          });

          it('makes a data request that sorts ASC on the column', function() {
            var calls = getRowsSpy.getCalls();
            assert.lengthOf(calls, 4);

            assert.equal(calls[3].args[0], '$order=`district`+ASC&$limit=6&$offset=0')
          });
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_CELL_FLYOUT', function() {
      it('emits a flyout render event', function(done) {
        $container.on('SOCRATA_VISUALIZATION_TABLE_FLYOUT', function(event) {
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
        $container.on('SOCRATA_VISUALIZATION_TABLE_FLYOUT', function(event) {
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
