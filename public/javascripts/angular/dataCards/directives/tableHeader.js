angular.module('socrataCommon.directives').directive('tableHeader', function(AngularRxExtensions) {
  return {
    templateUrl: '/angular_templates/dataCards/tableHeader.html',
    restrict: 'E',
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);
      element.on('click', '.th', function() {
        scope.safeApply(function() {
          scope.$emit('tableHeader:click', scope.header);
        });

      });
    }
  };
});

