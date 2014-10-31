(function() {
  'use strict';

  function SingleCardViewController($scope, AngularRxExtensions, page, fieldName, WindowState) {

    AngularRxExtensions.install($scope);

    var cardObservable = page.
    observe('cards').
    map(function(allCards) {
      var foundCards = _.where(allCards, { fieldName: fieldName });
      if (foundCards > 0) { throw new Error('Multiple cards with the same fieldName: ' + fieldName); }
      return _.first(foundCards);
    }).
    filter(_.identity).
    do(function(cardModel) {
      cardModel.set('expanded', true);
    });

    /*************************
    * General metadata stuff *
    *************************/

    $scope.page = page;
    $scope.bindObservable('card', cardObservable);

    $scope.bindObservable('windowSize', WindowState.windowSizeSubject);

    /*******************************
    * Filters and the where clause *
    *******************************/

    var allCardsFilters = page.observe('cards').flatMap(function(cards) {
      if (!cards) { return Rx.Observable.never(); }
      return Rx.Observable.combineLatest(_.map(cards, function(d) {
        return d.observe('activeFilters');
      }), function() {
        return _.zipObject(_.pluck(cards, 'fieldName'), arguments);
      });
    });

    var allCardsWheres = allCardsFilters.map(function(filters) {
      var wheres = _.map(filters, function(operators, field) {
        if (_.isEmpty(operators)) {
          return null;
        } else {
          return _.invoke(operators, 'generateSoqlWhereFragment', field).join(' AND ');
        }
      });
      return _.compact(wheres).join(' AND ');
    });

    $scope.bindObservable('globalWhereClauseFragment', allCardsWheres.combineLatest(page.observe('baseSoqlFilter'), function(cardWheres, basePageWhere) {
      return _.compact([basePageWhere, cardWheres]).join(' AND ');
    }));

  };

  angular.
    module('dataCards.controllers').
      controller('SingleCardViewController', SingleCardViewController);

})();
