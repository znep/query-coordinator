(function() {

  'use strict';

  function saveAs($window, AngularRxExtensions, WindowState) {
    return {
      restrict: 'E',
      scope: {
        hasChanges: '=pageHasChanges',
        saveAs: '=savePageAs'
      },
      templateUrl: '/angular_templates/dataCards/saveAs.html',
      link: function($scope, element, attrs) {
        AngularRxExtensions.install($scope);
        var $nameInput = element.find('#save-as-name');
        var $document = $($window.document);

        $scope.defaultNamePlaceholder = 'Enter a name';
        $scope.namePlaceholder = $scope.defaultNamePlaceholder;
        $scope.panelActive = false;
        $scope.name = '';
        $scope.description = '';
        $scope.save = function save() {
          if ($scope.name.trim() === '') {
            $nameInput.addClass('form-error').focus();
          } else {
            $scope.panelActive = false;
            $scope.saveAs($scope.name.trim(), $scope.description.trim());
          }
        };

        $scope.cancel = function cancel() {
          $scope.panelActive = false;
        };

        WindowState.mouseLeftButtonClickSubject.
          filter(function(e) {
            return $scope.panelActive && $(e.target).closest(element).length === 0;
          }).
          subscribe(function() {
            $scope.safeApply(function() {
              $scope.panelActive = false;
            });
          });

        $nameInput.
          on('keyup', function() {
            if ($nameInput.val().length > 0) {
              $nameInput.removeClass('form-error');
            }
          });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('saveAs', saveAs);

})();
