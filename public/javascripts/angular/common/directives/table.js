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
            '<span class="caret" ng-class="{sortUp: header.sortUp}"></span>' +
            '{{header.name}}' +
          '</div>' +
        '</div>' +
        '<div class="table-body">' +
          '<div class="table-expander"></div>' +
        '</div>' +
        '<div class="table-label">Loading...</div>' +
      '</div>',
    restrict: 'A',
    scope: { rowCount: '=', expanded: '=', getRows: '=' },
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
        $expander.height(rowHeight * rowCount);
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
        $expander.find('.resize').on('mousedown', function(e) {
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
      var setupHead = _.once(function(row) {
        columnIds = _.map(row, function(v, columnId) { return columnId; });
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
          $expander.html('');
          currentBlocks = [];
          oldBlock = -1;
          checkBlocks();
        });
      });

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

      var calculateColumnWidths = function() {
        if (_.keys(columnWidths).length > 0) return;
        updateColumnHeaders();
        _.defer(function() {
          _.each(columnIds, function(columnName, columnIndex) {
            var $cells = $table.find('.cell:nth-child({0}), .th:nth-child({0})'.format(columnIndex + 1));
            var cellWidths = _.map($cells, function(cell) {
              return $(cell).width();
            });
            var width = _.max(cellWidths);
            if (width > 300) width = 300;
            else if(width < 75) width = 75;
            columnWidths[columnName] = width;
            $cells.width(width);
          });
          updateColumnHeaders();
          dragHandles();
        });
      }

      var loadBlockOfRows = function(block) {
        // Check if is being loaded or block exists
        if (_.has(httpRequests, block) || element.find(".row-block."+block).length > 0) {
          return;
        }
        var canceler = $q.defer();
        httpRequests[block] = canceler;
        scope.getRows(block * rowsPerBlock, rowsPerBlock, sort, canceler).
            then(function(data) {
          delete httpRequests[block];
          setupHead(data[0]);
          if (currentBlocks.indexOf(block) === -1) return;
          var blockDiv = $('<div class="row-block"></div>').
            css('top', block * rowsPerBlock * rowHeight).
            addClass(block+'').
            hide();
          _.each(data, function(data_row) {
            var row = $('<div class="table-row"></row>');
            _.each(columnIds, function(header) {
              var cell = $('<div class="cell"></div>').text(data_row[header] || '').
                width(columnWidths[header]);
              row.append(cell);
            });
            blockDiv.append(row);
          });
          $expander.append(blockDiv);
          blockDiv.fadeIn();
          calculateColumnWidths();
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
      }

      var updateLabel = function() {
        var topRow = Math.floor($body.scrollTop() / rowHeight) + 1;
        var bottomRow = Math.floor(($body.scrollTop() + $body.height()) / rowHeight) + 1;
        $label.text('Showing {0} to {1} of {2}'.format(topRow, bottomRow, rowCount));
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

      Rx.Observable.subscribeLatest(
        element.closest('.card').observeDimensions(),
        scope.observe('rowCount'),
        scope.observe('expanded'),
        function(cardDimensions, newRowCount, expanded) {
          rowCount = newRowCount;
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
    }
  }

});

