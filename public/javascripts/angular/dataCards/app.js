var dataCards = angular.module('dataCards', [
  'ui.router',
  'socrataCommon.directives',
  'dataCards.controllers',
  'dataCards.directives',
  'dataCards.models'
]);

dataCards.config(function($provide, $stateProvider, $urlRouterProvider, $locationProvider) {
  var appPrefix = '/view';
  var isUnderAppPrefix = function(pathString) {
    return pathString.indexOf(appPrefix) === 0;
  };

  $stateProvider
    .state('404', {
      template: '<h1>404</h1>You probably wanted something, but have this kitten instead: <br><soc-kitten w="800" h="600"></soc-kitten>'
    })
    .state('view', {
      url: appPrefix + '/{id:\\w{4}-\\w{4}}',
      template: '<!--Overall chrome--><div ui-view="mainContent"><div>',
      resolve: {
        page: function($stateParams, Page) {
          return new Page($stateParams['id']);
        }
      }
    })
    .state('view.cards', {
      views: {
        'mainContent': {
          //TODO figure out a way of getting the template dir out of rails.
          templateUrl: '/angular_templates/dataCards/pages/cards-view.html',
          controller: 'CardsViewController'
        }
      }
    });

    $urlRouterProvider.otherwise(function($injector, $location){
      if (isUnderAppPrefix($location.path())) {
        $injector.get('$state').go('404');
      } else {
        //let rails have it.
      }

    });

  $locationProvider.html5Mode(true);
});

dataCards.run(function($rootScope, $state) {
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    console.error("Error encountered during state transition:", error);
  });

  // Default state.
  $rootScope.$on('$stateChangeSuccess', function (e, toState) {
    if (toState.name === 'view') {
      $state.go('view.cards');
    }
  });
});
