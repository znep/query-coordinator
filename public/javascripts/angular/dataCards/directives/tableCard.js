(function() {
  'use strict';

  var rowsPerBlock = 50;
  var rowHeight = $.relativeToPx('2rem');

  function tableCard(
    Constants,
    Dataset,
    SoqlHelpers,
    $q,
    $timeout,
    $window,
    DataTypeFormatService,
    I18n,
    PluralizeService
  ) {
    return {
      restrict: 'E',
      scope: {
        model: '=',
        whereClause: '=',
        isEmbedded: '=?',
        firstColumn: '=?'
      },
      controller: 'TableCardController',
      templateUrl: '/angular_templates/dataCards/tableCard.html',
      link: function(scope, element) {
        var columnDetails$ = scope.$observe('columnDetails');
        var whereClause$ = scope.$observe('whereClause');
        var rowCount$ = scope.$observe('rowCount');
        var filteredRowCount$ = scope.$observe('filteredRowCount');
        var tableScroll$;
        var tableMouseScroll$;
        var tableMousemove$;

        // ಠ_ಠ
        // The functions comprising the Table directive have very complex interdependencies that
        // exhibit many (possibly undiscovered) order sensitivities.
        // To wallpaper over endemic bugs caused by this state of affairs, we delay the entire
        // setup of the table until an empirically-determined-to-work set of scope properties
        // are considered "ready".
        //
        // This directive is expected to be rewritten or at least refactored soon.
        // Dating for the eventual lulz: 2/12/2015
        Rx.Observable.combineLatest(
          whereClause$.filter(_.isDefined),
          rowCount$.filter(_.isNumber),
          filteredRowCount$.filter(_.isNumber),
          columnDetails$.filter(_.isPresent),
          _.identity
        ).take(1).
          subscribe(setupTable);

        function setupTable() {
          var subscriptions = [];
          // A unique jQuery namespace, specific to one table instance.
          var instanceUniqueNamespace = 'table.instance{0}'.format(scope.$id);

          var currentBlocks = [];
          var sortColumnId = '';
          var sortOrdering = '';
          var columnWidths = {};
          var httpRequests = {};
          var oldBlock = -1;
          var $table = element.children('.table-inner');
          var $tableHead = element.find('.table-inner > .table-head');
          var $tableBody = element.find('.table-inner > .table-body');
          var $expander = element.find('.table-expander');

          var getColumn = function(fieldName) {
            return _.find(scope.columnDetails, function(column) {
              return column.fieldName === fieldName;
            });
          };

          scope.$watch('showCount', function(newVal) {
            if (_.isUndefined(newVal)) {
              scope.showCount = true;
            }
          });

          $('body').on('click.{0}'.format(instanceUniqueNamespace), '.flyout .caret', function(e) {
            if ($(e.currentTarget).parent().data('table-id') !== instanceUniqueNamespace) {
              return; // The flyout might not be our own!
            }
            scope.$safeApply(function() {
              var columnId = $(e.currentTarget).parent().data('column-id');

              sortOnColumn(columnId);
            });
          });

          scope.$destroyAsObservable(element).subscribe(function() {
            $('body').off('.{0}'.format(instanceUniqueNamespace));
          });

          var renderTable = function(dimensions) {
            var tableHeight = dimensions.height - element.position().top;

            element.height(tableHeight);
            $tableBody.height(tableHeight - $tableHead.height() - (scope.showCount ? rowHeight : 0));
            $tableHead.find('.resize').height(tableHeight);

            checkBlocks();
            updateLabel();
          };

          var setSort = function(newSortColumn, newSortOrdering) {
            sortColumnId = newSortColumn;
            sortOrdering = newSortOrdering;
          };

          var getFormattedSort = function() {
            return (_.isPresent(sortColumnId) && _.isPresent(sortOrdering)) ?
              '{0} {1}, :id'.format(SoqlHelpers.formatFieldName(sortColumnId), sortOrdering) :
              ':id';
          };

          var shouldApplyDefaultSort = function() {
            return _.isPresent(scope.defaultSortColumnName) &&
              _.isEmpty(sortColumnId) &&
              _.isEmpty(sortOrdering);
          };

          // Given a column detail object, returns
          // this column's default sort (represented
          // by the strings 'DESC' and 'ASC').
          function defaultSortOrderForColumn(column) {
            if (column) {
              switch (column.physicalDatatype) {
                case 'number':
                case 'timestamp':
                case 'floating_timestamp':
                  return 'DESC';
              }
            }
            return 'ASC';
          }

          // Given a column ID, computes what sort order
          // should be applied when the user next indicates
          // that the column should be sorted (say, by clicking
          // on the header).
          // Broadly, this either reverses the current sort
          // if the column is already sorted, or applies a
          // default sort based upon the column's type.
          var getNextSortForColumn = function(columnId) {
            var newOrdering;

            if (isSortedOnColumn(columnId)) {
              newOrdering = sortOrdering === 'DESC' ? 'ASC' : 'DESC';
            } else {
              var column = getColumn(columnId);

              newOrdering = defaultSortOrderForColumn(column);
            }

            return newOrdering;
          };

          // Given a column ID, computes what sort order
          // is currently applied to that column. If no
          // sort is applied, returns the default sort
          // for that column.
          var getCurrentOrDefaultSortForColumn = function(columnId) {
            if (isSortedOnColumn(columnId)) {
              return sortOrdering;
            } else {
              return getNextSortForColumn(columnId);
            }
          };

          // Apply a sort on the column corresponding to the given columnId.
          var sortOnColumn = function(columnId) {

            var unsortableTypes = Constants.TABLE_UNSORTABLE_PHYSICAL_DATATYPES;
            if (_.contains(unsortableTypes, getColumn(columnId).physicalDatatype)) {
              return;
            }

            var newOrdering = getNextSortForColumn(columnId);

            setSort(columnId, newOrdering);
            updateColumnHeaders();
            reloadRows();
          };

          scope.sortOnColumn = function($event, columnId) {
            if (!$($event.target).hasClass('resize')) {
              sortOnColumn(columnId);
            }
          };

          // Returns true if we're currently sorting
          // on the given column.
          var isSortedOnColumn = function(columnId) {
            return sortColumnId === columnId;
          };

          var columnDrag = false;

          var dragHandles = function() {
            var columnIndex;
            var columnId;
            var currentX = 0;
            var $resizeContainer = $expander.find('.table-resize-container');

            columnDrag = false;

            if ($resizeContainer.length === 0) {
              $resizeContainer = $('<div class="table-resize-container table-row"></div>');
              $expander.prepend($resizeContainer);
            }

            if ($resizeContainer.children().length > 0) {
              return;
            }

            _.each(columnWidths, function(width, columnName) {
              var $cell = $('<div class="cell"><span class="resize"></span></div>').width(width);

              $cell.data('columnId', columnName);
              $resizeContainer.append($cell);
            });

            element.on('mousedown', '.table-head .resize, .table-resize-container .resize', function(e) {
              var $parent = $(this).parent();
              currentX = e.pageX;
              columnIndex = $parent.index();
              columnId = $parent.data('columnId');
              columnDrag = true;
              e.preventDefault();
            });

            $('body').on('mousemove.{0}'.format(instanceUniqueNamespace), function(e) {
              if (columnDrag) {
                var $cells = $table.find('.cell:nth-child({0}), .th:nth-child({0})'.format(columnIndex + 1));
                var newWidth = $cells.width() + e.pageX - currentX;

                $cells.width(newWidth);
                columnWidths[columnId] = newWidth;
                currentX = e.pageX;
                e.preventDefault();
              }
            }).on('mouseup.{0}'.format(instanceUniqueNamespace), function() {
              columnDrag = false;
            });
          };

          var ensureColumnHeaders = function() {
            if (!scope.headers) {
              updateColumnHeaders();
            }
          };

          var updateColumnHeaders = function() {
            scope.headers = _.map(scope.columnDetails, function(column, i) {
              // Symbols: ▼ ▲
              var ordering = getCurrentOrDefaultSortForColumn(column.fieldName);

              return {
                index: i,
                columnId: column.fieldName,
                name: Dataset.extractHumanReadableColumnName(column),
                active: isSortedOnColumn(column.fieldName),
                sortUp: ordering === 'ASC',
                width: columnWidths[column.fieldName],
                sortable: column.sortable
              };
            });

            // Update flyout if present
            var columnId = $('.flyout').data('column-id');

            if (_.isPresent(columnId)) {
              $tableHead.find('.th:contains({0})'.format(getColumn(columnId).title)).mouseenter();
            }
          };

          var calculateColumnWidths = _.once(function() {
            updateColumnHeaders();
            _.defer(function() {
              columnWidths = {};
              var maxCells = {};
              var cells = $expander.
                // row_block.row.cell
                children().children().children();
              cells = cells.add($tableHead.children());
              var columns = scope.columnDetails;

              // Find the widest cell in each column
              cells.each(function(i, cell) {
                var jqueryCell = $(cell);
                var cellIndex = jqueryCell.data('index');

                // TODO: This could probably be fixed, either by not having a separate tableHeader directive,
                // TODO: or some sort of Angular directive priority black magic
                // This resolves an issue where the index on table header cells doesn't exist
                // We can still find the index with jquery.index()
                if (_.isUndefined(cellIndex)) {
                  cellIndex = jqueryCell.index();
                }
                var colName = columns[cellIndex].fieldName;
                var width = cell.clientWidth;
                if (!columnWidths[colName] || columnWidths[colName] < width) {
                  maxCells[colName] = cell;
                  columnWidths[colName] = width;
                }
              });

              // Get the jquery width of the widest elements
              _.each(columnWidths, function(v, k) {
                var width = parseInt($window.getComputedStyle(maxCells[k]).width, 10);
                // Apply a min/max
                if (width > 300) {
                  columnWidths[k] = 300;
                } else if (width < 75) {
                  columnWidths[k] = 75;
                } else {
                  // text-overflow: ellipsis starts ellipsifying things when the widths are equal, which
                  // makes it hard to detect (in that case) if we should display a flyout or not (since
                  // scrollWidth == clientWidth both for too-short text as well as just-ellipsified
                  // text).  So - offset by one, to at least make that situation less common.
                  columnWidths[k] = width + 1;
                }
              });

              // Now set each cell to the maximum cell width for its column
              cells.each(function(i, cell) {
                var jqueryCell = $(cell);
                var colName = columns[jqueryCell.index()].fieldName;
                // Setting the style.width is a lot faster than jquery.width()
                cell.style.width = columnWidths[colName] + 'px';
              });

              updateColumnHeaders();
              dragHandles();
            });
          });

          var updateExpanderHeight = function() {
            var lastLoadedBlock = _.max(element.find('.row-block'), function(block) {
              return $(block).data().blockId;
            });
            var height = 0;

            if (_.isElement(lastLoadedBlock)) {
              var $lastLoadedBlock = $(lastLoadedBlock);
              var lastHeight = $lastLoadedBlock.height() || 0;

              height = rowHeight * $lastLoadedBlock.data().blockId * rowsPerBlock + lastHeight;
            }

            $expander.height(height);
          };

          var loadBlockOfRows = function(block) {
            // Check if is being loaded or block exists
            if (_.has(httpRequests, block) || element.find('.row-block.' + block).length > 0) {
              return;
            }
            var canceler = $q.defer();

            httpRequests[block] = canceler;

            scope.getRows(block * rowsPerBlock, rowsPerBlock, getFormattedSort(), canceler, scope.whereClause).then(function(data) {
              delete httpRequests[block];
              ensureColumnHeaders();

              scope.$emit('rows:loaded', block * rowsPerBlock);

              if (currentBlocks.indexOf(block) === -1 || data.length === 0) {
                return;
              }

              function formatCellText(cellType, cellContent, column) {
                var cellText;

                switch (cellType) {
                  case 'boolean':
                    cellText = _.escape(DataTypeFormatService.renderBooleanCell(cellContent, column));
                    break;
                  case 'number':
                    cellText = _.escape(DataTypeFormatService.renderNumberCell(cellContent, column));
                    break;

                  // Avoid escaping because cell content is HTML.
                  case 'geo_entity':
                  case 'point':
                    cellText = DataTypeFormatService.renderGeoCellHTML(cellContent, column);
                    break;
                  case 'timestamp':
                  case 'floating_timestamp':
                    cellText = _.escape(DataTypeFormatService.renderTimestampCell(cellContent, column));
                    break;
                  case 'money':
                    cellText = _.escape(DataTypeFormatService.renderMoneyCell(cellContent, column));
                    break;
                  default:
                    cellText = _.escape(cellContent);
                    break;
                }
                return cellText;
              }

              var columns = scope.columnDetails;
              var blockDiv = $('<div>').
                addClass('row-block {0}'.format(block)).
                css({
                  top: '{0}px'.format(block * rowsPerBlock * rowHeight),
                  display: 'none'
                }).
                attr('data-block-id', block);

              _.each(data, function(dataRow) {
                var tableRowDiv = $('<div>').addClass('table-row');

                _.each(columns, function(column, index) {
                  var cellContent = _.hasValue(dataRow[column.fieldName]) ?
                    dataRow[column.fieldName] : '';

                  var tableCellDiv = $('<div>').
                    addClass('cell {0}'.format(column.physicalDatatype)).
                    attr('data-index', index).
                    css('width', '{0}px'.format(columnWidths[column.fieldName]));

                  // CORE-7118: Place cell content inside a second div,
                  // improves ability to double-click select the cell text
                  var tableCellDivContent = $('<div class="cell-content">').
                    html(formatCellText(
                      column.physicalDatatype,
                      cellContent,
                      column
                    ));

                  tableCellDiv.append(tableCellDivContent);
                  tableRowDiv.append(tableCellDiv);
                });

                blockDiv.append(tableRowDiv);
              });

              $(blockDiv).appendTo($expander).fadeIn();

              calculateColumnWidths();
              _.defer(updateExpanderHeight);
            });
          };

          var moveHeader = function() {
            $tableHead.css('left', -$tableBody.scrollLeft());
          };

          var checkBlocks = function() {
            var currentBlock = Math.floor($tableBody.scrollTop() / (rowHeight * rowsPerBlock));
            // Short circuit
            if (currentBlock === oldBlock) {
              return;
            }
            oldBlock = currentBlock;

            var blocksToLoad = _.map([-1, 0, 1, 2], function(i) {
              return i + currentBlock;
            });

            _.each(currentBlocks, function(blockId) {
              if (!_.contains(blocksToLoad, blockId)) {
                $expander.find('.row-block.' + blockId).remove();
                // Cancel HTTP request if in progress.
                if (httpRequests[blockId]) {
                  httpRequests[blockId].resolve();
                  delete httpRequests[blockId];
                }
              }
            });

            currentBlocks = blocksToLoad;
            _.each(blocksToLoad, function(blockId) {
              if (blockId >= 0) {
                loadBlockOfRows(blockId);
              }
            });
            updateExpanderHeight();
          };

          var updateLabel = function() {
            var bottomRow = Math.min(
              Math.floor(($tableBody.scrollTop() + $tableBody.height()) / rowHeight),
              scope.filteredRowCount
            );
            var topRow = Math.min(
              Math.floor($tableBody.scrollTop() / rowHeight) + 1,
              bottomRow
            );

            scope.$safeApply(function() {

              if (scope.filteredRowCount <= 1) {
                scope.tableLabel = I18n.t('table.nonRangeLabel',
                  _.escape(_.capitalize(scope.rowDisplayUnit)),
                  $window.socrata.utils.commaify(topRow),
                  $window.socrata.utils.commaify(scope.filteredRowCount)
                );
              } else {
                var rowDisplayUnit = PluralizeService.pluralize(scope.rowDisplayUnit);
                scope.tableLabel = I18n.t('table.rangeLabel',
                  _.escape(_.capitalize(rowDisplayUnit)),
                  $window.socrata.utils.commaify(topRow),
                  $window.socrata.utils.commaify(bottomRow),
                  $window.socrata.utils.commaify(scope.filteredRowCount)
                );
              }
            });
          };

          var reloadRows = function() {
            $expander.find('.row-block').remove();
            currentBlocks = [];
            oldBlock = -1;
            checkBlocks();
          };

          var showOrHideNoRowMessage = function() {
            element.toggleClass('has-rows', scope.filteredRowCount !== 0);
          };

          var disableScrollingOnMousemove$;
          var disableScrollingOnMouseScroll$;
          var prevClientX;
          var prevClientY;

          tableMousemove$ = Rx.Observable.fromEvent($tableBody, 'mousemove');
          tableMouseScroll$ = Rx.Observable.fromEvent($tableBody, Constants.MOUSE_WHEEL_EVENTS);
          tableScroll$ = Rx.Observable.fromEvent($tableBody, 'scroll');

          // Returns false if we are moving the mouse and should not disable
          // scrolling.  We are moving the mouse if our clientX, clientY have changed.
          disableScrollingOnMousemove$ = tableMousemove$.
            filter(function(e) {
              return prevClientX !== (prevClientX = e.clientX) &&
                prevClientY !== (prevClientY = e.clientY);
            }).
            map(function() {
              return false;
            });

          // Returns true if we are scrolling down and not on the bottom, and thus
          // should disable scrolling.  Otherwise, false.
          disableScrollingOnMouseScroll$ = tableMouseScroll$.
            map(function(e) {
              var jqueryWindow = $($window);
              var scrollingDown = e.originalEvent.wheelDelta < 0 || e.originalEvent.detail > 0;
              var scrollBottom = jqueryWindow.scrollTop() + jqueryWindow.height();

              // CORE-6419: Use a fuzzy test because window scrollTop can be a float.
              var onBottom = Math.abs(scrollBottom - $($window.document).height()) <= 1;

              return scrollingDown && !onBottom;
            }).

            // Filter out expanded cards.
            filter(function() {
              return $table.closest('.expanded').length === 0;
            });

          // Merge these observables and toggle a class that sets `overflow: hidden`
          // depending on whether or not we should disable scrolling.
          Rx.Observable.merge(
            disableScrollingOnMousemove$,
            disableScrollingOnMouseScroll$
          ).
          distinctUntilChanged().
          subscribe(function(shouldDisableScrolling) {
            $tableBody.toggleClass('vertically-hidden', shouldDisableScrolling);
          });

          // When the table is scrolled, update its content.
          tableScroll$.
            subscribe(function() {
              scope.$safeApply(function() {
                moveHeader();
                checkBlocks();
                updateLabel();
              });
            });

          $tableBody.flyout({
            selector: '.row-block .cell',
            interact: true,
            style: 'table',
            direction: 'horizontal',
            parent: $window.document.body,

            html: function($target) {
              if ($target[0].clientWidth < $target[0].scrollWidth) {
                return _.escape($target.text());
              }
            }
          });

          $tableHead.flyout({
            selector: '.th',
            direction: 'top',
            style: 'table',
            parent: $window.document.body,
            interact: true,

            title: function($target) {
              var title = _.escape($target.text());
              var index = $target.data('index');
              var description = _.escape(_.get(scope.columnDetails, index + '.description'));
              if (_.isDefined(description)) {
                return '<div class="title">{0}</div><div class="description">{1}</div>'.format(
                  title,
                  description
                );
              }
              return title;
            },

            html: function($target, $tableHeadElement, options, $element) {
              var columnId = $target.data('columnId');
              var column = getColumn(columnId);
              var sortUp = sortOrdering === 'ASC';
              var html = [];
              var ascendingString = I18n.table.ascending;
              var descendingString = I18n.table.descending;

              switch (column.physicalDatatype) {
                case 'number':
                  ascendingString = I18n.table.smallestFirst;
                  descendingString = I18n.table.largestFirst;
                  break;

                case 'text':
                  ascendingString = I18n.table.aToZ;
                  descendingString = I18n.table.zToA;
                  break;

                case 'timestamp':
                case 'floating_timestamp':
                  ascendingString = I18n.table.oldestFirst;
                  descendingString = I18n.table.newestFirst;
                  break;
              }

              $element.data('table-id', instanceUniqueNamespace);
              $element.data('column-id', columnId);

              if (column.sortable) {
                if (isSortedOnColumn(columnId)) {
                  html.push(I18n.t('table.sorted', sortUp ? ascendingString : descendingString));
                }
                var wouldSortUp = getNextSortForColumn(columnId) === 'ASC';

                html.push('<a class="caret" href="#">{0}</a>'.
                  format(I18n.t('table.sort', wouldSortUp ? ascendingString : descendingString)));
                return html.join('<br>');
              } else {
                return I18n.t('table.noSort');
              }
            },
            onBeforeRender: function(target) {
              return !$(target).hasClass('resize') && !columnDrag;
            }
          });

          subscriptions.push(Rx.Observable.subscribeLatest(
            element.offsetParent().observeDimensions(),
            rowCount$,
            filteredRowCount$,
            columnDetails$,
            function(cardDimensions, rowCount, filteredRowCount) {

              scope.$emit('render:start', {
                source: 'table_{0}'.format(scope.$id),
                timestamp: _.now()
              });
              scope.$emit('rows:info', {
                hasRows: filteredRowCount !== 0,
                rowCount: rowCount,
                filteredRowCount: filteredRowCount
              });
              updateExpanderHeight();
              showOrHideNoRowMessage();

              // Make sure rowCount is a number (ie not undefined)
              if (rowCount >= 0) {

                // Apply a default sort if needed.
                if (shouldApplyDefaultSort()) {
                  sortOnColumn(scope.defaultSortColumnName);
                }

                renderTable(cardDimensions);
              }

              // Yield execution to the browser to render, then notify that render is complete
              $timeout(function() {
                scope.$emit('render:complete', {
                  source: 'table_{0}'.format(scope.$id),
                  timestamp: _.now()
                });
              }, 0, false);
            }
          ));

          subscriptions.push(whereClause$.subscribe(function() {
            if (scope.getRows) {
              reloadRows();
            }
          }));

          scope.$destroyAsObservable(element).subscribe(function() {
            _.invoke(subscriptions, 'dispose');
          });
        }
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('tableCard', tableCard);
})();
