var dataCards = angular.module('dataCards', [
  'ui.router',
  'socrataCommon.services',
  'socrataCommon.directives',
  'socrataCommon.services',
  'dataCards.controllers',
  'dataCards.directives',
  'dataCards.models',
  'leaflet-directive'
  // 'pasvaz.bindonce' NOTE: use in the future to optimize Angular performance.
]);

/**
 * Configure app analytics tracking
 */
dataCards.run(function($window, $rootScope, Analytics) {
  Analytics.measureDomReady();

  $rootScope.$on('layout:changed', function() {
    Analytics.setNumberOfCards(0);
  });
  $rootScope.$on('cardType', function(event, cardType) {
    var renderedCards = ['column', 'timeline', 'choropleth', 'table'];
    if(_(renderedCards).contains(cardType)) {
      Analytics.incrementNumberOfCards();
    }
  });
  function onEventStart(label) {
    return function() {
      Analytics.start(label);
    }
  }

  $rootScope.$on('render:start', function(event, id, timestamp) {
    Analytics.cardRenderStart(id, timestamp);
  });

  $rootScope.$on('render:complete', function(event, id, timestamp) {
    Analytics.cardRenderStop(id, timestamp);
  });

  $rootScope.$on('timeline-chart:filter-changed', onEventStart('timeline-filter'));
  $rootScope.$on('timeline-chart:filter-cleared', onEventStart('clear-filter'));
  $rootScope.$on('dataset-filter:choropleth', onEventStart('region-filter'));
  $rootScope.$on('dataset-filter-clear:choropleth', onEventStart('clear-filter'));
  $rootScope.$on('column-chart:datum-clicked', function(event, data) {
    var label = data.special ? 'clear-filter' : 'bar-filter';
    var eventFn = onEventStart(label);
    eventFn();
  });
});

dataCards.config(function($provide, $stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider.
    state('404', {
      template: '<h1>404</h1>You probably wanted something, but have this kitten instead: <br /><soc-kitten w="800" h="600"></soc-kitten>'
    }).
    state('view', {
      template: '<!--Overall chrome--><div ui-view="mainContent"><div>',
      params: ['id'],
      resolve: {
        page: function($stateParams, Page) {
          return new Page($stateParams['id']);
        }
      }
    }).
    state('view.cards', {
      views: {
        'mainContent': {
          //TODO figure out a way of getting the template dir out of rails.
          templateUrl: '/angular_templates/dataCards/pages/cards-view.html',
          controller: 'CardsViewController'
        }
      }
    });
});

dataCards.run(function($location, $log, $rootScope, $state, DeveloperOverrides) {
  // Shamelessly lifted from http://www.joezimjs.com/javascript/3-ways-to-parse-a-query-string-in-a-url/
  var parseQueryString = function( queryString ) {
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }

    return params;
  };

  var queryObject = parseQueryString(decodeURIComponent(window.location.search.substr(1)));
  DeveloperOverrides.setOverridesFromString(queryObject['override_dataset_data']);

  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    $log.error("Error encountered during state transition:", error);
  });

  // Determine the initial view from the URL.
  var id = location.pathname.match(/\/\w{4}-\w{4}$/);
  if (_.isEmpty(id)) {
    $state.go('404');
  } else {
    $state.go('view.cards', {
      id: id[0]
    });
  }
});
