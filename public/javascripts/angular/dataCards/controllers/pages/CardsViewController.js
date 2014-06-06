angular.module('dataCards.controllers').controller('CardsViewController',
  function($scope, AngularRxExtensions, SortedTileLayout, page) {
    AngularRxExtensions.install($scope);

    // A hash of:
    //  "card size" -> array of rows (which themselves are arrays).
    //
    // For instance:
    // {
    //  "1": [
    //         [ { cardSize: "1", model: <card model> } ]  // There's only one card of size 1, so it sits in its own row.
    //       ],
    //  "2": [
    //         [ { cardSize: "2", model: <card model> },   // There are 5 cards of size 2. Here, they are split up into a
    //           { cardSize: "2", model: <card model> } ], // pair of rows containing resp. 2 and 3 cards.
    //
    //         [ { cardSize: "2", model: <card model> },
    //           { cardSize: "2", model: <card model> },
    //           { cardSize: "2", model: <card model> } ]
    //       ]
    //  }
    var cardLinesBySizeGroup = page.cards.
      flatMap(
        function(cards) {
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

    $scope.bindObservable('cardLinesBySizeGroup', cardLinesBySizeGroup);
    $scope.bindObservable('cardSizeNamesInDisplayOrder', cardLinesBySizeGroup.map(function(sizedCards) {
      // Note that this only works because our card sizes ('1', '2', '3', and '4') sort well
      // lexicographically.
      return _.keys(sizedCards).sort();
    }));
    var expandedCards = page.cards.
      flatMapLatest(
        function(cards) {
          return Rx.Observable.combineLatest(_.pluck(cards, 'expanded'), function() {
            return _.reduce(arguments, function(acc, v, i) {
              if (v) {
                acc.push(cards[i]);
              }
              return acc;
            }, []);
          });
        }
      );
    var collapsedCards = page.cards.
      flatMapLatest(
        function(cards) {
          return Rx.Observable.combineLatest(_.pluck(cards, 'expanded'), function() {
            return _.reduce(arguments, function(acc, v, i) {
              if (!v) {
                acc.push(cards[i]);
              }
              return acc;
            }, []);
          });
        }
      );
    $scope.bindObservable('collapsedCards', collapsedCards);
    $scope.bindObservable('expandedCards', expandedCards);
    $scope.bindObservable('useExpandedLayout', page.cards.flatMapLatest(function(cards) {
      return Rx.Observable.combineLatest(_.pluck(cards, 'expanded'), function() {
        return _.any(arguments);
      });
    }));

    $scope.bindObservable('dataset', page.dataset);
    $scope.bindObservable('datasetPages', page.dataset.pluckSwitch('pages'));
    $scope.bindObservable('datasetDaysUnmodified', page.dataset.pluckSwitch('updatedAt').map(function(date) {
      // TODO just a placeholder implementation
      var dayInMillisec = 86400000;
      return Math.floor((Date.now() - date.getTime()) / dayInMillisec);
    }));
  });
