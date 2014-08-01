
angular.module('socrataCommon.directives').directive('table', function(AngularRxExtensions, $q) {
  "use strict";
  var rowsPerBlock = 50,
      rowHeight = $.relativeToPx('2rem');

  return {
    templateUrl: '/angular_templates/dataCards/table.html',
    restrict: 'A',
    scope: { rowCount: '=', filteredRowCount: '=', whereClause: '=', getRows: '=', expanded: '=', infinite: '=', columnDetails: '=' },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      var currentBlocks = [], sort = '', columnWidths = {},
          httpRequests = {}, oldBlock = -1;
      var $table = element.find('.table-inner'),
          $head = element.find('.table-inner > .table-head'),
          $body = element.find('.table-inner > .table-body'),
          $expander = element.find('.table-expander'),
          $label = element.find('.table-label');

      element.delegate('.expand-message > *', 'click', function() {
        scope.$apply(function() {
          scope.$emit('table:expand-clicked');
        });
      });

      var renderTable = function(element, dimensions, rowCount, expanded) {
        var tableHeight = dimensions.height - element.position().top;
        element.height(tableHeight);
        $body.height(tableHeight - $head.height() - rowHeight);
        $head.find('.resize').height(tableHeight);
        checkBlocks();
        updateLabel();
      };

      var dragHandles = function(columnIds) {
        var $resizeContainer = $expander.find('.table-resize-container');
        if($resizeContainer.length === 0) {
          $resizeContainer = $('<div class="table-resize-container table-row"></div>');
          $expander.prepend($resizeContainer);
        }
        if($resizeContainer.children().length > 0) return;
        _.each(columnWidths, function(width, columnId) {
          var $cell = $('<div class="cell"><span class="resize"></span></div>').width(width);
          $cell.find('.resize').data('columnId', columnId);
          $resizeContainer.append($cell);
        });
        var active = false, currentX = 0, columnIndex, columnId;
        element.delegate('.table-head .resize, .table-resize-container .resize', 'mousedown', function(e) {
          currentX = e.pageX;
          columnIndex = $(this).parent().index();
          columnId = $(this).data('columnId');
          active = true;
          e.preventDefault();
        });
        $('body').on('mousemove', function(e) {
          if(active) {
            var $cells = $table.find('.cell:nth-child({0}), .th:nth-child({0})'.
            format(columnIndex + 1));
            var newWidth = $cells.width() + e.pageX - currentX;
            $cells.width(newWidth);
            columnWidths[columnId] = newWidth;
            currentX = e.pageX;
            e.preventDefault();
          }
        }).on('mouseup', function(e) {
          if(active) active = false;
        });
      };

      var setupHead = _.once(function(row) {
        updateColumnHeaders();
        $head.delegate('.caret', 'click', sortHandler);
        $('body').delegate('.flyout .caret', 'click', sortHandler);
      });

      var sortHandler = function(e) {
        var columnId = $(e.currentTarget).parent().data('column-id');
        var sortParts = sort.split(' ');
        var active = sortParts[0] === columnId;
        var sortUp = sortParts[1] === 'ASC';
        if (!active || (active && sortUp)) {
          sort = columnId + ' DESC';
        } else {
          sort = columnId + ' ASC';
        }
        updateColumnHeaders();
        reloadRows();
        e.preventDefault();
      };

      var updateColumnHeaders = function(){
        scope.headers = _.map(_.values(scope.columnDetails), function(column, i) {
          // Symbols: ▼ ▲
          var sortParts = sort.split(' ');
          var active = column.name === sortParts[0];
          var sortUp = sortParts[1] === 'ASC';
          return {
            columnId: column.name,
            name: column.title,
            active: active,
            sortUp: active && sortUp,
            width: columnWidths[column.name],
            sortable: column.sortable
          };
        });
        // Update flyout if present
        var columnId = $(".flyout").data('column-id');
        if (columnId) {
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
            var width = $(maxCell).width();
            if (width > 300) width = 300;
            else if(width < 75) width = 75;
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
        scope.getRows(block * rowsPerBlock, rowsPerBlock, sort, canceler, scope.whereClause).
            then(function(data) {
          delete httpRequests[block];
          setupHead(data[0]);
          if (currentBlocks.indexOf(block) === -1 || data.length === 0) return;
          var blockHtml = '<div class="row-block {0}" data-block-id="{0}" style="top: {1}px; display: none">'.
            format(block, block * rowsPerBlock * rowHeight);
          _.each(data, function(data_row) {
            blockHtml += '<div class="table-row">';
            _.each(_.values(scope.columnDetails), function(column, columnIndex) {
              var cellClasses = 'cell';
              var cellContent = data_row[column.name] || '';
              var cellText = '';
              var cellType = scope.columnDetails[column.name].physicalDatatype;
              // Is Boolean?
              if (cellType === 'boolean') {
                cellText = cellContent ? '✓' : '✗';
              } else if (cellType === 'number') {
                cellClasses += ' number';
                // TODO: Remove this. This is just to satisfy Clint's pet peeve about years.
                if (cellContent.length >= 5) {
                  cellText = _.escape($.commaify(cellContent));
                } else {
                  cellText = _.escape(cellContent);
                }
              } else if (cellType == 'geo entity') {
                if (_.isArray(cellContent.coordinates)) {
                  cellText += (' (<span title="Latitude">{0}°</span>, ' +
                    '<span title="Longitude">{1}°</span>)').format(
                      cellContent.coordinates[1],
                      cellContent.coordinates[0]);
                }
              } else if (cellType === 'timestamp') {
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
                format(cellClasses, columnWidths[column.name], cellText);
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
        if(currentBlock === oldBlock) return;
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
        var topRow = Math.floor($body.scrollTop() / rowHeight) + 1;
        var bottomRow = Math.floor(($body.scrollTop() + $body.height()) / rowHeight);
        $label.text('Showing {0} to {1} of {2} (Total: {3})'.format(topRow,
            _.min([bottomRow, scope.filteredRowCount]), scope.filteredRowCount,
            scope.rowCount));
      };

      var reloadRows = function() {
        $expander.find('.row-block').remove();
        currentBlocks = [];
        oldBlock = -1;
        checkBlocks();
      };
      var showOrHideNoRowMessage = function() {
        if (scope.filteredRowCount === 0) {
          element.find('.table-no-rows-message').fadeIn();
        } else {
          element.find('.table-no-rows-message').fadeOut();
        }
      };
      var scrollLeft = $body.scrollLeft(), scrollTop = $body.scrollTop();
      $body.scroll(function(e) {
        if (scrollLeft !== (scrollLeft = $body.scrollLeft())) {
          moveHeader();
        }
        if (scrollTop !== (scrollTop = $body.scrollTop())) {
          checkBlocks();
          updateLabel();
        }
      });
      $body.flyout({
        selector: '.row-block .cell',
        interact: true,
        style: 'table',
        direction: 'horizontal',
        html: function($target, $head, options) {
          if($target[0].clientWidth < $target[0].scrollWidth) {
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
          var columnId = $target.data('column-id');
          var sortParts = sort.split(' ');
          var active = columnId === sortParts[0];
          var sortUp = sortParts[1] === 'ASC';
          var html = [];
          $element.data('column-id', columnId);
          if (scope.columnDetails[columnId].sortable) {
            if (active) {
              html.push('Sorted {0}'.format(sortUp ? 'ascending' : 'descending'));
            }
            html.push('<a class="caret" href="#">Click to sort {0}</a>'.
              format((active && !sortUp) ? 'ascending' : 'descending'));
            return html.join('<br>');
          } else {
            return 'No sort available';
          }
        }
      });
      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions(),
        scope.observe('rowCount'),
        scope.observe('filteredRowCount'),
        scope.observe('expanded'),
        scope.observe('columnDetails'),
        scope.observe('infinite'),
        function(cardDimensions, rowCount, filteredRowCount, expanded, columnDetails, infinite) {
          updateExpanderHeight();
          showOrHideNoRowMessage();
          if (rowCount && expanded) {
            renderTable(
              element,
              cardDimensions,
              rowCount,
              expanded
            );
          }
        }
      );
      Rx.Observable.subscribeLatest(
        scope.observe('whereClause'),
        function(whereClause) {
          if(scope.getRows && scope.expanded) {
            reloadRows();
          }
        }
      );
    }
  };

});

