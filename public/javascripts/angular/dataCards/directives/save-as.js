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

        var saveEvents = new Rx.BehaviorSubject({ status: 'idle' });

        $scope.bindObservable('saveStatus', saveEvents.pluck('status'));

        var $saveAsButton = element.find('.save-as-button');
        var $nameInput = element.find('#save-as-name');
        var $descriptionInput = element.find('#save-as-description');
        var $document = $($window.document);

        $scope.defaultNamePlaceholder = 'Enter a name';
        $scope.namePlaceholder = $scope.defaultNamePlaceholder;
        $scope.panelActive = false;
        $scope.name = '';
        $scope.description = '';

        $scope.conditionallyShowPanel = function conditionallyShowPanel() {
          if (!$saveAsButton.hasClass('disabled')) {
            $scope.panelActive = !$scope.panelActive;
          }
        };

        $scope.save = function save() {

          // These two checks are a workaround for IE9, which apparently
          // does not update scope variables when they are bound via ng-model?
          // (Verify this by checking the .val() of $nameInput against
          // $scope.name, which is bound to the input element in the
          // markup.)
          $scope.name = $nameInput.val();
          $scope.description = $descriptionInput.val();

          if ($scope.name.trim() === '') {
            $nameInput.addClass('form-error').focus();
          } else {
            $scope.saveAs($scope.name.trim(), $scope.description.trim()).
              subscribe(saveEvents);
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
