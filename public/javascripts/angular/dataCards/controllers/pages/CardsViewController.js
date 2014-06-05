angular.module('dataCards.controllers').controller('CardsViewController',
  function($scope, AngularRxExtensions, SortedTileLayout, page) {
    AngularRxExtensions.install($scope);
    var cardsInLayout = page.cards.
      flatMap(
        function(cards) {
          // Have array of cards. Want to map to array of [ {card size, card model}, ... ]
          var sizeObservables = _.pluck(cards, 'cardSize');
          var zipped = Rx.Observable.zipArray(sizeObservables);

          var withModel = zipped.map(function(sizes) {
            return _.map(sizes, function(size, i) {
              return {
                cardSize: size,
                model: cards[i]
              };
            });
          });

          return withModel;
        }
      ).
      map(function(sizedCards) {
        return new SortedTileLayout().doLayout(sizedCards);
      });

    $scope.page = page;

    $scope.bindObservable('pageTitle', page.name);
    $scope.bindObservable('pageDescription', page.description);

    $scope.bindObservable('cardLinesBySizeGroup', cardsInLayout);
    $scope.bindObservable('cardSizeNamesInDisplayOrder', cardsInLayout.map(function(sizedCards) {
      // Note that this only works because our card sizes ('1', '2', '3', and '4') sort well
      // lexicographically.
      var sizeNamesInDisplayOrder = _.keys(sizedCards).sort();

      return sizeNamesInDisplayOrder;
    }));
    $scope.cardsForGroup = function(group) { 
      return $scope.pageCardsBySizeGroup[group];
    };

    $scope.bindObservable('dataset', page.dataset);
    $scope.bindObservable('datasetPages', page.dataset.pluckSwitch('pages'));
    $scope.bindObservable('datasetDaysUnmodified', page.dataset.pluckSwitch('updatedAt').map(function(date) {
      // TODO just a placeholder implementation
      var dayInMillisec = 86400000;
      return Math.floor((Date.now() - date.getTime()) / dayInMillisec);
    }));
    $scope.bindObservable('datasetOwner', page.dataset.pluckSwitch('owner'));
  });
