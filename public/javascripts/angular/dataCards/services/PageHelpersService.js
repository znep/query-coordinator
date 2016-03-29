module.exports = function PageHelpersService(I18n, PluralizeService, rx) {
  const Rx = rx;
  return {
    dynamicCardAggregationTitle: function(cardModel$) {
      return Rx.Observable.combineLatest(
        cardModel$.observeOnLatest('aggregation'),
        cardModel$.observeOnLatest('page.dataset.columns'),
        function(aggregation, columns) {
          if (aggregation['function'] === 'count') {
            return I18n.t('cardTitles.numberOf', PluralizeService.pluralize(aggregation.unit));
          }

          var columnName = _.get(columns, `${aggregation.fieldName}.name`);

          if (aggregation['function'] === 'sum') {
            return I18n.t('cardTitles.sumOf', PluralizeService.pluralize(columnName));
          } else if (aggregation['function'] === 'mean') {
            return I18n.t('cardTitles.average', columnName);
          }
        }
      );
    }
  };
};
