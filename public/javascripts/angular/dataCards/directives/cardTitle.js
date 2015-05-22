(function() {
  'use strict';

  var DYNAMIC_TITLE_CARDTYPE_BLACKLIST = ['table', 'feature', 'search'];

  function CardTitleDirective(PageHelpersService) {
    return {
      restrict: 'E',
      scope: {
        'model': '='
      },
      template: [
        '<div class="title-one-line dynamic-title" ng-show="displayDynamicTitle">{{dynamicTitle}}</div>',
        '<div class="title-one-line custom-title" ng-show="customTitle">{{customTitle}}</div>',
        '<div class="title-one-line">',
          '<div class="wrap card-title">{{title}}</div>',
          '<div class="title-expanded">',
            '<div class="wrap">{{title}}</div>',
          '</div>',
        '</div>'
      ].join(''),

      link: function($scope, element, attrs) {
        var model$ = $scope.$observe('model');
        var pageModel = $scope.model.page;

        var dynamicTitleSequence = PageHelpersService.dynamicAggregationTitle(pageModel).
          map(function(title) {
            return '{0} by'.format(title.capitalize());
          });

        var displayDynamicTitleSequence = model$.
          observeOnLatest('cardType').
          map(function(cardType) {
            return !_(DYNAMIC_TITLE_CARDTYPE_BLACKLIST).contains(cardType);
          });

        $scope.$bindObservable('displayDynamicTitle', displayDynamicTitleSequence);
        $scope.$bindObservable('dynamicTitle', dynamicTitleSequence);
        $scope.$bindObservable(
          'title',
          model$.observeOnLatest('column').
            map(function(column) {
              return column.dataset.extractHumanReadableColumnName(column);
            })
        );
      }
    };
  }
  angular.
    module('dataCards.directives').
    directive('cardTitle', CardTitleDirective);
})();
