var templateUrl = require('angular_templates/dataCards/saveAs.html');
module.exports = function saveAs($window, I18n, WindowState, FlyoutService, ServerConfig, UserRights, rx) {
  const Rx = rx;
  return {
    restrict: 'E',
    scope: {
      showProvenanceSection: '=',
      isEphemeral: '=',
      page: '=',
      savePageAs: '='
    },
    templateUrl: templateUrl,
    link: function($scope, element) {
      var datasetIsPrivate$ = $scope.page.observe('dataset.permissions').
        filter(_.isObject).
        map(_.negate(_.property('isPublic')));

      var userCanApproveNominations$ = Rx.Observable.returnValue(
        ($window.currentUser || {}).hasOwnProperty('rights') &&
          $window.currentUser.rights.indexOf(UserRights.APPROVE_NOMINATIONS) >= 0
      );

      var initialPageVisibility$ = Rx.Observable.of('rejected');

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

      /* END OF COPY from ManageLensDialogVisibilityController.js */

      var saveEvents$ = new Rx.BehaviorSubject({ status: 'idle' });

      $scope.$bindObservable('saveStatus', saveEvents$.pluck('status'));

      // Since we have a flyout handler whose output depends on currentPageSaveEvents,
      // we need to poke the FlyoutService. We want the flyout to update immediately.
      saveEvents$.subscribe(function() {
        FlyoutService.refreshFlyout();
      });

      var $nameInput = element.find('#save-as-name');
      var $descriptionInput = element.find('#save-as-description');

      $scope.defaultNamePlaceholder = 'Enter a name';
      $scope.namePlaceholder = $scope.defaultNamePlaceholder;
      $scope.panelActive = false;
      $scope.name = '';
      $scope.description = '';

      $scope.togglePanel = function togglePanel() {
        $scope.panelActive = !$scope.panelActive;

        // If opening panel, wait for it to appear, then focus name input.
        if ($scope.panelActive) {
          _.defer(function() {
            element.find('#save-as-name').focus();
          });
        }
      };

      var privateDatasetMessage$ = $scope.page.observe('dataset').map(function(dataset) {
        var datasetName = dataset.getCurrentValue('name');
        var sourceDatasetLink = I18n.a(`/d/${dataset.obeId || dataset.id}`);
        var sourceDatasetText = `<a href="${sourceDatasetLink}" target="_blank">${datasetName}</a>`;

        return I18n.t('manageLensDialog.visibility.datasetIsPrivate', sourceDatasetText);
      });
      $scope.$bindObservable('privateDatasetMessage', privateDatasetMessage$);

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

        var hidden;
        var hiddenLookup = {
          approved: false,
          rejected: true
        };

        if (!$scope.visibilityDropdownDisabled) {
          hidden = hiddenLookup[$scope.visibilityDropdownSelection];
        }

        if ($scope.isOfficial) {
          $scope.provenance = 'official';
        }

        if ($scope.name.trim() === '') {
          $nameInput.addClass('form-error').focus();
        } else if ($scope.saveStatus !== 'saving' && $scope.saveStatus !== 'saved') {
          $scope.savePageAs($scope.name.trim(), $scope.description.trim(), hidden, $scope.provenance).
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
          if (!$scope.panelActive || $scope.saveStatus !== 'idle') { return false; }
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
};
