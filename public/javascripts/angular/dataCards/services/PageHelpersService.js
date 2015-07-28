(function() {
  'use strict';

  function PageHelpersService(Assert, Page, I18n) {
    return {
      dynamicAggregationTitle: function(pageModel) {
        Assert(pageModel instanceof Page, 'pageModel must be a Page model, durr');
        var aggregationObservable = pageModel.observe('aggregation');
        var primaryAmountFieldNameSequence = pageModel.observe('primaryAmountField').
          combineLatest(
            pageModel.observe('dataset.columns'),
            function(fieldName, columns) {
              return columns[fieldName];
            }
          ).
          filter(_.isObject).
          pluck('name').
          filter(_.isPresent);

        var countTitleSequence = Rx.Observable.combineLatest(
          aggregationObservable.filter(function(value) { return value['function'] === 'count'; }),
          function(value) {
            return I18n.t('cardTitles.numberOf', value.unit.pluralize());
          });

        var sumTitleSequence = Rx.Observable.combineLatest(
          primaryAmountFieldNameSequence.filter(_.isPresent),
          aggregationObservable.filter(function(value) { return value['function'] === 'sum'; }),
          function(primaryAmountField) {
            return I18n.t('cardTitles.sumOf', primaryAmountField.pluralize());
          });

        var meanTitleSequence = Rx.Observable.combineLatest(
          primaryAmountFieldNameSequence.filter(_.isPresent),
          aggregationObservable.filter(function(value) { return value['function'] === 'mean'; }),
          function(primaryAmountField) {
            return I18n.t('cardTitles.average', primaryAmountField);
          });

        return Rx.Observable.merge(
          countTitleSequence,
          sumTitleSequence,
          meanTitleSequence
        );
      }
    };
  }

  angular.
    module('dataCards.services').
    service('PageHelpersService', PageHelpersService);
})();
