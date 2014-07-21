angular.module('socrataCommon.directives').directive('table', function(AngularRxExtensions, $q) {
  var rowsPerBlock = 50,
      rowHeight = $.relativeToPx('2rem');



  return {
    templateUrl: '/angular_templates/common/table.html',
    restrict: 'A',
    scope: { rowCount: '=', filteredRowCount: '=', whereClause: '=', getRows: '=', expanded: '=', infinite: '=' },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      var currentBlocks = [], columnIds = [], sort = '', columnWidths = {},
          httpRequests = {}, oldBlock = -1, columnTypes = {};
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
        $head.delegate('.caret', 'click', sortHandler);
        $('body').delegate('.flyout .caret', 'click', sortHandler);
      };

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
      }

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
        // Update flyout if present
        var columnId = $(".flyout").data('column-id');
        if (columnId) {
          $head.find('.th').eq(_.indexOf(columnIds, columnId)).trigger('mouseenter');
        }
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
      }
      var inferColumnTypes = function(data) {
        // TODO: Replaces these checks with information from the metadata API.
        if(_.keys(columnTypes).length > 0) return;
        var inferMetaData = {};
        _.each(data, function(row) {
          _.each(row, function(cellContent, columnId) {
            if(!inferMetaData[columnId]) inferMetaData[columnId] = {
              not: [],
              counts: {}
            };
            var meta = inferMetaData[columnId];
            function check(name, callback) {
              if (!meta.type && !_.include(meta.not, name)) {
                var resp = callback(cellContent);
                if (resp === 'not') {
                  meta.not.push(name);
                  delete meta.counts[name];
                } else if (resp === 'possible') {
                  if(!meta.counts[name]) meta.counts[name] = 0;
                  meta.counts[name] += 1;
                } else if(resp === 'is') {
                  meta.type = name;
                }
              }
            }
            check("boolean", function(cellData) {
              if (cellData === true) {
                return 'is';
              }
            });
            check("number", function(cellData) {
              if (!_.isNaN(Number(cellData))) {
                return 'possible';
              } else if(!_.isUndefined(cellContent)) {
                return 'not';
              }
            });
            check("location", function(cellData) {
              if (_.isObject(cellData) && cellData.type == 'Point') {
                return 'is';
              }
            });
            check("date", function(cellData) {
              // Checks for presence of '<num>-<num>-<num>' at start.
              if (_.isString(cellContent) && cellContent.match(/^\d+-\d+-\d+/)) {
                var time = moment(cellContent);
                if (time.isValid()) {
                  return 'possible';
                }
              } else if(!_.isUndefined(cellContent)) {
                return 'not';
              }
            });
          });
        });
        _.each(inferMetaData, function(meta, columnId) {
          if(meta.type) {
            columnTypes[columnId] = meta.type;
          } else {
            columnTypes[columnId] = _.max(_.keys(meta.counts), function(k) {
              return meta.counts[k];
            });
          }
        });
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
          inferColumnTypes(data);
          if (currentBlocks.indexOf(block) === -1 || data.length === 0) return;
          var blockHtml = '<div class="row-block {0}" data-block-id="{0}" style="top: {1}px; display: none">'.
            format(block, block * rowsPerBlock * rowHeight);
          _.each(data, function(data_row) {
            blockHtml += '<div class="table-row">';
            _.each(columnIds, function(header) {
              var cellClasses = 'cell';
              var cellContent = data_row[header] || '';
              var cellText = '';
              var cellType = columnTypes[header];
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
              } else if (cellType == 'location') {
                if (_.isArray(cellContent.coordinates)) {
                  cellText += (' (<span title="Latitude">{0}°</span>, ' +
                    '<span title="Longitude">{1}°</span>)').format(
                    cellContent.coordinates[1],
                    cellContent.coordinates[0]
                  );
                }
              } else if (cellType === 'date') {
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
                format(cellClasses, columnWidths[header], cellText);
            });
            blockHtml += '</div>';
          });
          blockHtml += '</div>';
          $expander.append(blockHtml);
          $('.row-block.{0}'.format(block)).fadeIn();
          calculateColumnWidths();
          _.delay(updateExpanderHeight, 1)
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
          if (active) {
            html.push('Sorted {0}'.format(sortUp ? 'ascending' : 'descending'));
          }
          html.push('<a class="caret" href="#">Click to sort {0}</a>'.
            format((active && !sortUp) ? 'ascending' : 'descending'));
          return html.join('<br>');
        }
      });
      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions(),
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

