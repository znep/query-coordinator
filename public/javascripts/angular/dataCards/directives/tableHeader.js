(function() {

  'use strict';

  function tableHeaderDirectiveFactory(AngularRxExtensions) {

    return {
      templateUrl: '/angular_templates/dataCards/tableHeader.html',
      restrict: 'E',
      replace: true,
      link: function(scope, element, attrs) {
        AngularRxExtensions.install(scope);
        element.on('click', function(e) {
          if (e.target.className === 'resize') return;

          scope.safeApply(function() {
            scope.$emit('tableHeader:click', scope.header);
          });

        });
      }
    };

  }

  angular.
    module('socrataCommon.directives').
    directive('tableHeader', tableHeaderDirectiveFactory);

})();
