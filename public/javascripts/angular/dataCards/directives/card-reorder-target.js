// Directive in charge of orchestrating card reorder.
// TODO dev note to Chris: Totally a placeholder thing. This is probably not what we want.
// I added this because CardsViewController (rightfully) doesn't have access to the DOM nodes. We should
// consider moving all of the card render/layout functionality into here (and rename the directive).
// This would allow us to get rid of the global ID selectors in CardsViewController as well.
// We'll chat tomorrow.
angular.module('dataCards.directives').directive('cardReorderTarget', function() {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      var draggedModel = null; //TODO probably remove.

      var dragTarget = element; //TODO what we want?

      function findDropTarget(clientX, clientY) {
        // TODO this is a proof of concept mess only.
        var allCards = element.find('card');
        var closestCard = _.reduce(allCards, function(acc, cardElement) {
          var cardModel = $(cardElement).scope().cardModel;

          var bounds = cardElement.getBoundingClientRect();
          var d = Math.sqrt(Math.pow(clientX - bounds.left, 2) + Math.pow(clientY - bounds.top, 2));
          if (d < acc.distance) return { distance: d, cardModel: cardModel };
          else return acc;
        }, {distance: Infinity});

        if (closestCard.distance < Infinity) {
          return closestCard.cardModel;
        } else {
          return null;
        }

      };


      dragTarget.on('dragover', function(e) {
        // NOTE dragover doesn't have the rights to read data from dataTransfer.
        if (draggedModel) {
          var targetModel = findDropTarget(e.originalEvent.clientX, e.originalEvent.clientY);
          if (targetModel !== draggedModel) {
            // Copy these refs to prevent the drop handler from causing a race condition.
            var reorderFrom = draggedModel;
            var reorderTo = targetModel;
            $scope.safeApply(function() {
              $scope.$emit('cardReorderAction', { //TODO probably not want event, placeholder
                draggedCard: reorderFrom,
                droppedOn: reorderTo
              });
            });
          }
        }
      });
      dragTarget.on('drop', function(e) {
        e.preventDefault();
        console.log(e.originalEvent.dataTransfer.getData('text/html'));
      });

      $scope.$on('card: dragStart', function(event, cardModel) {
        if (draggedModel !== null) {
          console.warn('dragStart scope event emitted, but already dragging?');
        }
        draggedModel = cardModel;
      });

      $scope.$on('card: dragEnd', function(event, cardModel) {
        if (cardModel !== draggedModel) {
          console.warn('dragEnd scope event from an unknown card');
        }
        draggedModel = null;
      });
    }
  }
});
