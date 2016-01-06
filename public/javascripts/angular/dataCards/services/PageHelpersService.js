const angular = require('angular');
function PageHelpersService(I18n, PluralizeService, rx) {
  const Rx = rx;
  return {
    dynamicAggregationTitle: function(pageModel$) {
      var aggregation$ = pageModel$.observeOnLatest('aggregation');
      var primaryAmountFieldName$ = pageModel$.observeOnLatest('primaryAmountField').
        combineLatest(
          pageModel$.observeOnLatest('dataset.columns'),
          function(fieldName, columns) {
            return columns[fieldName];
          }
        ).
        filter(_.isObject).
        pluck('name').
        filter(_.isPresent);

      var countTitle$ = Rx.Observable.combineLatest(
        aggregation$.filter(function(value) { return value['function'] === 'count'; }),
        function(value) {
          return I18n.t('cardTitles.numberOf', PluralizeService.pluralize(value.unit));
        });

      var sumTitle$ = Rx.Observable.combineLatest(
        primaryAmountFieldName$,
        aggregation$.filter(function(value) { return value['function'] === 'sum'; }),
        function(primaryAmountField) {
          return I18n.t('cardTitles.sumOf', PluralizeService.pluralize(primaryAmountField));
        });

      var meanTitle$ = Rx.Observable.combineLatest(
        primaryAmountFieldName$,
        aggregation$.filter(function(value) { return value['function'] === 'mean'; }),
        function(primaryAmountField) {
          return I18n.t('cardTitles.average', primaryAmountField);
        });

      return Rx.Observable.merge(
        countTitle$,
        sumTitle$,
        meanTitle$
      );
    }
  };
}

angular.
  module('dataCards.services').
  service('PageHelpersService', PageHelpersService);
