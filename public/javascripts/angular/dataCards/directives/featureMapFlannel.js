(function() {
  'use strict';

  function FeatureMapFlannel(I18n, DataTypeFormatService, Constants, $timeout) {

    return {
      restrict: 'E',
      scope: false,
      templateUrl: '/angular_templates/dataCards/featureMapFlannel.html',
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

        // Format content based on data type
        scope.formatCellContent = function(cellContent, column) {
          var datatypeToFormat = {
            'boolean': DataTypeFormatService.renderBooleanCell(cellContent, column),
            'number': DataTypeFormatService.renderNumberCell(cellContent, column),
            'geo_entity': DataTypeFormatService.renderGeoCell(cellContent, column),
            'point': DataTypeFormatService.renderGeoCell(cellContent, column),
            'timestamp': DataTypeFormatService.renderTimestampCell(cellContent, column),
            'floating_timestamp': DataTypeFormatService.renderTimestampCell(cellContent, column),
            'money': DataTypeFormatService.renderMoneyCell(cellContent, column)
          };

          return _.get(datatypeToFormat, column.physicalDatatype, cellContent);
        };

        // Format an array of subcolumns under a given parent column
        scope.formatSubColumns = function(subColumns, parentColumn) {
          var formattedColumnData;

          if (!_.isArray(subColumns)) {
            return scope.formatCellContent(subColumns, parentColumn);
          }

          if (subColumns.length === 1 && _.has(subColumns[0], 'coordinates')) {
            formattedColumnData = scope.formatCellContent(subColumns[0], parentColumn);
          } else {
            var addressColumns = _.map(['address', 'city', 'state', 'zip'], function(column) {
              var columnValue = _.result(_.find(subColumns, { 'columnName': column }), 'value');
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
                addressLines.push('{0}, {1} {2}'.format(city, state, zip));
              } else if (state && zip) {
                addressLines.push('{0} {1}'.format(state, zip));
              } else if (city && state) {
                addressLines.push('{0}, {1}'.format(city, state));
              }

              formattedColumnData = addressLines.join('\n');
            } else {

              // If neither expected set of subcolumns exists, list 'name: value' for each subcolumn
              formattedColumnData = subColumns.
                map(function(subColumn) {
                  return '{0}: {1}'.format(
                    subColumn.columnName,
                    scope.formatCellContent(subColumn.value, parentColumn)
                  );
                }).
                join(', ');
            }
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
})();
