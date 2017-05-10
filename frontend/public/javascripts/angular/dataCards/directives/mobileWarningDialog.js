var templateUrl = require('angular_templates/dataCards/mobileWarningDialog.html');

module.exports = function mobileWarningDialog() {
  return {
    restrict: 'E',
    scope: {
      dialogState: '='
    },
    templateUrl: templateUrl
  };
};
