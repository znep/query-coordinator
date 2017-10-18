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

  var hideFromCatalog$ = $scope.page.observe('hideFromCatalog');
  var hideFromDataJson$ = $scope.page.observe('hideFromDataJson');

  var pageVisibility$ = Rx.Observable.combineLatest(
    hideFromCatalog$,
    hideFromDataJson$,
    function(hideFromCatalog, hideFromDataJson) {
      return (hideFromCatalog || hideFromDataJson) ? 'rejected' : 'approved';
    });

  var initialPageVisibility$ = pageVisibility$.take(1);

  var visibilityDropdownSelection$ = $scope.$observe('visibilityDropdownSelection');

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

  $scope.visibilityDropdownStrings = {
    approved: I18n.manageLensDialog.visibility.shown,
    rejected: I18n.manageLensDialog.visibility.hidden
  };

  var save = function() {
    if (!$scope.components.visibility.hasChanges) {
      return $q.when(null);
    }

    var hidden = $scope.visibilityDropdownSelection === 'approved' ? 'false' : 'true';

    var url = `/admin/views/${$scope.page.id}/hide/${hidden}.json`;

    return http.post(url, null, { requester: self });
  };

  var postSave = function() {
    $scope.page.set('hideFromCatalog', $scope.visibilityDropdownSelection === 'rejected');
    $scope.page.set('hideFromDataJson', $scope.visibilityDropdownSelection === 'rejected');
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
