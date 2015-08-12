(function() {
  'use strict';

  function VisualizationAddController($scope, $rootScope, $log, dataset, WindowState, Page) {

    /*************************
    * General metadata stuff *
    *************************/

    // Cards always expect to have a page, too painful to remove for now
    var pageBlob = {
      'cards': [],
      'datasetId': dataset.id
    };

    $scope.page = new Page(pageBlob, dataset);
    $scope.dataset = dataset;


    /*************************
    * Trigger events for parent page *
    *************************/
    $scope.$on('card-model-selected', function(event, selectedCard) {
      var eventPayload = selectedCard ? selectedCard.serialize() : null;

      // Trigger function attached to the iframe element in the parent
      if (_.isNull(window.frameElement)) {

        throw 'Page expects to be in an iframe, passing information to the parent window.';
      } else if (_.isFunction(window.frameElement.onVisualizationSelected)) {

        window.frameElement.onVisualizationSelected(eventPayload);
      } else {

        throw 'Cannot find onVisualizationSelected on the iframe.';
      }

    });
  }

  angular.
    module('dataCards.controllers').
      controller('VisualizationAddController', VisualizationAddController);

})();
