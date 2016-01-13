const angular = require('angular');
var DYNAMIC_TITLE_CARDTYPE_BLACKLIST = ['table', 'feature', 'search'];

function CardTitleDirective(Dataset, PageHelpersService, ServerConfig) {
  return {
    restrict: 'E',
    scope: {
      'model': '='
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

      var dynamicTitle$ = model$.map(function(model) {
        if (model.page.version <= 3 || !ServerConfig.get('enableDataLensCardLevelAggregation')) {
          return PageHelpersService.dynamicAggregationTitle(model$.pluck('page')).
            map(function(title) {
              return `${_.capitalize(title)} by`;
            });
        } else {
          return PageHelpersService.dynamicCardAggregationTitle(model$).
            map(_.capitalize).
            map(function(title) {
              return `${title} by`;
            });
        }
      }).switchLatest();

      var displayDynamicTitle$ = model$.
        observeOnLatest('cardType').
        map(function(cardType) {
          return !_(DYNAMIC_TITLE_CARDTYPE_BLACKLIST).contains(cardType);
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
}
angular.
  module('dataCards.directives').
  directive('cardTitle', CardTitleDirective);
