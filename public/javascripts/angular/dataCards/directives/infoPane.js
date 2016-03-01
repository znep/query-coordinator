const templateUrl = require('angular_templates/dataCards/infoPane.html');
const angular = require('angular');

function sanitizeUserHtml(htmlString) {
  if (!_.isString(htmlString) || htmlString.length === 0) {
    return htmlString;
  }

  var allowedTags = ['a', 'b', 'br', 'div', 'em', 'hr', 'i', 'p', 'span', 'strong', 'sub', 'sup', 'u'];
  var allowedAttr = ['href', 'target', 'rel'];

  return DOMPurify.sanitize(htmlString, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttr
  });
}

function infoPane(ServerConfig, I18n, WindowOperations) {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {
      var dataset$ = $scope.$observe('dataset');

      var sourceDatasetURL$ = dataset$.
        pluck('obeId').
        filter(_.isPresent).
        map(function(obeId) {
          return I18n.a(`/d/${obeId}`);
        });

      var pageName$ = $scope.page.observe('name').filter(_.isPresent).map(sanitizeUserHtml);
      var pageDescription$ = $scope.page.observe('description').map(sanitizeUserHtml);

      pageName$.subscribe(function(pageName) {
        WindowOperations.setTitle(`${pageName} | Socrata`);
      });

      $scope.shouldShowExportMenu = ServerConfig.get('enableDataLensExportMenu');
      $scope.showOtherViewsButton = ServerConfig.get('enableDataLensOtherViews');
      $scope.$bindObservable('datasetPages', dataset$.observeOnLatest('pages'));
      $scope.$bindObservable('sourceDatasetName', dataset$.observeOnLatest('name'));
      $scope.$bindObservable('sourceDatasetURL', sourceDatasetURL$);
      $scope.$bindObservable('pageName', pageName$);
      $scope.$bindObservable('pageDescription', pageDescription$);
    }
  };
}

angular.
  module('dataCards.directives').
  directive('infoPane', infoPane);
