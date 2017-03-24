/**
 * An attribute you can add to a tag, to create a spacer to reserve space for an element
 * that would otherwise be outside the flow of the document (eg position:fixed/absolute).
 */
module.exports =  function() {
  return {
    restrict: 'A',
    link: function($scope, element) {
      var spacer = $('<div class="spacer">&nbsp;</div>').css($.extend({
        position: 'relative'
      }, element.css(['width', 'height', 'box-sizing', 'padding', 'margin', 'border-width', 'line-height'])));
      element.after(spacer);
      var subscription = element.observeDimensions().subscribe(function() {
        spacer.css(element.css(['width', 'height']));
      });

      $scope.$destroyAsObservable(element).subscribe(function() {
        subscription.dispose();
        spacer.remove();
      });
    }
  };
};