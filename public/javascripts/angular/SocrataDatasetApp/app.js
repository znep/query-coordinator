var socrataDatasetApp = angular.module('socrataDatasetApp', [
  'ui.router',
  'socrataCommon.directives',
  'socrataDatasetApp.controllers',
  'socrataDatasetApp.models'
]);

socrataDatasetApp.config(function($provide, $stateProvider, $urlRouterProvider, $locationProvider) {
  var appPrefix = '/view';
  var isUnderAppPrefix = function(pathString) {
    return pathString.indexOf(appPrefix) === 0;
  };

  $stateProvider
    .state('404', {
      template: '<h1>404</h1>You probably wanted something, but have this kitten instead: <br><soc-kitten w="800" h="600"></soc-kitten>'
    })
    .state('view', {
      isAbstract: true,
      url: appPrefix+'/{id:\\w{4}-\\w{4}}',
      resolve: {
        viewId: function($stateParams) {
          return $stateParams['id'];
        }
      },
      //TODO figure out a way of getting the template dir out of rails.
      templateUrl: '/angular_templates/socrataDatasetApp/pages/card-view.html',
      controller: 'CardViewController'
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

socrataDatasetApp.run(function() {
});
