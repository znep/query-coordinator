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

    // Right now we only support embedding a subset of visualization types.
    $scope.supportedCardTypes = ['column', 'feature', 'timeline'];
    $scope.supportedVIFTypes = ['columnChart', 'featureMap', 'timelineChart'];

    var cardTypesToVIFTypes = {};
    $scope.supportedCardTypes.forEach(function(cardType, index) {
      cardTypesToVIFTypes[cardType] = $scope.supportedVIFTypes[index];
    });

    function generateVIF(selectedCard) {
      var metadata = dataset.serialize();
      var column = metadata.columns[selectedCard.fieldName];
      var type = _.first(_.intersection($scope.supportedCardTypes, column.availableCardTypes));

      return {
        'aggregation': {
          'field': null,
          'function': 'count'
        },
        'columnName': selectedCard.fieldName,
        'configuration': {
          'localization': {
            'UNIT_ONE': 'record',
            'UNIT_OTHER': 'records'
          }
        },
        'createdAt': (new Date()).toISOString(),
        'datasetUid': dataset.id,
        'description': column.description,
        'domain': metadata.domain,
        'filters': [],
        'format': {
          'type': 'visualization_interchange_format',
          'version': 1
        },
        'origin': {
          'type': 'data_lens_add_visualization_component',
          'url': 'https://{0}/view/{1}'.format(metadata.domain, dataset.id)
        },
        'title': column.name,
        'type': cardTypesToVIFTypes[type]
      };
    }

    /*************************
    * Trigger events for parent page *
    *************************/
    $scope.$on('card-model-selected', function(event, selectedCard) {
      var eventPayload = selectedCard ? generateVIF(selectedCard) : null;

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
