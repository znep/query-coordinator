const templateUrl = require('angular_templates/dataCards/quickFilterBar.html');

module.exports = function quickFilterBar(
  $log,
  rx,
  $window,
  Constants,
  Filter,
  FlyoutService,
  I18n,
  PageHelpersService,
  PluralizeService) {

  function humanReadableOperator(filter) {
    if (
      filter instanceof Filter.BinaryOperatorFilter ||
      filter instanceof Filter.BinaryComputedGeoregionOperatorFilter
    ) {
      if (filter.operator === '=') {
        return I18n.filter.is;
      } else {
        throw new Error('Only the "=" filter is currently supported.');
      }
    } else if (filter instanceof Filter.TimeRangeFilter) {
      return I18n.filter.is;
    } else if (filter instanceof Filter.ValueRangeFilter) {
      return I18n.filter.is;
    } else if (filter instanceof Filter.IsNullFilter) {
      if (filter.isNull) {
        return I18n.filter.is;
      } else {
        return I18n.filter.isNot;
      }
    } else {
      throw new Error('Cannot apply filter of unsupported type "' + filter + '".');
    }
  }

  function humanReadableOperand(filter) {
    if (
      filter instanceof Filter.BinaryOperatorFilter ||
      filter instanceof Filter.BinaryComputedGeoregionOperatorFilter
    ) {
      if (_.isPresent(filter.operand.toString().trim())) {
        return filter.humanReadableOperand || filter.operand;
      } else {
        return I18n.filter.blank;
      }
    } else if (filter instanceof Filter.IsNullFilter) {
      return I18n.filter.blank;
    } else if (filter instanceof Filter.TimeRangeFilter) {
      var format = 'YYYY MMMM DD';
      return I18n.t('filter.dateRange',
        moment(filter.start).format(format),
        moment(filter.end).format(format)
      );
    } else if (filter instanceof Filter.ValueRangeFilter) {
      return I18n.t('filter.valueRange',
        $window.socrata.utils.formatNumber(filter.start),
        $window.socrata.utils.formatNumber(filter.end)
      );
    } else {
      throw new Error('Cannot apply filter of unsupported type "' + filter + '".');
    }
  }

  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {
      var page = $scope.page;

      var clearAllFiltersSelectors = [
        '.clear-all-filters-button',
        '.clear-all-filters-button .icon-close'
      ];

      FlyoutService.register({
        selector: clearAllFiltersSelectors.join(', '),
        render: function() {
          return `<div class="flyout-title">${I18n.quickFilterBar.clearAllFlyout}</div>`;
        },
        positionOn: function() {
          return $(clearAllFiltersSelectors[0])[0];
        },
        destroySignal: $scope.$destroyAsObservable()
      });

      var appliedFiltersForDisplay$ = page.observe('activeFilters').
        combineLatest(
          page.observe('dataset.columns'),
          function(pageFilters, columns) {
            return _.reduce(pageFilters, function(accumulator, cardFilterInfo) {
              if ($.isPresent(cardFilterInfo.filters)) {
                if (cardFilterInfo.filters.length > 1) {
                  $log.warn('Cannot apply multiple filters to a single card.');
                }
                var filter = _.first(cardFilterInfo.filters);
                accumulator.push({
                  column: columns[cardFilterInfo.fieldName],
                  operator: humanReadableOperator(filter),
                  operand: humanReadableOperand(filter)
                });
              }
              return accumulator;
            }, []);
          }
        );

      var quickFilterBarTitle$ = rx.Observable.combineLatest(
        appliedFiltersForDisplay$,
        page.observe('dataset.rowDisplayUnit'),
        function(appliedFiltersForDisplay, rowDisplayUnit) {
          rowDisplayUnit = PluralizeService.pluralize(rowDisplayUnit || I18n.common.row);

          if (_.isEmpty(appliedFiltersForDisplay)) {
            return I18n.t('quickFilterBar.unfilteredTitle', rowDisplayUnit);
          } else {
            return I18n.t('quickFilterBar.filteredTitle', rowDisplayUnit);
          }
        }
      );

      $scope.clearAllFilters = function() {
        _.each($scope.page.getCurrentValue('cards'), function(card) {
          if (!_.isEmpty(card.getCurrentValue('activeFilters'))) {
            card.set('activeFilters', []);
          }
        });
      };

      $scope.maxOperandLength = Constants.MAX_OPERAND_LENGTH;
      $scope.$bindObservable('appliedFiltersForDisplay', appliedFiltersForDisplay$);
      $scope.$bindObservable('quickFilterBarTitle', quickFilterBarTitle$);
    }
  };
};
