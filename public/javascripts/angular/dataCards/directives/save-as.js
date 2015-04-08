(function() {
  'use strict';

  function saveAs($window, AngularRxExtensions, WindowState, FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        hasChanges: '=',
        savePageAs: '='
      },
      templateUrl: '/angular_templates/dataCards/saveAs.html',
      link: function($scope, element, attrs) {
        AngularRxExtensions.install($scope);

        var saveEvents = new Rx.BehaviorSubject({ status: 'idle' });

        $scope.bindObservable('saveStatus', saveEvents.pluck('status'));

        // Since we have a flyout handler whose output depends on currentPageSaveEvents and $scope.hasChanges,
        // we need to poke the FlyoutService. We want the flyout to update immediately.
        saveEvents.subscribe(function() {
          FlyoutService.refreshFlyout();
        });

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
          } else if ($scope.saveStatus !== 'saving' && $scope.saveStatus !== 'saved') {
            $scope.savePageAs($scope.name.trim(), $scope.description.trim()).
              subscribe(saveEvents);
            $scope.bindObservable('saveStatus', Rx.Observable.returnValue('saving'));
          }
        };

        $scope.cancel = function cancel() {
          $scope.panelActive = false;
        };

        WindowState.closeDialogEventObservable.
          filter(function(e) {
            return $scope.panelActive && $(e.target).closest(element).length === 0;
          }).
          takeUntil($scope.observeDestroy(element)).
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

        // We need to make sure that the save-button we're rendering the flyout for is actually
        // our instance of save-button. save-button-flyout-target is not under our control.
        var mySaveButtonScope = element.find('save-button').scope();
        FlyoutService.register('save-button-flyout-target', function(element) {
          var closestSaveButtonScope = $(element).closest('save-button').scope();
          if (closestSaveButtonScope != mySaveButtonScope) { return undefined; }
          if (saveEvents.value.status === 'failed') {
            return '<div class="flyout-title">An error occurred</div><div>Please contact Socrata Support</div>';
          } else if (saveEvents.value.status === 'idle') {
            return '<div class="flyout-title">Click to save your changes as a new page</div>';
          }
        }, $scope.observeDestroy(element));

        $scope.observeDestroy(element).subscribe(function() {
          $scope.$emit('cleaned-up');
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('saveAs', saveAs);

})();
