(function() {
  'use strict';

  function PageHelpersService(Page, I18n) {
    return {
      dynamicAggregationTitle: function(pageModel) {
        window.socrata.utils.assert(pageModel instanceof Page, 'pageModel must be a Page model, durr');
        var aggregation$ = pageModel.observe('aggregation');
        var primaryAmountFieldName$ = pageModel.observe('primaryAmountField').
          combineLatest(
            pageModel.observe('dataset.columns'),
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
            return I18n.t('cardTitles.numberOf', value.unit.pluralize());
          });

        var sumTitle$ = Rx.Observable.combineLatest(
          primaryAmountFieldName$.filter(_.isPresent),
          aggregation$.filter(function(value) { return value['function'] === 'sum'; }),
          function(primaryAmountField) {
            return I18n.t('cardTitles.sumOf', primaryAmountField.pluralize());
          });

        var meanTitle$ = Rx.Observable.combineLatest(
          primaryAmountFieldName$.filter(_.isPresent),
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
})();
