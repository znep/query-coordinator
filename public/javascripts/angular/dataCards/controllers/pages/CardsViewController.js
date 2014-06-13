angular.module('dataCards.controllers').controller('CardsViewController',
  function($scope, AngularRxExtensions, SortedTileLayout, page) {

    // Given a model property name P and an observable sequence of arrays of models having property P,
    // returns an observable sequence of arrays of objects pulling the last value yielded from P next
    // to the model. The elements in the yielded arrays look like:
    // {
    //  <P>: <the last value of P from the model>
    //  model: <the model that yielded the value>
    // }
    function zipLatestArray(obs, property) {
      return obs.flatMapLatest(
        function(values) {
          return Rx.Observable.combineLatest(_.pluck(values, property), function() {
            return _.map(_.zip(values, arguments), function(arr) {
              var r={ model: arr[0] };
              r[property] = arr[1];
              return r;
            });
          });
        }
      );
    };

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
    var layout = new SortedTileLayout();
    var cardLinesBySizeGroup = zipLatestArray(page.cards, 'cardSize').
      map(function(sizedCards) {
        return layout.doLayout(sizedCards);
      });

    $scope.page = page;

    $scope.bindObservable('pageName', page.name.map(function(name) {
      return _.isUndefined(name) ? 'Untitled' : name;
    }));
    $scope.bindObservable('pageDescription', page.description);

    $scope.bindObservable('cardLinesBySizeGroup', cardLinesBySizeGroup);
    $scope.bindObservable('cardSizeNamesInDisplayOrder', cardLinesBySizeGroup.map(function(sizedCards) {
      // Note that this only works because our card sizes ('1', '2', '3', and '4') sort well
      // lexicographically.
      return _.keys(sizedCards).sort();
    }));

    var expandedZipped = zipLatestArray(page.cards, 'expanded');
    var expandedCards = expandedZipped.map(function(cards) {
      return _.pluck(_.filter(cards, 'expanded'), 'model');
    });
    var collapsedCards = expandedZipped.map(function(cards) {
      return _.pluck(_.reject(cards, 'expanded'), 'model');
    });
    $scope.bindObservable('collapsedCards', collapsedCards);
    $scope.bindObservable('expandedCards', expandedCards);
    $scope.bindObservable('useExpandedLayout', expandedCards.map(function(cards) {
      return _.any(cards, 'expanded');
    }));

    $scope.bindObservable('dataset', page.dataset);
    $scope.bindObservable('datasetPages', page.dataset.pluckSwitch('pages'));
    $scope.bindObservable('datasetDaysUnmodified', page.dataset.pluckSwitch('updatedAt').map(function(date) {
      // TODO just a placeholder implementation
      var dayInMillisec = 86400000;
      return Math.floor((Date.now() - date.getTime()) / dayInMillisec);
    }));

    $scope.$on('stickyHeaderAvailableContentHeightChanged', function(event, availableContentHeight) {
      event.stopPropagation();
      $scope.availableContentHeightStyle = {
        'top': availableContentHeight + 'px'
      };
    });
  });
