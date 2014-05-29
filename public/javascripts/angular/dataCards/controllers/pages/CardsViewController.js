angular.module('dataCards.controllers') .controller('CardsViewController',
  function($scope, AngularRxExtensions, page) {
    AngularRxExtensions.install($scope);

    $scope.page = page;

    $scope.bindObservable('pageTitle', page.name);
    $scope.bindObservable('pageDescription', page.description);
    $scope.bindObservable('pageCards', page.cards);

    $scope.bindObservable('dataset', page.dataset);
    $scope.bindObservable('datasetPages', page.dataset.pluckSwitch('pages'));
    $scope.bindObservable('datasetDaysUnmodified', page.dataset.pluckSwitch('updatedAt').map(function(date) {
      // TODO just a placeholder implementation
      var dayInMillisec = 86400000;
      return Math.floor((Date.now() - date.getTime()) / dayInMillisec);
    }));
    $scope.bindObservable('datasetOwner', page.dataset.pluckSwitch('owner'));
  });
