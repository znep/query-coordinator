// EN-17053/EN-16787 - Use socrata-viz table for NBE-only grid view
//
// We don't actually want this code to run if we are not showing the Socrata Viz
// table in the grid view, so the whole thing needs to be inside the feature
// flag check. Since this is NOT a fancy-shmancy JavaScript module that gets
// imported or required, this is no problem!
if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {

  // Importing socrata-visualizations causes a lodash version conflict, which
  // breaks the page in less-than-verbose ways and was pretty frustrating to
  // shake out. So we need to alias the stuff the old frontend code is calling
  // to their equivalents in newer versions of lodash.
  (function() {
    _.detect = _.find;
    _.include = _.includes;
    _.any = _.some;
    _.select = _.filter;
    _.contains = _.includes;
    _.all = _.every;
  })();

  // The actual implementation begins here.
  (function($) {
    $.fn.socrataTable = window.blist.Visualizations.Table;

    $.fn.isSocrataVizDatasetGrid = function() {
      return !_.isUndefined($(this[0]).data('socrataVizDatasetGrid'));
    };

    $.fn.socrataVizDatasetGrid = function(options) {
      // Check if object was already created
      var socrataVizDatasetGrid = $(this[0]).data('socrataVizDatasetGrid');
      if (!socrataVizDatasetGrid) {
        /* eslint-disable new-cap */
        socrataVizDatasetGrid = new $.socrataVizDatasetGridObject(
          options,
          this[0]
        );
        /* eslint-enable new-cap */
      }
      return socrataVizDatasetGrid;
    };

    $.socrataVizDatasetGridObject = function(options, grid) {
      this.settings = $.extend(
        {},
        $.socrataVizDatasetGridObject.defaults,
        options
      );
      this.currentGrid = grid;
      this.init();
    };

    $.extend(
      $.socrataVizDatasetGridObject,
      {
        defaults: {
          addColumnCallback: function() {},
          columnDeleteEnabled: false,
          columnHideEnabled: true,
          columnNameEdit: false,
          columnPropertiesEnabled: false,
          editColumnCallback: function() {},
          editEnabled: true,
          manualResize: false,
          showRowHandle: false,
          showRowNumbers: true,
          showAddColumns: false,
          view: null
        },

        prototype: {
          init: function() {

            function generateSelectFromJsonQuery(jsonQuery) {
              var select;

              if (jsonQuery.hasOwnProperty('select')) {

                select = jsonQuery.select.
                  map(function(column) {
                    if (column.hasOwnProperty('aggregate')) {
                      var aggregation = column.aggregate.toUpperCase();
                      var fieldName = column.columnFieldName;

                      return aggregation + '(' + fieldName + ') as `' + fieldName + '`';
                    } else {
                      return '`' + column.columnFieldName + '`';
                    }
                  }).
                  join(',');
              } else {
                select = '*';
              }

              return select;
            }

            function generateGroupFromJsonQuery(jsonQuery) {
              var groups;

              if (jsonQuery.hasOwnProperty('group')) {

                groups = jsonQuery.group.
                  map(function(column) {
                    return column.columnFieldName;
                  }).
                  join(',');
              } else {
                groups = '';
              }

              return groups;
            }

            function generateOrderFromColumnsAndJsonQuery(columns, jsonQuery) {
              var order = '';

              if (jsonQuery.hasOwnProperty('order')) {

                order = jsonQuery.order.
                  map(
                    function(orderParam) {
                      var direction = (orderParam.ascending) ? 'ASC' : 'DESC';

                      return '`' + orderParam.columnFieldName + '` ' + direction;
                    }
                  ).
                  join(',');
              } else {
                order = '`' + columns[0].fieldName + '` ASC';
              }

              return order;
            }

            function generateNewVifFromDatasetState() {
              var newVif = _.cloneDeep(lastRenderedVif);
              var params = view._activeRowSet._generateQueryParams();
              var queryParams = {
                select: null,
                // We don't want to get into the business of writing yet another
                // parser for the crazy way that the Dataset model represents
                // filters, so instead we'll just rely on it mapping its
                // internal model to a SoQL string instead of deriving it from
                // the jsonQuery object like we do for select, group and order.
                where: params.$where || '',
                group: null,
                order: null,
                search: params.$search || ''
              };
              var jsonQuery;
              var columns = view.visibleColumns.sort(function(a,b) {
                return (b.position >= a.position) ? -1 : 1;
              });
              var order;

              view._syncQueries();

              jsonQuery = _.get(view, 'metadata.jsonQuery', {});

              queryParams.select = generateSelectFromJsonQuery(jsonQuery);
              queryParams.group = generateGroupFromJsonQuery(jsonQuery);
              queryParams.order = generateOrderFromColumnsAndJsonQuery(
                columns,
                jsonQuery
              );

              _.set(newVif, 'series[0].dataSource.queryParams', queryParams);

              order = (jsonQuery.order || []).map(function(orderClause) {
                return {
                  columnName: orderClause.columnFieldName,
                  ascending: orderClause.ascending
                };
              });

              _.set(newVif, 'configuration.order', order);

              return newVif;
            }

            function updateViewWithNewOrderFromVif(viewToUpdate, newOrderFromVif) {
              var newMetadata = $.extend(true, {}, viewToUpdate.metadata);
              var newOrder = [{
                columnFieldName: newOrderFromVif[0].columnName,
                ascending: newOrderFromVif[0].ascending
              }];

              _.set(newMetadata, 'jsonQuery.order', newOrder);

              viewToUpdate.update(
                {
                  metadata: newMetadata
                },
                false,
                (newOrder || []).length < 2
              );
            }

            function updateViewWithNewTableColumnWidthsFromVif(
              viewToUpdate,
              newColumnWidthsFromVif
            ) {
              var newDataset = _.cloneDeep(viewToUpdate.cleanCopy());

              newDataset.columns.forEach(function(column) {

                if (newColumnWidthsFromVif.hasOwnProperty(column.fieldName)) {

                  column.width = newColumnWidthsFromVif[column.fieldName];
                }
              });

              viewToUpdate.update(
                newDataset,
                false,
                false
              );
            }

            function initializeTable() {

              function rerenderTableOnDatasetStateChange() {
                var newVifToRender = generateNewVifFromDatasetState();
                var renderVifEvent = new window.CustomEvent(
                  'SOCRATA_VISUALIZATION_RENDER_VIF',
                  {
                    detail: newVifToRender,
                    bubbles: false
                  }
                );

                $socrataVizDatasetGrid[0].dispatchEvent(renderVifEvent);

                lastRenderedVif = _.cloneDeep(newVifToRender);
              }

              function rerenderTableOnViewportSizeChange() {
                var invalidateSizeEvent = new window.CustomEvent(
                  'SOCRATA_VISUALIZATION_INVALIDATE_SIZE'
                );

                $socrataVizDatasetGrid[0].dispatchEvent(invalidateSizeEvent);
              }

              var newVif = generateNewVifFromDatasetState();

              $socrataVizDatasetGrid.data('socrataVizDatasetGrid', this);
              $socrataVizDatasetGrid.socrataTable(newVif);

              lastRenderedVif = _.cloneDeep(newVif);

              view.bind('query_change', rerenderTableOnDatasetStateChange);
              view.bind('columns_changed', rerenderTableOnDatasetStateChange);

              $socrataVizDatasetGrid.
                on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(e) {

                var lastRenderedOrder = _.get(
                  lastRenderedVif,
                  'configuration.order',
                  null
                );
                var lastRenderedTableColumnWidths = _.get(
                  lastRenderedVif,
                  'configuration.tableColumnWidths',
                  null
                );
                var updatedVif = e.originalEvent.detail;
                var updatedOrder = _.get(
                  updatedVif,
                  'configuration.order',
                  null
                );
                var updatedTableColumnWidths = _.get(
                  updatedVif,
                  'configuration.tableColumnWidths',
                  null
                );
                var orderEqual = _.isEqual(lastRenderedOrder, updatedOrder);
                var tableColumnWidthsEqual = _.isEqual(
                  lastRenderedTableColumnWidths,
                  updatedTableColumnWidths
                );

                if (!orderEqual) {
                  updateViewWithNewOrderFromVif(view, updatedOrder);
                }

                if (!tableColumnWidthsEqual) {

                  updateViewWithNewTableColumnWidthsFromVif(
                    view,
                    updatedTableColumnWidths
                  );
                }
              });

              $(window).on('resize', rerenderTableOnViewportSizeChange);
            }

            var $socrataVizDatasetGrid = this.$dom();
            var view = this.settings.view;
            var tableColumnWidths = {};

            this.settings.view.realColumns.forEach(function(realColumn) {
              tableColumnWidths[realColumn.fieldName] = realColumn.width;
            });

            var vif = {
              format: {
                type: 'visualization_interchange_format',
                version: 2
              },
              configuration: {
                order: [],
                tableColumnWidths: tableColumnWidths,
                viewSourceDataLink: false
              },
              description: null,
              series: [
                {
                  color: {
                  },
                  dataSource: {
                    datasetUid: view.id,
                    dimension: {
                      columnName: null,
                      aggregationFunction: null
                    },
                    domain: view.domainCName,
                    measure: {
                      columnName: null,
                      aggregationFunction: 'count'
                    },
                    type: 'socrata.soql',
                    filters: []
                  },
                  label: null,
                  type: 'table',
                  unit: {
                    one: 'case',
                    other: 'cases'
                  }
                }
              ],
              title: null
            };
            var lastRenderedVif = _.cloneDeep(vif);

            // <RowSet>._generateQueryParams() requires that the in-memory
            // dataset object has a 'query base', which is apparently calculated
            // asynchronously. We therefore have to use a callback to actually
            // initialize the table, since we don't know if a 'query base' has
            // been set on the in-memory dataset object--it won't have been if
            // the user started on a default view, for example. The in-memory
            // dataset object is mutated by <Dataset>.getQueryBase() to set the
            // query base.
            if ($.isBlank(view._queryBase)) {

              view.getQueryBase(function() {
                initializeTable();
              });
            } else {
              initializeTable();
            }
          },

          /* eslint-disable no-unused-vars */
          // Not sure that this method ever gets called. Keeping the argument
          // in place, however, in case someone else gets a bright idea based on
          // the name 'drillLink'.
          drillDown: function(drillLink) {},
          /* eslint-enable no-unused-vars */

          $dom: function() {
            if (!this._$dom) {
              this._$dom = $(this.currentGrid);
            }
            return this._$dom;
          },

          setView: function(newView) {
            this._view = newView;
            this._model.options({
              view: newView
            });
          },

          isValid: function() {
            return !$.isBlank(this._view);
          }
        }
      }
    );
  })(jQuery);
}
