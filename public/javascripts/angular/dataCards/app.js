var dataCards = angular.module('dataCards', [
  'ui.router',
  'socrataCommon.directives',
  'dataCards.controllers',
  'dataCards.directives',
  'dataCards.models'
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
    });
});

dataCards.run(function($rootScope, $state, $location) {
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    console.error("Error encountered during state transition:", error);
  });

  var id = $location.absUrl().match(/\w{4}-\w{4}$/);
  if (_.isEmpty(id)) {
    $state.go('404');
  } else {
    $state.go('view.cards', {
      id: id[0]
    });
  }
});
