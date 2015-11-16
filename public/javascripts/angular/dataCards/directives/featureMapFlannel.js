var templateUrl = require('angular_templates/dataCards/featureMapFlannel.html');
const angular = require('angular');
function FeatureMapFlannel(I18n, DataTypeFormatService, Constants, $timeout) {

  return {
    restrict: 'E',
    scope: false,
    templateUrl: templateUrl,
    link: function(scope, element) {
      var iconClose = element.find('.icon-close');
      var stickyBorders = element.find('.sticky-border');
      var flannelContent = element.find('.flannel-content');
      var currentIndex$ = scope.$observe('currentIndex').
        filter(function(index) { return index >= 0; });
      var queryStatus$ = scope.$observe('queryStatus');
      var successfulQuery$ = queryStatus$.
        filter(function(status) { return status === Constants.QUERY_SUCCESS; });

      // Flannel is busy and should show a spinner until the row query is successful
      var busy$ = queryStatus$.
        map(function(status) { return status !== Constants.QUERY_SUCCESS; }).
        startWith(true).
        distinctUntilChanged();

      scope.$bindObservable('busy', busy$);

      // Compile a formatted row title from the given title column or lack thereof.
      function compileRowTitle(titleColumn) {
        if (_.isUndefined(titleColumn)) {
          return;
        } else if (scope.useDefaults) {
          // defaults are lat/lng coordiantes from a location column, which we
          // can count on being accessible in this way
          var coordinates = formatContentByType(titleColumn.value[0], titleColumn, true);
          return coordinates;
        } else {
          var title = scope.formatCellValue(titleColumn, true);
          return _.isString(title) ? title.toUpperCase() : title;
        }
      }

      // Format content based on data type
      function formatContentByType(content, column, isTitle) {
        if (_.isNull(column.value)) {
          return '';
        }

        isTitle = isTitle || false;

        var isLatLng = column.physicalDatatype === 'point' || column.physicalDatatype === 'geo_entity';

        var datatypeToFormat = {
          'boolean': DataTypeFormatService.renderBooleanCell(content, column),
          'number': DataTypeFormatService.renderNumberCell(content, column),
          'geo_entity': DataTypeFormatService.renderGeoCell(content, column),
          'point': DataTypeFormatService.renderGeoCell(content, column),
          'timestamp': DataTypeFormatService.renderTimestampCell(content, column),
          'floating_timestamp': DataTypeFormatService.renderTimestampCell(content, column),
          'money': DataTypeFormatService.renderMoneyCell(content, column),
          'text': _.identity(content)
        };

        var formattedContent = _.get(datatypeToFormat, column.physicalDatatype, content);
        if (isTitle && isLatLng) {
          formattedContent = formattedContent.replace(/[()]/g, '');
        }
        return formattedContent;
      }

      // Format an array of subcolumns under a given parent column
      scope.formatCellValue = function(column, isTitle) {
        if (_.isNull(column.value)) {
          return '';
        }

        isTitle = isTitle || false;

        // Format cell value if it is a single column without subcolumns
        if (!column.isParentColumn) {
          return formatContentByType(column.value[0], column, isTitle);
        }

        // Otherwise, the column is a parent column.
        // Process its subcolumns, formatting and arranging each value acccordingly.
        var subColumns = column.value;
        var formattedColumnData;

        // If it is a location column with only coordinates, format that directly.
        if (subColumns.length === 1 && _.has(subColumns[0], 'coordinates')) {
          // Take into account if the data represents the title, in which coordinates should not
          // be represented with parentheses.
          formattedColumnData = formatContentByType(subColumns[0], column, isTitle);
        }

        // Otherwise process subcolumns based on the parent column's type.
        switch (column.renderTypeName) {
          case 'location':
            var addressColumns = _.map(['address', 'city', 'state', 'zip'], function(addressColumn) {
              var columnValue = _.result(_.find(subColumns, { 'columnName': addressColumn }), 'value');
              return _.isDefined(columnValue) ? columnValue.trim() : columnValue;
            });

            // Format address following US postal format if any of its components are present
            if (_.any(addressColumns, _.isPresent)) {
              var address = addressColumns[0];
              var city = addressColumns[1];
              var state = addressColumns[2];
              var zip = addressColumns[3];
              var addressLines = [];

              if (address) {
                addressLines.push(address);
              }

              if (city && state && zip) {
                addressLines.push(`${city}, ${state} ${zip}`);
              } else if (state && zip) {
                addressLines.push(`${state} ${zip}`);
              } else if (city && state) {
                addressLines.push(`${city}, ${state}`);
              }

              formattedColumnData = addressLines.join('\n');
            } else {
              // As a back up, just display the coordinates
              formattedColumnData = formatContentByType(subColumns[0], column, isTitle);
            }
            break;
          case 'phone':
            // Just return the phone number, not its type
            // Given that this is stored with the parent column, it will be the
            // first subcolumn stored
          case 'url':
            // Just return the url, not its description
            // Given that this is stored with the parent column, it will be the
            // first subcolumn stored.
          default:
            // If an unexpected subcolumn comes up, format and display
            // the value of its parent column only, not its subcolumns.
            formattedColumnData = formatContentByType(subColumns[0].value, subColumns[0], isTitle);
            break;

            // Other possible default behavior:

            // If an unexpected column and subcolumns are encountered,
            // list 'name: value' for each subcolumn
            // formattedColumnData = subColumns.
            //   map(function(subColumn) {
            //     return '{0}: {1}'.format(
            //       subColumn.columnName,
            //       formatContentByType(subColumn.value, column)
            //     );
            //   }).
            //   join(', ');
            // break;
        }
        return formattedColumnData;
      };

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

      // On every page change, update the flyout content and positioning.
      currentIndex$.subscribe(function(index) {
        scope.selectedRowTitle = compileRowTitle(scope.titles[index]);
        scope.selectedRow = scope.rows[index];
        scope.showingMessage = I18n.t('featureMapFlannel.showing',
          scope.rowDisplayUnit, ++index, scope.rows.length);

        $timeout(function() {
          var scrollbarNotVisible = flannelContent.outerWidth() === Constants.FEATURE_MAP_FLANNEL_WIDTH;
          scope.isScrollable = flannelContent.innerHeight() > Constants.FEATURE_MAP_FLANNEL_MAX_CONTENT_HEIGHT;

          // If a scrollbar should exist, but it's not visible (Firefox),
          // dedicate room for it.
          if (scope.isScrollable && scrollbarNotVisible) {
            flannelContent.width(flannelContent.width() -
              Constants.FEATURE_MAP_FLANNEL_FIREFOX_SCROLLBAR_PADDING);
          }

          iconClose.css('right', 'auto');
          iconClose.css('left', flannelContent.innerWidth() - iconClose.width() -
            Constants.FEATURE_MAP_FLANNEL_CLOSE_ICON_INITIAL_PADDING);
          stickyBorders.width(flannelContent.innerWidth() - iconClose.width());
          stickyBorders.toggle(scope.isScrollable);
        });
      });

      successfulQuery$.subscribe(function() {
        scope.currentIndex = 0;
      });
    }
  };
}

angular.
  module('dataCards.directives').
    directive('featureMapFlannel', FeatureMapFlannel);
