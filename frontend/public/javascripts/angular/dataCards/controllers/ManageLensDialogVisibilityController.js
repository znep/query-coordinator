module.exports = function ManageLensDialogVisibilityController($q, $scope, $window, ServerConfig, UserRights, I18n, http, rx) {
  const Rx = rx;
  var self = this;

  // This function provides a description of the entity making the request to the http() service.
  // The requester object is expected present in the config options passed to http(), and it is expected
  // that the requester object expose a requesterLabel function that returns the descriptive string.
  self.requesterLabel = function() {
    return 'ManageLensDialogVisibilityController';
  };

  var datasetIsPrivate$ = $scope.page.observe('dataset.permissions').
    filter(_.isObject).
    map(_.negate(_.property('isPublic')));

  var userCanApproveNominations$ = Rx.Observable.returnValue(
    _.get($window.currentUser || {}, 'rights', []).indexOf(UserRights.APPROVE_NOMINATIONS) >= 0
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

  Rx.Observable.subscribeLatest(
    datasetIsPrivate$,
    userCanApproveNominations$,
    $scope.page.observe('dataset'),
    function(datasetIsPrivate, userCanApproveNominations, dataset) {
      if (datasetIsPrivate) {
        var datasetName = dataset.getCurrentValue('name');
        var sourceDatasetLink = I18n.a(`/d/${dataset.obeId || dataset.id}`);
        var sourceDatasetText = `<a href="${sourceDatasetLink}" target="_blank">${datasetName}</a>`;

        $scope.visibilityDropdownError = I18n.t('manageLensDialog.visibility.datasetIsPrivate', sourceDatasetText);
      } else if (!userCanApproveNominations) {
        $scope.visibilityDropdownError = I18n.manageLensDialog.visibility.userIsUnprivileged;
      }
    }
  );

  if ($scope.usingViewModeration) {
    $scope.visibilityDropdownStrings = {
      approved: I18n.manageLensDialog.visibility.viewModerationApproved,
      rejected: I18n.manageLensDialog.visibility.viewModerationRejected,
      pending: I18n.manageLensDialog.visibility.viewModerationPending
    };
  } else {
    $scope.visibilityDropdownStrings = {
      approved: I18n.manageLensDialog.visibility.shown,
      rejected: I18n.manageLensDialog.visibility.hidden
    };
  }

  var save = function() {
    if (!$scope.components.visibility.hasChanges) {
      return $q.when(null);
    }

    var visibility = $scope.visibilityDropdownSelection === 'approved' ? 'yes' : 'no';

    var url = `/admin/views/${$scope.page.id}/set/${visibility}.json`;

    return http.post(url, null, { requester: self });
  };

  var postSave = function() {
    $scope.page.set('moderationStatus', $scope.visibilityDropdownSelection === 'approved');
    $scope.page.set('hideFromCatalog', $scope.visibilityDropdownSelection != 'approved');
    $scope.page.set('hideFromDataJson', $scope.visibilityDropdownSelection != 'approved');
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
};
