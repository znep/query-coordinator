(function() {
  'use strict';

  function ManageLensDialogV2VisibilityController($scope, ServerConfig, http, $q) {
    var self = this;

    // This function provides a description of the entity making the request to the http() service.
    // The requester object is expected present in the config options passed to http(), and it is expected
    // that the requester object expose a requesterLabel function that returns the descriptive string.
    self.requesterLabel = function() {
      return 'ManageLensDialogV2VisibilityController';
    };

    var datasetIsPrivate$ = $scope.page.observe('dataset.permissions').
      filter(_.isObject).
      map(_.negate(_.property('isPublic')));

    var userCanApproveNominations$ = Rx.Observable.returnValue(
      typeof currentUser !== 'undefined' &&
        typeof currentUser.rights !== 'undefined' &&
        currentUser.rights.indexOf('approve_nominations') >= 0
    );

    var moderationStatus$ = $scope.page.observe('moderationStatus');

    var pageVisibility$ = moderationStatus$.map(function(moderationStatus) {
      if ($scope.usingViewModeration && !_.isPresent(moderationStatus)) {
        return 'pending';
      }

      return moderationStatus ? 'approved' : 'rejected';
    });

    var initialPageVisibility$ = pageVisibility$.take(1);

    var visibilityDropdownSelection$ = $scope.$observe('visibilityDropdownSelection');

    $scope.usingViewModeration = ServerConfig.getFeatureSet().view_moderation;

    // Set initial value of visibility dropdown selection
    $scope.$bindObservable('initialPageVisibility', initialPageVisibility$);
    $scope.$bindObservable('visibilityDropdownSelection', initialPageVisibility$);

    $scope.$bindObservable('datasetIsPrivate', datasetIsPrivate$);
    $scope.$bindObservable('userCanApproveNominations', userCanApproveNominations$);

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

    var save = function() {
      if (!$scope.components.visibility.hasChanges) {
        return $q.when(null);
      }

      var visibility = $scope.visibilityDropdownSelection === 'approved' ? 'yes' : 'no';

      var url = '/admin/views/{0}/set/{1}.json'.format(
        $scope.page.id,
        visibility
      );

      return http.post(url, null, { requester: self });
    };

    var postSave = function() {
      $scope.page.set('moderationStatus', $scope.visibilityDropdownSelection === 'approved');
    };

    Rx.Observable.subscribeLatest(
      visibilityDropdownSelection$.skip(1),
      initialPageVisibility$,
      function(currentVisibility, initialVisibility) {
        $scope.components.visibility.hasChanges = currentVisibility !== initialVisibility;
      }
    );

    $scope.components.visibility = {
      save: save,
      postSave: postSave,
      hasChanges: false,
      hasErrors: false
    };
  }

  angular.
    module('dataCards.controllers').
    controller('ManageLensDialogV2VisibilityController', ManageLensDialogV2VisibilityController);

})();
