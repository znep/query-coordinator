(function() {
  'use strict';

  var dependencies = [
    'ui.router',
    'ngSanitize',
    'btford.markdown',
    'monospaced.elastic',
    'socrataCommon.services',
    'socrataCommon.decorators',
    'socrataCommon.directives',
    'socrataCommon.filters',
    'dataCards.controllers',
    'dataCards.services',
    'dataCards.directives',
    'dataCards.models',
    'dataCards.filters',
    'rx'
  ];

  if (window.socrataConfig.enableAirbrakeJs) {
    dependencies.push('exceptionNotifier');
  }

  var dataCards = angular.module('dataCards', dependencies);

  dataCards.config(function(ServerConfig, $httpProvider) {
    ServerConfig.setup(window.socrataConfig);

    // Automatically add the app token header to requests done through $http.
    // NOTE: This does not work for requests made through some other means.
    $httpProvider.defaults.headers.common['X-App-Token'] = ServerConfig.get('dataCardsAppToken');
  });

  /**
   * Configure app analytics tracking
   */
  dataCards.run(function($window, $rootScope, Analytics) {
    Analytics.measureDomReady();

    // The analytics controller can use knowledge of when user interactions happen
    // to make more accurate measurements of page load time and user interactions.
    // The more we can give it the better, but it's critical that this event never
    // fire unless the user really did do an action (otherwise the reported timings
    // will be very inaccurate).
    var intentionalUserActions = Rx.Observable.merge(
      $rootScope.$eventToObservable('timeline-chart:filter-changed'),
      $rootScope.$eventToObservable('timeline-chart:filter-cleared'),
      $rootScope.$eventToObservable('datset-filter:choropleth'),
      $rootScope.$eventToObservable('dataset-filter-clear:choropleth'),
      $rootScope.$eventToObservable('column-chart:datum-clicked'),
      $rootScope.$eventToObservable('page:dirtied'),
      Rx.Observable.fromEvent($($window), 'unload')   // Navigating away counts as an action.
    );
    $rootScope.$emitEventsFromObservable('user-interacted', intentionalUserActions);

    function onEventStart(label) {
      return function() {
        Analytics.start(label);
      };
    }

    // Tell the Analytics service to start a specifically-named measurement
    // whenever these user actions are taken.
    $rootScope.$on('timeline-chart:filter-changed', onEventStart('timeline-filter'));
    $rootScope.$on('timeline-chart:filter-cleared', onEventStart('clear-filter'));
    $rootScope.$on('dataset-filter:choropleth', onEventStart('region-filter'));
    $rootScope.$on('dataset-filter-clear:choropleth', onEventStart('clear-filter'));
    $rootScope.$on('column-chart:datum-clicked', function(event, data) {
      var label = data.special ? 'clear-filter' : 'bar-filter';
      var eventFn = onEventStart(label);
      eventFn();
    });
    var buildHttpRequestFn = function(method) {
      return function(event, request) {
        if (_.isDefined(request.requesterLabel)) {
          Analytics[method](request.requesterLabel, request.startTime);
        }
      };
    };
    $rootScope.$on('http:start', buildHttpRequestFn('startHttpRequest'));
    $rootScope.$on('http:stop', buildHttpRequestFn('stopHttpRequest'));
    $rootScope.$on('http:error', buildHttpRequestFn('stopHttpRequest'));
  });

  dataCards.config(function($provide, $stateProvider) {
    $stateProvider.
      state('404', {
        templateUrl: '/404'
      }).
      state('test', {
        templateUrl: '/angular_templates/dataCards/pages/test-page.html',
        controller: 'TestPageController'
      }).
      state('view', {
        template: '<!--Overall chrome--><div ui-view="mainContent"><div>'
      }).
      state('view.cards', {
        params: ['id'],
        resolve: {
          page: function(Page, Dataset) {
            return new Page(pageMetadata, new Dataset(datasetMetadata));
          }
        },
        views: {
          'mainContent': {
            //TODO figure out a way of getting the template dir out of rails.
            templateUrl: '/angular_templates/dataCards/pages/cards-view.html',
            controller: 'CardsViewController'
          }
        },
        analyticsEnabled: true
      }).
      state('view.card', {
        params: ['pageId', 'fieldName'],
        resolve: {
          page: function(Page, Dataset) {
            return new Page(pageMetadata, new Dataset(datasetMetadata));
          },
          fieldName: function($stateParams) { return $stateParams.fieldName; }
        },
        views: {
          'mainContent': {
            //TODO figure out a way of getting the template dir out of rails.
            templateUrl: '/angular_templates/dataCards/pages/single-card-view.html',
            controller: 'SingleCardViewController'
          }
        }
      }).
      state('view.visualizationAdd', {
        resolve: {
          dataset: function(Dataset) {
            return new Dataset(datasetMetadata);
          }
        },
        views: {
          'mainContent': {
            templateUrl: '/angular_templates/dataCards/pages/visualization-add.html',
            controller: 'VisualizationAddController'
          }
        }
      });
  });

  dataCards.run(function($location, $log, $rootScope, $state, Analytics, Routes, ServerConfig, DeveloperOverrides) {
    // Shamelessly lifted from http://www.joezimjs.com/javascript/3-ways-to-parse-a-query-string-in-a-url/
    var parseQueryString = function( queryString ) {
      var params = {}, queries, temp, i, l;

      // Split into key/value pairs
      queries = queryString.split('&');

      // Convert the array of strings into an object
      for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
      }

      return params;
    };

    var queryObject = parseQueryString(decodeURIComponent(window.location.search.substr(1)));
    DeveloperOverrides.setOverridesFromString(queryObject.override_dataset_data);

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
      $log.error('Error encountered during state transition:', error);
    });

    // In order for us to apply page-specific styles to elements outside
    // of the page controller's scope (like page background, global font, etc),
    // we apply state-specific classes to the body.
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {
      function classNameFromStateName(stateName) {
        var dashified = stateName.replace(/\./g, '-');
        return 'state-' + dashified;
      }

      var oldClass = classNameFromStateName(fromState.name);
      var newClass = classNameFromStateName(toState.name);
      $('body').removeClass(oldClass);
      $('body').addClass(newClass);
    });

    // Determine the initial view from the URL.
    // We can't use the UI router's built in URL parsing because
    // our UX considerations require our URL to not depend on a document
    // fragment. We'd be able to use html5 mode on the router to satisfy this,
    // but we need to support IE9.
    var initialRoute = Routes.getUIStateAndConfigFromUrl(location.pathname);
    var initialAppUIState = $state.get(initialRoute.stateName);

    // Enable analytics upload iff we're configured to AND the app UI state calls for it.
    var isStatsdEnabled = ServerConfig.get('statsdEnabled') || false;
    Analytics.setServerUploadEnabled(isStatsdEnabled && initialAppUIState.analyticsEnabled || false);

    $state.go(initialAppUIState, initialRoute.parameters);
  });
})();
