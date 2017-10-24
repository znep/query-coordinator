if (window.blist.feature_flags.enable_2017_grid_view_refresh) {

  (function($) {

    $.fn.socrataTable = _.get(
      window,
      'blist.Visualizations.Table',
      // Provide a stub as a default so that things don't explode if the Socrata
      // Viz table is somehow not available. This will really only ever get
      // called on a jQuery selection, and doesn't really need to do anything.
      function() {
        if (console && console.error) {
          console.error(
            'The Socrata Visualizations Table could not be instantiated ' +
            'because it is not defined.'
          );
        }
      }
    );

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

    // Static method for generating inline data given a view, rows and some
    // additional dataset/query metadata.
    $.fn.socrataVizDatasetGrid.generateInlineData = function(
      view,
      rows,
      startIndex,
      endIndex,
      totalRowCount
    ) {
      var serializedView = view.cleanCopyIncludingRenderTypeName();
      var columns = _.get(serializedView, 'columns', []);
      var columnsSortedByPosition = _.sortBy(columns, 'position');
      var isNewBackend = _.get(view, 'newBackend', false);
      var rowIdKey = (isNewBackend) ? 'id' : 'uuid';
      var rowIds = rows.map(function(row) {
        return String(_.get(row, ['metadata', rowIdKey], null));
      });
      var transformedRows = rows.map(function(row) {

        return columnsSortedByPosition.map(function(column) {
          var identifier = (isNewBackend) ? column.fieldName : column.id;

          return _.get(row, ['data', identifier], null);
        });
      });

      return {
        columns: columnsSortedByPosition,
        endIndex: endIndex,
        order: null,
        rows: transformedRows,
        rowIds: rowIds,
        rowCount: rows.length,
        totalRowCount: totalRowCount,
        startIndex: startIndex,
        view: serializedView,
        // The CNAME doesn't get serialized when you call .cleanCopy...(), so
        // we need to pull it from the live model instance. We could get the id
        // from the serialized view, but it's conceptually very closely related
        // with the domain in terms of its use, so we'll pull it from the live
        // model instance also.
        domain: view.domainCName,
        datasetUid: view.id
      };
    };

    // Static method for generating a vif from the output of
    // $.fn.socrataVizDatasetGrid.generateInlineData().
    $.fn.socrataVizDatasetGrid.generateVifFromInlineData = function(
      inlineData
    ) {

      var tableColumnWidths = {};
      var rowLabelFromView = _.get(
        inlineData,
        'view.metadata.rowLabel',
        null
      );
      var rowLabelOne = null;
      var rowLabelOther = null;
      var dataSource = _.merge({type: 'socrata.inline'}, inlineData);

      function generateVifOrderFromView() {
        var jsonQuery = _.get(inlineData, 'view.metadata.jsonQuery');
        var vifOrder;

        if (!_.isArray(_.get(jsonQuery, 'order'))) {
          vifOrder = null;
        } else {
          vifOrder = jsonQuery.order.
            map(function(orderParam) {

              return {
                ascending: orderParam.ascending,
                columnName: orderParam.columnFieldName
              };
            });
        }

        return vifOrder;
      }

      inlineData.columns.forEach(function(column) {
        tableColumnWidths[column.fieldName] = column.width;
      });

      if (!_.isEmpty(rowLabelFromView)) {
        rowLabelOne = rowLabelFromView;
        // Wow, this is hacky. $.pluralize() will return something like
        // "2 rows", and we just want what it thinks is the plural form
        // of the unit we passed it. Since we control the quantity (and
        // we know it will be 2) we can just take everything past the
        // "2 " in $.pluralize()'s return value.
        rowLabelOther = $.pluralize(2, rowLabelFromView).substring(2);
      } else {
        rowLabelOne = $.t('core.default_row_label_one');
        rowLabelOther = $.t('core.default_row_label_other');
      }

      return {
        format: {
          type: 'visualization_interchange_format',
          version: 2
        },
        configuration: {
          order: generateVifOrderFromView(),
          tableColumnWidths: tableColumnWidths,
          viewSourceDataLink: false
        },
        description: null,
        series: [
          {
            dataSource: dataSource,
            label: null,
            type: 'table',
            unit: {
              one: rowLabelOne,
              other: rowLabelOther
            }
          }
        ],
        title: null
      };
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
            var PAGE_SIZE = 50; // Number of rows per page.

            var self = this;
            var currentStartIndex;
            var currentEndIndex;
            var currentTotalRowCount;
            var lastRenderedVif;
            var $datasetGrid;
            var flyoutRenderer = new window.blist.Visualizations.views.FlyoutRenderer();

            // If the only thing changing is pagination, you can just call
            // 'loadRowsFromModel(startIndex, endIndex)' instead of resetting
            // all the state and rerendering everything based on the vif.
            function renderTableFromScratch() {

              currentStartIndex = 0;
              currentEndIndex = PAGE_SIZE;
              currentTotalRowCount = 0;
              lastRenderedVif = null;

              loadRowsFromModel(currentStartIndex, currentEndIndex);
            }

            function updateConditionalFormatting() {
              self._view.save();

              var inlineData = _.get(lastRenderedVif, 'series[0].dataSource', null);

              if (!_.isNull(inlineData)) {

                inlineData.view = _.cloneDeep(self._view.cleanCopyIncludingRenderTypeName());

                delete inlineData.type;

                renderInlineData(inlineData);
              }
            }

            function renderInlineData(inlineData) {
              var newVifToRender = $.fn.socrataVizDatasetGrid.
                generateVifFromInlineData(inlineData);
              var renderVifEvent = new window.CustomEvent(
                'SOCRATA_VISUALIZATION_RENDER_VIF',
                {
                  detail: newVifToRender,
                  bubbles: false
                }
              );
              var $socrataVisualization = $datasetGrid.
                children('.socrata-visualization');

              if ($socrataVisualization.length === 0) {
                $datasetGrid.socrataTable(newVifToRender);
              } else {
                $datasetGrid[0].dispatchEvent(renderVifEvent);
              }

              lastRenderedVif = newVifToRender;
            }

            function loadRowsFromModel(startIndex, endIndex) {

              self._model.loadRows(
                startIndex,
                endIndex,
                function(rows) {

                  currentTotalRowCount = _.get(
                    self._view,
                    '_activeRowSet._totalCount',
                    null
                  );

                  renderInlineData(
                    $.fn.socrataVizDatasetGrid.generateInlineData(
                      self._view,
                      rows,
                      startIndex,
                      endIndex,
                      currentTotalRowCount
                    )
                  );
                }
              );
            }

            function getCurrentUserColumns() {
              // Get all columns as JSON objects, not instances. Because we are pulling from
              // blist.dataset, they should be up-to-date with regard to other changes the
              // user has made (e.g. to column order), and since we get the 'fresh' version
              // every time we render the modal, we should not run into metadata drift any
              // worse than we already do on account of the Dataset model being a little
              // iffy.
              return window.blist.dataset.columns.map(function(column) {
                var cleanColumn = column.cleanCopy();
                // The 'noCommas' and 'precision' properties, when present, have values that
                // are essentially booleans and numbers but represented as strings (ugh),
                // so in order to simplify the code that actually deals with these things
                // above we do those conversions here in a 'pre-processing' step. We'll
                // also have to convert these values, if present, back into strings in a
                // 'post-processing' step before we PUT to `/api/views/<viewUid>`.
                if (cleanColumn.format.hasOwnProperty('noCommas')) {
                  cleanColumn.format.noCommas = (cleanColumn.format.noCommas === 'true') ?
                    true :
                    false;
                }

                if (cleanColumn.format.hasOwnProperty('precision')) {
                  cleanColumn.format.precision = parseInt(cleanColumn.format.precision, 10);
                }

                return cleanColumn;
              // Remove system columns (which have an id of -1)
              }).filter(function(column) {
                return column.id >= 0;
              // Sort by position
              }).sort(function(a, b) {
                var aPosition = _.get(a, 'position', -1);
                var bPosition = _.get(b, 'position', -1);

                return (aPosition <= bPosition) ? -1 : 1;
              });
            }

            function attachTableEventHandlers() {

              function updateViewWithColumnWidthsFromVif(tableColumnWidths) {
                // EN-17878 - Changing Column Widths Should Not Force a Derived View
                //
                // Actually, we're moving toward making all changes require a
                // working copy until we can provide a more unified editing
                // experience. So we're no longer responding to column width changes
                // *at all* if it's not a working copy, and if it is, we just update
                // it since we're already editing things.
                var isWorkingCopy = self._view.publicationStage === 'unpublished';

                if (isWorkingCopy) {

                  var newView = _.cloneDeep(self._view.cleanCopy());
                  newView.columns.forEach(function(column) {

                    if (tableColumnWidths.hasOwnProperty(column.fieldName)) {

                      column.width = tableColumnWidths[column.fieldName];
                    }
                  });

                  self._view.update(newView, false, false);
                  self._view.save();
                }
              }

              $datasetGrid.
                on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(e) {
                  var updatedVif = e.originalEvent.detail;
                  var lastRenderedTableColumnWidths = _.get(
                    lastRenderedVif,
                    'configuration.tableColumnWidths',
                    null
                  );
                  var updatedTableColumnWidths = _.get(
                    updatedVif,
                    'configuration.tableColumnWidths',
                    null
                  );
                  var tableColumnWidthsEqual = _.isEqual(
                    lastRenderedTableColumnWidths,
                    updatedTableColumnWidths
                  );

                  if (!tableColumnWidthsEqual) {
                    updateViewWithColumnWidthsFromVif(updatedTableColumnWidths);
                  }
                });

              $datasetGrid.
                on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', function(e) {
                  var columnName = e.originalEvent.detail;
                  var existingOrder = _.cloneDeep(
                    _.get(self._view, 'metadata.jsonQuery.order', [])
                  );
                  var newOrder;
                  var newMetadata = $.extend(true, {}, self._view.metadata);

                  if (
                    existingOrder.length === 1 &&
                    (existingOrder[0].columnFieldName === columnName)
                  ) {

                    newOrder = [{
                      columnFieldName: columnName,
                      ascending: !existingOrder[0].ascending
                    }];
                  } else {

                    newOrder = [{
                      columnFieldName: columnName,
                      ascending: true
                    }];
                  }

                  _.set(newMetadata, 'jsonQuery.order', newOrder);

                  self._view.update(
                    {
                      metadata: newMetadata
                    },
                    false,
                    true
                  );
                });

              $datasetGrid.
                on('SOCRATA_VISUALIZATION_ROW_DOUBLE_CLICKED', function(e) {
                  var isWorkingCopy = self._view.publicationStage === 'unpublished';

                  if (isWorkingCopy) {
                    var payload = e.originalEvent.detail;
                    var rowEditorOptions = {
                      viewId: window.blist.dataset.id,
                      columns: payload.columns,
                      row: {
                        id: payload.row.id,
                        data: payload.row.data
                      }
                    };

                    window.blist.gridViewRowEditor(rowEditorOptions);
                  }
                });

              $datasetGrid.
                on('SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', function(e) {
                  var newOrder = [{
                    columnFieldName: e.originalEvent.detail.columnName,
                    ascending: e.originalEvent.detail.ascending
                  }];
                  var newMetadata = $.extend(true, {}, self._view.metadata);

                  _.set(newMetadata, 'jsonQuery.order', newOrder);

                  self._view.update(
                    {
                      metadata: newMetadata
                    },
                    false,
                    true
                  );
                });

              // The table will not emit events that will take us outsize the
              // [0, totalRowCount] interval, so we can be very naive here about
              // how we respond to the ...PAGINATION_PREVIOUS and
              // ...PAGINATION_NEXT events.
              $datasetGrid.
                on('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', function() {

                  currentStartIndex -= PAGE_SIZE;
                  currentEndIndex -= PAGE_SIZE;

                  loadRowsFromModel(currentStartIndex, currentEndIndex);
                });

              // See comment above handler for the ...PAGINATION_PREVIOUS event.
              $datasetGrid.
                on('SOCRATA_VISUALIZATION_PAGINATION_NEXT', function() {

                  currentStartIndex += PAGE_SIZE;
                  currentEndIndex += PAGE_SIZE;

                  loadRowsFromModel(currentStartIndex, currentEndIndex);
                });

              $datasetGrid.on('SOCRATA_VISUALIZATION_FLYOUT', function(e) {

                  if (e.originalEvent.detail) {
                    flyoutRenderer.render(e.originalEvent.detail);
                  } else {
                    flyoutRenderer.clear();
                  }
                });

              $('#gridSidebar_outer_edit a.editColumn').live('click', function() {
                var columnEditorOptions = {
                  columns: getCurrentUserColumns()
                };

                window.blist.gridViewColumnEditor(columnEditorOptions);
              });

              $('#gridSidebar_outer_edit a.addRow').live('click', function() {
                  var rowEditorOptions = {
                    viewId: window.blist.dataset.id,
                    columns: getCurrentUserColumns(),
                    row: {
                      id: null,
                      data: null
                    }
                  };

                  window.blist.gridViewRowEditor(rowEditorOptions);
              });
            }

            /**
             * Execution starts here!
             */

            self.setView(this.settings.view);
            // Override the NBE bucket size because we are now using a paginated
            // table rather than requesting 1000 rows at a time in order to make
            // the infini-scrolling table somewhat responsive.
            self._view.bucketSize = PAGE_SIZE;
            self._view.bind('query_change', renderTableFromScratch);
            self._view.bind('columns_changed', renderTableFromScratch);
            self._view.bind('conditionalformatting_change', updateConditionalFormatting);

            $datasetGrid = self.$dom();
            $datasetGrid.data('datasetGrid', self);

            renderTableFromScratch();
            attachTableEventHandlers();
          },

          /* eslint-disable no-unused-vars */
          // Not sure that this method ever gets called. Keeping the argument in
          // place, however, in case someone else gets a bright idea based on the
          // name 'drillLink'.
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

            if (!this._model) {
              this._model = $().blistModel();
            }

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
