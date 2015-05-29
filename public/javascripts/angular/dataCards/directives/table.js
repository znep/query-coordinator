(function() {
  'use strict';

  var rowsPerBlock = 50;
  var rowHeight = $.relativeToPx('2rem');

  function tableDirectiveFactory(Constants, Dataset, SoqlHelpers, $q, $timeout) {

    return {
      templateUrl: '/angular_templates/dataCards/table.html',
      restrict: 'A',

      scope: {
        showCount: '=?',
        rowCount: '=',
        filteredRowCount: '=',
        whereClause: '=',
        getRows: '=',
        infinite: '=',
        columnDetails: '=',
        rowDisplayUnit: '=',
        defaultSortColumnName: '='    // When the table is first created, it will be sorted on this column.
      },

      link: function(scope, element, attrs) {
        // CORE-4645: Omit some columns from display.
        scope.$bindObservable(
          'filteredColumnDetails',
          scope.$observe('columnDetails').
            filter(_.isPresent).
            map(function(columnDetails) {
              return _.filter(columnDetails, function(column) {
                return !(column.isSubcolumn && column.cardinality <= 1);
              });
            }));

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
          scope.$observe('whereClause').filter(_.isDefined),
          scope.$observe('rowCount').filter(_.isNumber),
          scope.$observe('filteredRowCount').filter(_.isNumber),
          scope.$observe('filteredColumnDetails').filter(_.isPresent),
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
          var $head = element.find('.table-inner > .table-head');
          var $body = element.find('.table-inner > .table-body');
          var $expander = element.find('.table-expander');
          var $label = element.find('.table-label');

          var getColumn = function(fieldName) {
            return _.find(scope.filteredColumnDetails, function(column) {
              return column.fieldName === fieldName;
            });
          };

          scope.$watch('showCount', function(newVal, oldVal, scope) {
            if (!angular.isDefined(newVal)) {
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

          var renderTable = function(element, dimensions, rowCount) {
            var tableHeight = dimensions.height - element.position().top;

            element.height(tableHeight);
            $body.height(tableHeight - $head.height() - (scope.showCount ? rowHeight : 0));
            $head.find('.resize').height(tableHeight);

            checkBlocks();
            updateLabel();
          };

          var setSort = function(newSortColumn, newSortOrdering) {
            sortColumnId = newSortColumn;
            sortOrdering = newSortOrdering;
          };

          var getFormattedSort = function() {
            return (_.isPresent(sortColumnId) && _.isPresent(sortOrdering)) ?
              '{0} {1}'.format(SoqlHelpers.formatFieldName(sortColumnId), sortOrdering) :
              '';
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
            if ($($event.target).hasClass('resize')) return;
            sortOnColumn(columnId);
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

            _.each(columnWidths, function(width, columnId) {
              var $cell = $('<div class="cell"><span class="resize"></span></div>').width(width);

              $cell.find('.resize').data('columnId', columnId);
              $resizeContainer.append($cell);
            });

            element.on('mousedown', '.table-head .resize, .table-resize-container .resize', function(e) {
              currentX = e.pageX;
              columnIndex = $(this).parent().index();
              columnId = $(this).data('columnId');
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
            }).on('mouseup.{0}'.format(instanceUniqueNamespace), function(e) {
              columnDrag = false;
            });
          };

          var ensureColumnHeaders = function() {
            if (!scope.headers) {
              updateColumnHeaders();
            }
          };

          var updateColumnHeaders = function() {
            scope.headers = _.map(scope.filteredColumnDetails, function(column, i) {
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
            var columnId = $(".flyout").data('column-id');

            if (_.isPresent(columnId)) {
              $head.find('.th:contains({0})'.format(getColumn(columnId).title)).mouseenter();
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
              cells = cells.add($head.children());
              var columns = scope.filteredColumnDetails;

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
                var width = parseInt(window.getComputedStyle(maxCells[k]).width, 10);
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
            if (scope.infinite) {
              $expander.height(rowHeight * filteredRowCount);
            } else {
              var lastLoadedBlock = _.max(element.find(".row-block"), function(block) {
                return $(block).data().blockId;
              });
              var height = 0;

              if (_.isElement(lastLoadedBlock)) {
                var $lastLoadedBlock = $(lastLoadedBlock);
                var lastHeight = $lastLoadedBlock.height() || 0;

                height = rowHeight * $lastLoadedBlock.data().blockId * rowsPerBlock + lastHeight;
              }

              $expander.height(height);
            }
          };

          var loadBlockOfRows = function(block) {
            // Check if is being loaded or block exists
            if (_.has(httpRequests, block) || element.find(".row-block." + block).length > 0) {
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

              var columns = scope.filteredColumnDetails;
              var blockHtml = '<div class="row-block ' + block +
                '" data-block-id="' + block + '" style="top: ' + (block * rowsPerBlock * rowHeight) +
                'px; display: none">';

              _.each(data, function(data_row) {
                blockHtml += '<div class="table-row">';

                _.each(columns, function(column, index) {
                  var cellContent = _.isUndefined(data_row[column.fieldName]) ? '' : data_row[column.fieldName];
                  var cellText = '';
                  var cellType = column.physicalDatatype;
                  var cellClasses = 'cell ' + cellType;

                  // Is Boolean?
                  if (cellType === 'boolean') {
                    if (_.isBoolean(cellContent)) {
                      cellText = cellContent ? '✓' : '';
                    }

                  } else if (cellType === 'number') {
                    // CORE-4533: Preserve behavior of old UX - truncate precision
                    if (cellContent && !_.isNumber(cellContent)) {
                      var number = parseFloat(cellContent);
                      // Just in case, default to the given cell content if parsing fails
                      if (!_.isNaN(number)) {
                        cellContent = number.toString();
                      }
                    }

                    // TODO: Remove this. This is just to satisfy Clint's pet peeve about years.
                    if (cellContent.length >= 5) {
                      cellText = _.escape($.commaify(cellContent));
                    } else {
                      cellText = _.escape(cellContent);
                    }

                  } else if (cellType === 'geo_entity' || cellType === 'point') {
                    var latitudeCoordinateIndex = 1;
                    var longitudeCoordinateIndex = 0;
                    if (_.isArray(cellContent.coordinates)) {
                      cellText = '(<span title="Latitude">' +
                      cellContent.coordinates[latitudeCoordinateIndex] +
                      '°</span>, <span title="Longitude">' +
                      cellContent.coordinates[longitudeCoordinateIndex] +
                      '°</span>)';
                    }

                  } else if (cellType === 'timestamp' || cellType === 'floating_timestamp') {
                    // Don't instantiate moment at all if we can avoid it.
                    if (_.isPresent(cellContent)) {
                      var time = moment(cellContent);

                      // We still need to check if the date is valid even if cellContent is not empty.
                      if (time.isValid()) {
                        // Check if Date or Date/Time
                        if (time.hour() + time.minute() + time.second() + time.millisecond() === 0) {
                          cellText = time.format('YYYY MMM D');
                        } else {
                          cellText = time.format('YYYY MMM DD HH:mm:ss');
                        }
                      }
                    }
                  } else if (cellType === 'money') {
                    // TODO: use accountingjs to support non-US formats
                    var dollarAmount = parseFloat(cellContent);
                    if (_.isFinite(dollarAmount)) {
                      var isNegativeAmount = dollarAmount < 0;
                      cellText = Math.abs(Math.round(dollarAmount * 100)).toString(); // positive cents
                      cellText = ('00' + cellText).slice(Math.min(-cellText.length, -3)); // pad zeroes
                      cellText = cellText.replace(/(\d+)(\d{2})$/, '$1.$2'); // "divide" to get dollars
                      cellText = (isNegativeAmount ? '-' : '') + '$' + $.commaify(cellText); // finish!
                    }

                    // Fallback to escaped content if invalid amount
                    cellText = cellText || _.escape(cellContent);
                  } else {
                    cellText = _.escape(cellContent);
                  }

                  blockHtml += '<div class="' + cellClasses +
                  '" data-index="' + index +
                  '" style="width: ' + columnWidths[column.fieldName] +
                  'px">' + cellText + '</div>';
                });
                blockHtml += '</div>';
              });
              blockHtml += '</div>';

              $(blockHtml).appendTo($expander).
                fadeIn();
              calculateColumnWidths();
              _.defer(updateExpanderHeight);
            });
          };

          var moveHeader = function() {
            $head.css('left', -$body.scrollLeft());
          };

          var checkBlocks = function() {
            var currentBlock = Math.floor($body.scrollTop() / (rowHeight * rowsPerBlock));
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
                $expander.find(".row-block." + blockId).remove();
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
              Math.floor(($body.scrollTop() + $body.height()) / rowHeight),
              scope.filteredRowCount
            );
            var topRow = Math.min(
              Math.floor($body.scrollTop() / rowHeight) + 1,
              bottomRow
            );

            scope.$safeApply(function() {
              scope.tableLabel = '{0} <strong>{1}-{2} out of {3}</strong>'.format(
                $.htmlEncode(scope.rowDisplayUnit.capitalize()),
                $.commaify(topRow),
                $.commaify(bottomRow),
                $.commaify(scope.filteredRowCount)
              );
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

          var scrollLeft = $body.scrollLeft(), scrollTop = $body.scrollTop();

          $body.scroll(function(e) {
            scope.$safeApply(function() {
              if (scrollLeft !== (scrollLeft = $body.scrollLeft())) {
                moveHeader();
              }
              if (scrollTop !== (scrollTop = $body.scrollTop())) {
                checkBlocks();
                updateLabel();
              }
            });
          });

          $body.flyout({
            selector: '.row-block .cell',
            interact: true,
            style: 'table',
            direction: 'horizontal',

            html: function($target, $head, options) {
              if ($target[0].clientWidth < $target[0].scrollWidth) {
                return _.escape($target.text());
              }
            }
          });

          $head.flyout({
            selector: '.th',
            direction: 'top',
            style: 'table',
            parent: document.body,
            interact: true,

            title: function($target, $head, options) {
              var title = $target.text();
              var index = $target.data('index');
              if (index) { // Should always exist since it's set in ng-repeat, but hey. safe > sorry
                var columnDetail = scope.filteredColumnDetails[index];
                if (columnDetail) { // ditto - scope.filteredColumnDetails mirrors scope.headers
                  var description = columnDetail.description;
                  if (description) { // we may not have a description, so check.
                    return '<div class="title">{0}</div><div class="description">{1}</div>'.format(
                      _.escape(title),
                      description
                    );
                  }
                }
              }
              return _.escape(title);
            },

            html: function($target, $head, options, $element) {
              var columnId = $target.data('columnId');
              var column = getColumn(columnId);
              var sortUp = sortOrdering === 'ASC';
              var html = [];
              var ascendingString = 'ascending';
              var descendingString = 'descending';

              switch (column.physicalDatatype) {
                case 'number':
                  ascendingString = 'smallest first';
                  descendingString = 'largest first';
                  break;

                case 'text':
                  ascendingString = 'A-Z';
                  descendingString = 'Z-A';
                  break;

                case 'timestamp':
                case 'floating_timestamp':
                  ascendingString = 'oldest first';
                  descendingString = 'newest first';
                  break;
              }

              $element.data('table-id', instanceUniqueNamespace);
              $element.data('column-id', columnId);

              if (column.sortable) {
                if (isSortedOnColumn(columnId)) {
                  html.push('Sorted {0}'.format(sortUp ? ascendingString : descendingString));
                }
                var wouldSortUp = getNextSortForColumn(columnId) === 'ASC';

                html.push('<a class="caret" href="#">Click to sort {0}</a>'.
                  format(wouldSortUp ? ascendingString : descendingString));
                return html.join('<br>');
              } else {
                return 'No sort available';
              }
            },
            onBeforeRender: function(target) {
              return !$(target).hasClass('resize') && !columnDrag;
            }
          });

          subscriptions.push(Rx.Observable.subscribeLatest(
            element.offsetParent().observeDimensions(),
            scope.$observe('rowCount'),
            scope.$observe('filteredRowCount'),
            scope.$observe('filteredColumnDetails'),
            scope.$observe('infinite'),
            function(cardDimensions, rowCount, filteredRowCount, filteredColumnDetails, infinite) {

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
                renderTable(
                  element,
                  cardDimensions,
                  rowCount
                );
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

          subscriptions.push(Rx.Observable.subscribeLatest(
            scope.$observe('whereClause'),
            function(whereClause) {
              if (scope.getRows) {
                reloadRows();
              }
            }
          ));


          scope.$destroyAsObservable(element).subscribe(function() {
            _.invoke(subscriptions, 'dispose');
          });
        }
      }
    };

  }

  angular.
    module('socrataCommon.directives').
      directive('table', tableDirectiveFactory);

})();
