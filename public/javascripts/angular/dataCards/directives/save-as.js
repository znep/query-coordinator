(function() {
  'use strict';

  function saveAs($window, WindowState, FlyoutService, ServerConfig) {
    return {
      restrict: 'E',
      scope: {
        hasChanges: '=',
        savePageAs: '=',
        isEphemeral: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/saveAs.html',
      link: function($scope, element) {
        var datasetIsPrivate$ = $scope.page.observe('dataset.permissions').
          filter(_.isObject).
          map(_.negate(_.property('isPublic')));

        var userCanApproveNominations$ = Rx.Observable.returnValue(
          (currentUser || {}).hasOwnProperty('rights') &&
            currentUser.rights.indexOf('approve_nominations') >= 0
        );

        $scope.usingViewModeration = ServerConfig.getFeatureSet().view_moderation;

        var initialPageVisibility$ = Rx.Observable.of($scope.usingViewModeration ? 'pending' : 'rejected');

        $scope.$bindObservable('datasetIsPrivate', datasetIsPrivate$);
        $scope.$bindObservable('initialPageVisibility', initialPageVisibility$);
        $scope.$bindObservable('visibilityDropdownSelection', initialPageVisibility$);

        // Disable visibility dropdown if dataset is private or user does not have
        // 'approve_nominations' privileges
        $scope.$bindObservable('visibilityDropdownDisabled',
          Rx.Observable.combineLatest(
            datasetIsPrivate$,
            userCanApproveNominations$,
            function(datasetIsPrivate, userCanApproveNominations) {
              return datasetIsPrivate || !userCanApproveNominations;
            }
          )
        );

        /* END OF COPY from ManageLensDialogV2VisibilityController.js */

        var saveEvents$ = new Rx.BehaviorSubject({ status: 'idle' });

        $scope.$bindObservable('saveStatus', saveEvents$.pluck('status'));

        // Since we have a flyout handler whose output depends on currentPageSaveEvents and $scope.hasChanges,
        // we need to poke the FlyoutService. We want the flyout to update immediately.
        saveEvents$.subscribe(function() {
          FlyoutService.refreshFlyout();
        });

        var $saveAsButton = element.find('.save-as-button');
        var $nameInput = element.find('#save-as-name');
        var $descriptionInput = element.find('#save-as-description');

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

          // These checks are a workaround for IE9, which apparently
          // does not update scope variables when they are bound via ng-model?
          // (Verify this by checking the .val() of $nameInput against
          // $scope.name, which is bound to the input element in the
          // markup.)
          $scope.name = $nameInput.val();
          $scope.description = $descriptionInput.val();

          var $visibilityDropdown = element.find('#save-as-visibility select');
          $scope.visibilityDropdownSelection = $visibilityDropdown.val();

          var moderationStatus;
          var moderationStatusLookup = {
            approved: true,
            rejected: false,
            pending: null
          };
          if (!$scope.visibilityDropdownDisabled) {
            moderationStatus = moderationStatusLookup[$scope.visibilityDropdownSelection];
          }

          if ($scope.name.trim() === '') {
            $nameInput.addClass('form-error').focus();
          } else if ($scope.saveStatus !== 'saving' && $scope.saveStatus !== 'saved') {
            $scope.savePageAs($scope.name.trim(), $scope.description.trim(), moderationStatus).
              subscribe(saveEvents$);
            $scope.$bindObservable('saveStatus', Rx.Observable.returnValue('saving'));
          }
        };

        $scope.cancel = function cancel() {
          $scope.panelActive = false;
        };

        // Hide the flannel when pressing escape or clicking outside the
        // tool-panel-main element.  Clicking on the button has its own
        // toggling behavior so it is excluded from this logic.
        WindowState.closeDialogEvent$.
          filter(function(e) {
            if (!$scope.panelActive) { return false; }
            if (e.type === 'keydown') { return true; }

            var $target = $(e.target);
            var targetInsideFlannel = $target.closest('.tool-panel-main').length > 0;
            var targetIsButton = $target.is($(element).find('.tool-panel-toggle-btn'));
            return !targetInsideFlannel && !targetIsButton;
          }).
          takeUntil($scope.$destroyAsObservable(element)).
          subscribe(function() {
            $scope.$safeApply(function() {
              $scope.panelActive = false;
            });
          });

        $nameInput.
          on('keyup', function() {
            if ($nameInput.val().length > 0) {
              $nameInput.removeClass('form-error');
            }
          });

        $scope.$destroyAsObservable(element).subscribe(function() {
          $scope.$emit('cleaned-up');
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('saveAs', saveAs);

})();
