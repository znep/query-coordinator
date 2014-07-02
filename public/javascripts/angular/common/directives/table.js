angular.module('socrataCommon.directives').directive('table', function(AngularRxExtensions, $q) {
  var rowsPerBlock = 50,
      rowHeight = $.relativeToPx('2rem');



  return {
    template:
      '<div class="expand-message">Expand to view the data.</div>' +
      '<div class="table-inner">' +
        '<div class="table-head">' +
          '<div class="th" ng-repeat="header in headers"' +
              'data-column-id="{{header.columnId}}" style="width: {{header.width}}px;" ng-class="{active: header.active}">' +
            '<span class="caret" ng-class="{sortUp: header.sortUp}"></span><span class="resize"></span>' +
            '{{header.name}}' +
          '</div>' +
        '</div>' +
        '<div class="table-body">' +
          '<div class="table-expander"></div>' +
        '</div>' +
        '<div class="table-label">Loading...</div>' +
        '<div class="table-no-rows-message">No rows to display</div>' +
      '</div>',
    restrict: 'A',
    scope: { rowCount: '=', filteredRowCount: '=', whereClause: '=', getRows: '=', expanded: '=', infinite: '=' },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      var currentBlocks = [], columnIds = [], sort = '', columnWidths = {},
          httpRequests = {}, oldBlock = -1;
      var $table = element.find('.table-inner'),
          $head = element.find('.table-inner > .table-head'),
          $body = element.find('.table-inner > .table-body'),
          $expander = element.find('.table-expander'),
          $label = element.find('.table-label');

      var renderTable = function(element, dimensions, rowCount, expanded) {
        var tableHeight = dimensions.height - element.position().top;
        element.height(tableHeight);
        $body.height(tableHeight - $head.height() - rowHeight);
        $head.find('.resize').height(tableHeight);
        checkBlocks();
        updateLabel();
      }

      var dragHandles = function(columnIds) {
        var $resizeContainer = $expander.find('.table-resize-container');
        if($resizeContainer.length === 0) {
          $resizeContainer = $('<div class="table-resize-container table-row"></div>');
          $expander.prepend($resizeContainer);
        }
        if($resizeContainer.children().length > 0) return;
        _.each(columnWidths, function(width, columnId) {
          $cell = $('<div class="cell"><span class="resize"></span></div>').width(width);
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
      }

      /*
        TODO: This uses the first row of the first block loaded to generate column names.
        It should use the meta data service once it's working.
      */
      var setupHead = function(row) {
        if (columnIds.length > 0) return;
        columnIds = _.keys(row);
        updateColumnHeaders();

        $head.delegate('.caret', 'click', function(e) {
          var columnId = $(e.currentTarget).parent('.th').data('column-id');
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
        });
      };

      var updateColumnHeaders = function(){
        scope.headers = _.map(columnIds, function(columnId) {
          // Symbols: ▼ ▲
          var sortParts = sort.split(' ');
          var active = columnId === sortParts[0];
          var sortUp = sortParts[1] === 'ASC';
          return {
            columnId: columnId,
            name: columnId.replace(/_/g, ' ').capitaliseEachWord(),
            active: active,
            sortUp: active && sortUp,
            width: columnWidths[columnId]
          }
        });
      }

      // TODO: Clean this up. It's horribly expensive. ~400ms in tests.
      var calculateColumnWidths = _.once(function() {
        updateColumnHeaders();
        _.defer(function() {
          _.each(columnIds, function(columnName, columnIndex) {
            var $cells = $table.find('.cell:nth-child({0}), .th:nth-child({0})'.
              format(columnIndex + 1));
            var maxCell = _.max($cells, function(cell) {
              return cell.clientWidth;
            });
            var width = $(maxCell).width();
            if (width > 300) width = 300;
            else if(width < 75) width = 75;
            columnWidths[columnName] = width;
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
          var lastLoadedBlock = _.max(_.map(element.find(".row-block"), function(block) {
            return $(block).data('block-id');
          }));
          if (lastLoadedBlock < 0) lastLoadedBlock = 0;
          var lastHeight = element.find('.row-block.{0}'.format(lastLoadedBlock)).height() || 0;
          var height = rowHeight * lastLoadedBlock * rowsPerBlock + lastHeight;
          $expander.height(height);
        }
      }
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
            _.each(columnIds, function(header) {
              var cellClasses = 'cell';
              var cellContent = data_row[header];

              // TODO: Replaces these checks with information from the metadata API.
              if (_.isUndefined(cellContent)) {
                cellContent = '';
              // Is Number? (Really poor check since there are nominal numbers.)
              } else if (!_.isNaN(Number(cellContent))) {
                cellClasses += ' number';
                // TODO: Remove this. This is just to satisfy Clint's pet peeve about years.
                if (cellContent.length >= 5) {
                  cellContent = $.commaify(cellContent);
                }
              // Is Boolean?
              } else if (cellContent === true) {
                cellContent = '✓';
              // TODO: This check doesn't work because the server for false bools doesn't return anything.
              } else if (cellContent === false) {
                cellContent = '✗';
              // Checks for presence of '<num>-<num>-<num>' at start.
              } else if (_.isString(cellContent) && cellContent.match(/^\d+-\d+-\d+/)){
                var time = moment(cellContent);
                // Is Date/Tim?
                if (time.isValid()) {
                  // Check if Date or Date/Time
                  if (time.format('HH:mm:ss') === '00:00:00') {
                    cellContent = time.format('YYYY MMM D');
                  } else {
                    cellContent = time.format('YYYY MMM DD HH:mm:ss');
                  }
                }
              }
              blockHtml += '<div class="{0}" style="width: {1}px">{2}</div>'.
                format(cellClasses, columnWidths[header], _.escape(cellContent));
            });
            blockHtml += '</div>';
          });
          blockHtml += '</div>';
          $expander.append(blockHtml);

          $('.row-block.{0}'.format(block)).fadeIn();
          calculateColumnWidths();
          updateExpanderHeight();
        });
      }
      var moveHeader = function() {
        $head.css('left', - $body.scrollLeft());
      }
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
      }

      var updateLabel = function() {
        var topRow = Math.floor($body.scrollTop() / rowHeight) + 1;
        var bottomRow = Math.floor(($body.scrollTop() + $body.height()) / rowHeight);
        $label.text('Showing {0} to {1} of {2} (Total: {3})'.format(topRow,
            _.min([bottomRow, scope.filteredRowCount]), scope.filteredRowCount,
            scope.rowCount));
      }

      var reloadRows = function() {
        $expander.find('.row-block').remove();
        currentBlocks = [];
        oldBlock = -1;
        checkBlocks();
      }
      var showOrHideNoRowMessage = function() {
        if (scope.filteredRowCount == 0) {
          element.find('.table-no-rows-message').fadeIn();
        } else {
          element.find('.table-no-rows-message').fadeOut();
        }
      }
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
        direction: function($target, $head, options, $flyout) {
          var pos = $target.offset();
          var rightEdge = pos.left + $target.outerWidth() + $flyout.outerWidth();
          if(rightEdge > window.innerWidth) {
            return 'right';
          }
          return 'left';
        },
        html: function($target, $head, options) {
          if($target[0].clientWidth < $target[0].scrollWidth) {
            return _.escape($target.text());
          }
        }
      });
      $head.flyout({
        selector: '.th',
        direction: 'bottom',
        parent: element,
        title: function($target, $head, options) {
          return _.escape($target.text());
        },
        html: function($target, $head, options) {
          var columnId = $target.data('column-id');
          var sortParts = sort.split(' ');
          var active = columnId === sortParts[0];
          var sortUp = sortParts[1] === 'ASC';
          if(!active) {
            return 'Not Sorting';
          } else {
            return 'Sorted ' + (sortUp ? 'Ascending' : 'Descending');
          }
        }
      });
      Rx.Observable.subscribeLatest(
        element.closest('.card').observeDimensions(),
        scope.observe('rowCount'),
        scope.observe('filteredRowCount'),
        scope.observe('expanded'),
        scope.observe('infinite'),
        function(cardDimensions, rowCount, filteredRowCount, expanded, infinite) {
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
  }

});

