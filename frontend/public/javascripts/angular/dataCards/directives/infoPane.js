const templateUrl = require('angular_templates/dataCards/infoPane.html');
const DOMPurify = require('dompurify');

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

module.exports = function infoPane(ServerConfig, I18n, WindowOperations) {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {
      var dataset$ = $scope.$observe('dataset');

      var sourceDatasetId$ = dataset$.pluck('id');
      var sourceDatasetURL$ = sourceDatasetId$.
        filter(_.isPresent).
        map(function(id) {
          return I18n.a(`/d/${id}`);
        });

      var pageName$ = $scope.page.observe('name').filter(_.isPresent).map(sanitizeUserHtml);
      var pageDescription$ = $scope.page.observe('description').map(sanitizeUserHtml);

      pageName$.subscribe(function(pageName) {
        WindowOperations.setTitle(`${pageName} | ${ServerConfig.get('siteTitle')}`);
      });

      $scope.$bindObservable('sourceDatasetName', dataset$.observeOnLatest('name'));
      $scope.$bindObservable('sourceDatasetURL', sourceDatasetURL$);
      $scope.$bindObservable('pageName', pageName$);
      $scope.$bindObservable('pageDescription', pageDescription$);
    }
  };
};
