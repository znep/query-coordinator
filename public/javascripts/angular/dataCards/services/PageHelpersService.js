(function() {
  'use strict';

  function PageHelpersService(Assert, Page) {
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
            return 'number of {0}'.format(value.unit.pluralize());
          });

        var sumTitleSequence = Rx.Observable.combineLatest(
          primaryAmountFieldNameSequence.filter(_.isPresent),
          aggregationObservable.filter(function(value) { return value['function'] === 'sum'; }),
          function(primaryAmountField) {
            return 'sum of {0}'.format(primaryAmountField.pluralize());
          });

        var meanTitleSequence = Rx.Observable.combineLatest(
          primaryAmountFieldNameSequence.filter(_.isPresent),
          aggregationObservable.filter(function(value) { return value['function'] === 'mean'; }),
          function(primaryAmountField) {
            return 'average {0}'.format(primaryAmountField);
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
