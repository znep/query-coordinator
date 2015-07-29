(function() {
  'use strict';

  function FeatureMapFlannel(I18n, DataTypeFormatService, ScrollbarService, Constants, $timeout) {
    return {
      restrict: 'E',
      scope: false,
      templateUrl: '/angular_templates/dataCards/featureMapFlannel.html',
      link: function(scope, element) {

        var SCROLLBAR_WIDTH = ScrollbarService.getScrollbarWidth(); // unique to current browser and OS

        scope.currentIndex = 0;
        scope.$watch('currentIndex', function(index) {
          scope.selectedRow = scope.rows[index];
          scope.showingMessage = I18n.t('featureMapFlannel.showing', scope.rowDisplayUnit, index + 1, scope.rows.length);

          // Calculate necessary right padding for close button based on scrollbar (if present)
          $timeout(function() {
            scope.iconClosePadding = {
              paddingRight: Constants.FLANNEL_CLOSE_ICON_INITIAL_PADDING + getFlannelScrollbarWidth()
            };
          });
        });

        function getFlannelScrollbarWidth () {
          return ScrollbarService.getElementScrollbarWidth($(element).find('.tool-panel-inner-container')[0]);
        }

        // Determine dynamic styling for flannel text border that persists through scroll
        //   - Calculate width of flannel-text-wrapper (without the scroll bar width when present)
        //   - Set positioning on bottom border based on whether the paging panel is present
        scope.stickyBorderTop = {
          width: $(element).find('.tool-panel-inner-container').width() - SCROLLBAR_WIDTH
        };

        scope.stickyBorderBottom = _.extend({}, scope.stickyBorderTop,
          {bottom: scope.rows.length > 1 ? Constants.FLANNEL_BOTTOM_STICKY_BORDER_PAGINATION_POSITION : 0});

        // Format an array of subcolumns under a given parent column
        function formatSubColumns(subColumns, parentColumn) {
          if (subColumns.length === 1 && _.isDefined(subColumns[0]) && _.isDefined(subColumns[0].coordinates)) {
            // Format coordinates
            return formatCellContent(subColumns[0], parentColumn);
          } else {
            var address = _.result(_.find(subColumns, {'columnName': 'address'}), 'value').trim();
            var city = _.result(_.find(subColumns, {'columnName': 'city'}), 'value').trim();
            var state = _.result(_.find(subColumns, {'columnName': 'state'}), 'value').trim();
            var zip = _.result(_.find(subColumns, {'columnName': 'zip'}), 'value').trim();
            if (_.any([address, city, state, zip], _.isPresent)) {
              // Format address following US postal format if any of its components are present
              var addressLines = [];
              if (address) {
                addressLines.push(address);
              }
              if (city && state && zip) {
                addressLines.push('{0}, {1} {2}'.format(city, state, zip));
              } else if (state && zip) {
                addressLines.push('{0} {1}'.format(state, zip));
              } else if (city && state) {
                addressLines.push('{0}, {1}'.format(city, state));
              }

              var formattedAddress = addressLines.join('\n');
              return formattedAddress;
            } else {
              // If neither expected set of subcolumns exists, list 'name: value' for each subcolumn
              var formattedColumnData = subColumns.map(function(subColumn) {
                return subColumn.columnName + ': ' + formatCellContent(subColumn.value, parentColumn);
              }).join(', ');
              return formattedColumnData;
            }
          }
        }
        scope.formatSubColumns = formatSubColumns;

        // Format content based on data type
        function formatCellContent(cellContent, column) {
          var cellText = '';
          var cellType = column.physicalDatatype;

          switch (cellType) {
            case 'boolean':
              cellText = DataTypeFormatService.renderBooleanCell(cellContent, column);
              break;
            case 'number':
              cellText = DataTypeFormatService.renderNumberCell(cellContent, column);
              break;
            case 'geo_entity':
            case 'point':
              cellText = DataTypeFormatService.renderGeoCell(cellContent, column);
              break;
            case 'timestamp':
            case 'floating_timestamp':
              cellText = DataTypeFormatService.renderTimestampCell(cellContent, column);
              break;
            case 'money':
              cellText = DataTypeFormatService.renderMoneyCell(cellContent, column);
              break;
            default:
              cellText = cellContent;
              break;
          }
          return cellText;
        }
        scope.formatCellContent = formatCellContent;

        scope.isArray = _.isArray;

        // Handle pagination between multiple rows
        scope.goToPreviousRow = function() {
          if (scope.currentIndex > 0) {
            scope.currentIndex--;
          }
        };

        scope.goToNextRow = function() {
          if (scope.currentIndex < scope.rows.length - 1) {
            scope.currentIndex++;
          }
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('featureMapFlannel', FeatureMapFlannel);
})();
