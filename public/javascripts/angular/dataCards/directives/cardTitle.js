module.exports = function CardTitleDirective(Constants, Dataset, PageHelpersService) {
  return {
    restrict: 'E',
    scope: {
      model: '='
    },
    template: [
      '<div class="title-one-line dynamic-title" ng-show="displayDynamicTitle">{{dynamicTitle}}</div>',
      '<div class="title-one-line custom-title" ng-show="customTitle" ng-bind-html="customTitle"></div>',
      '<div class="title-one-line" ng-hide="customTitle">',
      '  <div class="wrap card-title">{{title}}</div>',
      '  <div class="title-expanded">',
      '    <div class="wrap">{{title}}</div>',
      '  </div>',
      '</div>'
    ].join(''),

    link: function($scope) {
      var model$ = $scope.$observe('model').filter(_.isPresent);
      var customTitle$ = model$.observeOnLatest('customTitle');

      var dynamicTitle$ = PageHelpersService.dynamicCardAggregationTitle(model$).
        map(_.upperFirst).
        map(function(title) {
          return `${title} by`;
        });

      var displayDynamicTitle$ = model$.
        observeOnLatest('cardType').
        map(function(cardType) {
          return !_.includes(Constants.AGGREGATION_CARDTYPE_BLACKLIST, cardType);
        });

      $scope.$bindObservable('customTitle', customTitle$);
      $scope.$bindObservable('displayDynamicTitle', displayDynamicTitle$);
      $scope.$bindObservable('dynamicTitle', dynamicTitle$);
      $scope.$bindObservable(
        'title',
        model$.observeOnLatest('column').
          map(Dataset.extractHumanReadableColumnName)
      );
    }
  };
};
