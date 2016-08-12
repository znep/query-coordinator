module.exports = function SingleCardViewController($scope, $rootScope, $log, $window, page, WindowState, rx) {
  const Rx = rx;

  var card$ = page.
    observe('cards').
    map(function(allCards) {
      return allCards[0];
    });
  var globalWhereClauseFragment$ = page.observe('computedWhereClauseFragment');

  /*************************
  * General metadata stuff *
  *************************/

  $scope.page = page;
  $scope.$bindObservable('model', card$);
  $scope.$bindObservable('cardType', card$.observeOnLatest('cardType'));
  $scope.$bindObservable('windowSize', WindowState.windowSize$);

  /*******************************
  * Filters and the where clause *
  *******************************/

  $scope.$bindObservable('globalWhereClauseFragment', globalWhereClauseFragment$);

  // Choropleth doesn't consider map tiles while deciding whether to emit
  // render:complete (by design, as the event is intended for internal timing
  // computation. We don't want to include external services in that).
  // So instead, we wait for all images to finish loading (yeah...).

  // Sequence of render:complete events.
  var renderComplete$ = $rootScope.$eventToObservable('render:complete');

  // Sequence of true/false representing whether or not all images on
  // the page are complete.
  var imagesComplete$ = Rx.Observable.timer(100, 100).map(function() {
    var allImages = $('img');
    // NOTE! The complete property has bugs in Firefox. Fortunately,
    // this should only be running in PhantomJS, which has no problems
    // here.
    return _.every(allImages, _.property('complete'));
  });

  // Sequence like imagesComplete$, but only begins after renderComplete$ emits.
  var imagesCompleteAfterRenderComplete$ = renderComplete$.first().ignoreElements().concat(imagesComplete$);

  // Tell Phantom we're ready, once we get a renderComplete$ AND all images are loaded.
  imagesCompleteAfterRenderComplete$.
    first(_.identity).
    subscribe(function() {
      if (_.isFunction($window.callPhantom)) {
        $window.callPhantom('snapshotReady');
      } else {
        $log.error('Snapshot ready, but a PhantomJS instance is not listening.');
      }
    });

  // Disable mouse interaction to prevent flyouts and hover effects if
  // polaroid is taking a picture of us.
  $scope.interactive = !$window._phantom;
};