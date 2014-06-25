var dataCards = angular.module('dataCards', [
  'ui.router',
  'socrataCommon.directives',
  'dataCards.controllers',
  'dataCards.directives',
  'dataCards.models',
  'leaflet-directive'
  // 'pasvaz.bindonce' NOTE: use in the future to optimize Angular performance.
]);

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
    })
    .state('view.demoMap', {
      views: {
        'mainContent': {
          templateUrl: '/angular_templates/dataCards/pages/demo-map-view.html',
          controller: 'MapController'
        }
      }
    });
});

dataCards.run(function($rootScope, $state, $location, DeveloperOverrides) {
  DeveloperOverrides.init();
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    console.error("Error encountered during state transition:", error);
  });

  // TODO: This test is just to support short-term dev and demo tasks.
  // Remove it ASAP and keep just the else clause.
  // This is intentionally non-DRY to make that easy.
  if (/\/demo_map$/.test($location.absUrl())) {
    var id = $location.absUrl().match(/(\w{4}-\w{4})\/demo_map/);
    $state.go('view.demoMap', {
      id: id[1]
    });
  } else {
    // NOTE: This is the real url routing code (not for the demo).
    var id = location.pathname.match(/\w{4}-\w{4}$/);
    if (_.isEmpty(id)) {
      $state.go('404');
    } else {
      $state.go('view.cards', {
        id: id[0]
      });
    }
  }

  $rootScope.timers = [];

  $rootScope.addTimer = function(name, filesize){

    var duration = $rootScope.timers.length > 0 ? new Date().getTime() - $rootScope.timers.slice(-1)[0].timestamp : 0;

    $rootScope.timers.push({
      name: name,
      filesize: (filesize || ''),
      timestamp: new Date().getTime(),
      duration: duration
    });

    $rootScope.sumTimers = ($rootScope.sumTimers || 0) + duration;
  };

  $rootScope.addTimer('Run Angular app and set up first timer');
});
