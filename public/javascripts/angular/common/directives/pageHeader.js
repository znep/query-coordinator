(function() {
  'use strict';

  // TODO: Check CS wiki and craft documentation around functionality

  var DEFAULT_VALUES = {
    'sign_in': { label: 'Sign In', url: '/login?referer_redirect=1' },
    'sign_out': { label: 'Sign Out', url: '/logout' },
    'sign_up': { label: 'Sign Up', url: '/signup?referer_redirect=1' }
  };

  function pageHeader(AngularRxExtensions, ConfigurationsService) {
    return {
      restrict: 'E',
      templateUrl: '/angular_templates/common/pageHeader.html',
      link: function($scope) {
        AngularRxExtensions.install($scope);

        var themeObservable = ConfigurationsService.getThemeConfigurationsObservable();

        var logoObservable = themeObservable.map(function(configuration) {
          return _.instead(
            ConfigurationsService.getConfigurationValue(configuration, 'logo_url'),
            '/stylesheets/images/common/socrata_logo.png');
        });

        function buildUrlStreamValue(configuration, labelKey, defaultValue) {
          return _.defaults({}, {
            label: ConfigurationsService.getConfigurationValue(configuration, labelKey)
          }, defaultValue);
        }

        var signInObservable = themeObservable.map(function(configuration) {
          return buildUrlStreamValue(
            configuration,
            'sign_in',
            DEFAULT_VALUES['sign_in']);
        });

        var signOutObservable = themeObservable.map(function(configuration) {
          return buildUrlStreamValue(
            configuration,
            'sign_out',
            DEFAULT_VALUES['sign_out']);
        });

        var signUpObservable = themeObservable.map(function(configuration) {
          return buildUrlStreamValue(
            configuration,
            'sign_up',
            DEFAULT_VALUES['sign_up']);
        });

        $scope.bindObservable('logoUrl', logoObservable);
        $scope.bindObservable('signUp', signUpObservable);
        $scope.bindObservable('signIn', signInObservable);
        $scope.bindObservable('signOut', signOutObservable);
      }
    };
  }

  angular.
    module('socrataCommon.directives').
    directive('pageHeader', pageHeader);

})();
