angular.module('dataCards.controllers') .controller('CardsViewController',
  function($scope, $location, page) {
    $scope.page = page;

    $scope.bindObservable('pageTitle', page.name);
    $scope.bindObservable('pageDescription', page.description);
    $scope.bindObservable('pageCards', page.cards);

    $scope.bindObservable('dataset', page.dataset);
    $scope.bindObservable('datasetPages', page.dataset.pluck('pages').switch());
    $scope.bindObservable('datasetDaysUnmodified', page.dataset.pluck('updatedAt').switch().map(function(date) {
      // TODO just a placeholder implementation
      var dayInMillisec = 86400000;
      return Math.floor((Date.now() - date.getTime()) / dayInMillisec);
    }));
    $scope.bindObservable('datasetOwner', page.dataset.pluck('owner').switch());
  });
