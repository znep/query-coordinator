var templateUrl = require('angular_templates/dataCards/lensType.html');

module.exports = function lensType(ServerConfig) {
  return {
    templateUrl: templateUrl,
    restrict: 'E',
    scope: true,
    link: function($scope) {
      // CORE-7419: If enable_data_lens_provenance is false, assume all data lenses are official
      const enableDataLensProvenance = ServerConfig.get('enable_data_lens_provenance');

      // EN-16509: Respect disable_authority_badge feature flag. The feature flag refers to 'official' as
      // 'official2' so we translate it below.
      const disableAuthorityBadgeFromConfig = ServerConfig.get('disable_authority_badge');
      const disableAuthorityBadge = disableAuthorityBadgeFromConfig === 'official2' ?
        'official' : disableAuthorityBadgeFromConfig;

      $scope.$bindObservable('lensType', $scope.page.observe('provenance').map((provenance) => {
        if (!enableDataLensProvenance) {
          provenance = 'official';
        }

        // If either 'all' or the current provenance matches the feature flag value, nuke provenance.
        if (_.includes(['all', provenance], disableAuthorityBadge)) {
          return null;
        } else {
          return provenance;
        }
      }));
    }
  };
};
