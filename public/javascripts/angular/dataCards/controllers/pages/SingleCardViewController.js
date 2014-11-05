(function() {
  'use strict';

  function SingleCardViewController($scope, $rootScope, $log, AngularRxExtensions, page, fieldName, WindowState) {

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

    // Choropleth doesn't consider map tiles while deciding whether to emit
    // render:complete (by design, as the event is intended for internal timing
    // computation. We don't want to include external services in that).
    // The event for choropleth is render:mapTilesLoaded.
    // Simply count render starts and ends, and render when count becomes
    // equal.

    $rootScope.eventToObservable('render:start').dump('rs');
    $rootScope.eventToObservable('render:complete').dump('rc');
    $rootScope.eventToObservable('render:mapTilesLoading').dump('ts');
    $rootScope.eventToObservable('render:mapTilesLoaded').dump('tc');
    var outstandingNormalRenders = Rx.Observable.merge(
      $rootScope.eventToObservable('render:start').map(_.constant(1)),
      $rootScope.eventToObservable('render:complete').map(_.constant(-1))
    ).scan(0, function(acc, val) { return acc + val; });
    var outstandingChoroplethRenders = Rx.Observable.merge(
      $rootScope.eventToObservable('render:mapTilesLoading').map(_.constant(1)),
      $rootScope.eventToObservable('render:mapTilesLoaded').map(_.constant(-1))
    ).scan(0, function(acc, val) { return acc + val; });

    var renderComplete = Rx.Observable.combineLatest(
      outstandingNormalRenders,
      outstandingChoroplethRenders,
      function(normal, choro) {
        return (normal === 0) && (choro === 0);
      }).filter(_.identity);
    renderComplete.dump('rcomp');

    renderComplete.
      merge(Rx.Observable.timer(1000)). // 1-sec timeout
      first().
      subscribe(function() {
        if (_.isFunction(window.callPhantom)) {
          callPhantom('snapshotReady');
        } else {
          $log.error('Snapshot ready, but a PhantomJS instance is not listening.');
        }
      });

  };

  angular.
    module('dataCards.controllers').
      controller('SingleCardViewController', SingleCardViewController);

})();
