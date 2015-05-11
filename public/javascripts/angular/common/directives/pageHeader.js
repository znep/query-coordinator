(function() {
  'use strict';

  var DEFAULT_LOGO_URL = '/stylesheets/images/common/socrata_logo_white.png';

  var DEFAULT_VALUES = {
    'sign_in': { label: 'Sign In', url: '/login?referer_redirect=1' },
    'sign_out': { label: 'Sign Out', url: '/logout' },
    'sign_up': { label: 'Sign Up', url: '/signup?referer_redirect=1' }
  };

  function pageHeader(AngularRxExtensions, ServerConfig) {
    return {
      restrict: 'E',
      templateUrl: '/angular_templates/common/pageHeader.html',
      link: function($scope) {
        AngularRxExtensions.install($scope);

        var theme = ServerConfig.getTheme();

        function buildLinkValue(theme, key) {
          var defaultValues = DEFAULT_VALUES[key];
          return _.defaults(
            {},
            { label: _.get(theme, key, defaultValues.label) },
            defaultValues
          );
        }

        var signIn = buildLinkValue(theme, 'sign_in');
        var signOut = buildLinkValue(theme, 'sign_out');
        var signUp = buildLinkValue(theme, 'sign_up');
        var logoUrl = _.get(theme, 'logo_url', DEFAULT_LOGO_URL);
        var pageHeaderStyle = {
          'background-color' : _.get(theme, 'header_background_color')
        };

        $scope.logoUrl = logoUrl;
        $scope.signUp = signUp;
        $scope.signIn = signIn;
        $scope.signOut = signOut;
        $scope.pageHeaderStyle = pageHeaderStyle;
      }
    };
  }

  angular.
    module('socrataCommon.directives').
    directive('pageHeader', pageHeader);

})();
