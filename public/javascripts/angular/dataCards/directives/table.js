angular.module('socrataCommon.directives').directive('table', function(AngularRxExtensions, $q, $timeout) {
  'use strict';

  var rowsPerBlock = 50;
  var rowHeight = $.relativeToPx('2rem');

  return {
    templateUrl: '/angular_templates/dataCards/table.html',
    restrict: 'A',

    scope: {
      rowCount: '=',
      filteredRowCount: '=',
      whereClause: '=',
      getRows: '=',
      expanded: '=',
      infinite: '=',
      columnDetails: '=',
      defaultSortColumnName: '='    // When the table is first created, it will be sorted on this column.
    },

    link: function(scope, element, attrs) {
      // A unique jQuery namespace, specific to one table instance.
      var instanceUniqueNamespace = 'table.instance{0}'.format(scope.$id);

      AngularRxExtensions.install(scope);

      var currentBlocks = [];
      var sort = '';
      var columnWidths = {};
      var httpRequests = {};
      var oldBlock = -1;
      var $table = element.find('.table-inner');
      var $head = element.find('.table-inner > .table-head');
      var $body = element.find('.table-inner > .table-body');
      var $expander = element.find('.table-expander');
      var $label = element.find('.table-label');

      $('body').on('click.{0}'.format(instanceUniqueNamespace), '.flyout .caret', function(e) {
        if ($(e.currentTarget).parent().data('table-id') !== instanceUniqueNamespace) {
          return; // The flyout might not be our own!
        }
        scope.safeApply(function() {
          var columnId = $(e.currentTarget).parent().data('column-id');

          sortOnColumn(columnId);
        });
      });

      scope.$on('$destroy', function() {
        $('body').off('.{0}'.format(instanceUniqueNamespace));
      });

      scope.$on('tableHeader:click', function(event, headerObject) {
        sortOnColumn(headerObject.columnId);
      });

      var renderTable = function(element, dimensions, rowCount) {
        var tableHeight = dimensions.height - element.position().top;

        element.height(tableHeight);
        $body.height(tableHeight - $head.height() - rowHeight);
        $head.find('.resize').height(tableHeight);

        checkBlocks();
        updateLabel();
      };

      // Given a column detail object, returns
      // this column's default sort (represented
      // by the strings 'DESC' and 'ASC').
      function defaultSortOrderForColumn(column) {
        switch(column.physicalDatatype) {
          case 'number':
          case 'timestamp':
          case 'floating_timestamp':
            return 'DESC';
          default:
            return 'ASC';
        }
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
          var sortParts = sort.split(' ');
          var currentSort = sortParts[1];

          newOrdering = currentSort === 'DESC' ? 'ASC' : 'DESC';
        } else {
          var column = scope.columnDetails[columnId];

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
          var sortParts = sort.split(' ');

          return sortParts[1];
        } else {
          return getNextSortForColumn(columnId);
        }
      };

      // Apply a sort on the column corresponding to the given columnId.
      var sortOnColumn = function(columnId) {
        var newOrdering = getNextSortForColumn(columnId);

        sort = '{0} {1}'.format(columnId, newOrdering);
        updateColumnHeaders();
        reloadRows();
      };

      // Returns true if we're currently sorting
      // on the given column.
      var isSortedOnColumn = function(columnId) {
        var sortParts = sort.split(' ');

        return sortParts[0] === columnId;
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

      var updateColumnHeaders = function(){
        scope.headers = _.map(_.values(scope.columnDetails), function(column, i) {
          // Symbols: ▼ ▲
          var ordering = getCurrentOrDefaultSortForColumn(column.name);

          return {
            columnId: column.name,
            name: column.title,
            active: isSortedOnColumn(column.name),
            sortUp: ordering === 'ASC',
            width: columnWidths[column.name],
            sortable: column.sortable
          };
        });

        // Update flyout if present
        var columnId = $(".flyout").data('column-id');

        if (_.isPresent(columnId)) {
          $head.find('.th:contains({0})'.format(scope.columnDetails[columnId].title)).mouseenter();
        }
      };

      // TODO: Clean this up. It's horribly expensive. ~400ms in tests.
      var calculateColumnWidths = _.once(function() {
        updateColumnHeaders();
        _.defer(function() {
          _.each(_.values(scope.columnDetails), function(column, columnIndex) {
            var $cells = $table.find('.cell:nth-child({0}), .th:nth-child({0})'.
              format(columnIndex + 1));
            var maxCell = _.max($cells, function(cell) {
              return cell.clientWidth;
            });
            // text-overflow: ellipsis starts ellipsifying things when the widths are equal, which
            // makes it hard to detect (in that case) if we should display a flyout or not (since
            // scrollWidth == clientWidth both for too-short text as well as just-ellipsified text).
            // So - offset by one, to at least make that situation less common.
            var width = $(maxCell).width() + 1;

            if (width > 300) {
              width = 300;
            } else if (width < 75) {
              width = 75;
            }

            columnWidths[column.name] = width;
            $cells.width(width);
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
        if (_.has(httpRequests, block) || element.find(".row-block."+block).length > 0) {
          return;
        }
        var canceler = $q.defer();

        httpRequests[block] = canceler;

        scope.getRows(block * rowsPerBlock, rowsPerBlock, sort, canceler, scope.whereClause).then(function(data) {
          delete httpRequests[block];
          ensureColumnHeaders();

          if (currentBlocks.indexOf(block) === -1 || data.length === 0) {
            return;
          }

          var blockHtml = '<div class="row-block {0}" data-block-id="{0}" style="top: {1}px; display: none">'.
            format(block, block * rowsPerBlock * rowHeight);

          _.each(data, function(data_row) {
            blockHtml += '<div class="table-row">';
            _.each(_.values(scope.columnDetails), function(column) {
              var cellClasses = ['cell'];
              var cellContent = data_row[column.name] || '';
              var cellText = '';
              var cellType = scope.columnDetails[column.name].physicalDatatype;

              cellClasses.push(cellType);

              // Is Boolean?
              // TODO: Add test coverage for this cellType (needs this type in the fixture data)
              if (cellType === 'boolean') {
                cellText = cellContent ? '✓' : '✗';

              } else if (cellType === 'number') {
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
                  cellText = (
                    '(<span title="Latitude">{0}°</span>, <span title="Longitude">{1}°</span>)'
                  ).format(
                    cellContent.coordinates[latitudeCoordinateIndex],
                    cellContent.coordinates[longitudeCoordinateIndex]
                  );
                }

              } else if (cellType === 'timestamp' || cellType === 'floating_timestamp') {
                var time = moment(cellContent);

                // Check if Date or Date/Time
                if (time.format('HH:mm:ss') === '00:00:00') {
                  cellText = time.format('YYYY MMM D');
                } else {
                  cellText = time.format('YYYY MMM DD HH:mm:ss');
                }

              } else {
                cellText = _.escape(cellContent);
              }

              blockHtml += '<div class="{0}" style="width: {1}px">{2}</div>'.
                format(cellClasses.join(' '), columnWidths[column.name], cellText);
            });
            blockHtml += '</div>';
          });
          blockHtml += '</div>';

          $expander.append(blockHtml);
          $('.row-block.{0}'.format(block)).fadeIn();
          calculateColumnWidths();
          _.delay(updateExpanderHeight, 1);
        });
      };

      var moveHeader = function() {
        $head.css('left', - $body.scrollLeft());
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
            $expander.find(".row-block."+blockId).remove();
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

        $label.text('Showing {0} to {1} of {2} (Total: {3})'.format(
          topRow,
          bottomRow,
          scope.filteredRowCount,
          scope.rowCount)
        );
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
        scope.safeApply(function() {
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
          return _.escape($target.text());
        },

        html: function($target, $head, options, $element) {
          var headerScope = $target.scope();
          var columnId = headerScope.header.columnId;
          var column = scope.columnDetails[columnId];
          var sortParts = sort.split(' ');
          var sortUp = sortParts[1] === 'ASC';
          var html = [];
          var ascendingString = 'ascending';
          var descendingString = 'descending';

          switch(column.physicalDatatype) {
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

      Rx.Observable.subscribeLatest(
        element.offsetParent().observeDimensions(),
        scope.observe('rowCount'),
        scope.observe('filteredRowCount'),
        scope.observe('expanded'),
        scope.observe('columnDetails'),
        scope.observe('infinite'),
        function(cardDimensions, rowCount, filteredRowCount, expanded, columnDetails, infinite) {

          scope.$emit('render:start', { source: 'table_{0}'.format(scope.$id), timestamp: _.now() });

          updateExpanderHeight();
          showOrHideNoRowMessage();

          // Make sure rowCount is a number (ie not undefined)
          if (rowCount >= 0) {
            // Apply a default sort if needed.
            if (scope.defaultSortColumnName && _.isEmpty(sort)) {
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
            scope.$emit('render:complete', { source: 'table_{0}'.format(scope.$id), timestamp: _.now() });
          }, 0, false);
        }
      );

      Rx.Observable.subscribeLatest(
        scope.observe('whereClause'),
        function(whereClause) {
          if (scope.getRows) {
            reloadRows();
          }
        }
      );
    }
  };

});

