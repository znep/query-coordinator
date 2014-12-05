angular.module('dataCards.directives').directive('card', function(AngularRxExtensions, $timeout, $log) {

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=', 'interactive': '=' },
    templateUrl: '/angular_templates/dataCards/card.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var modelSubject = $scope.observe('model').filter(_.identity);
      var datasetObservable = modelSubject.pluck('page').observeOnLatest('dataset');
      var columns = datasetObservable.observeOnLatest('columns');

      var column = modelSubject.pluck('fieldName').combineLatest(columns, function(fieldName, columns) {
        return columns[fieldName];
      }).filter(_.isObject);

      $scope.descriptionCollapsed = true;

      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));

      $scope.bindObservable('title', column.pluck('title'));
      $scope.bindObservable('description', column.pluck('description'));

      var updateCardLayout = _.throttle(function(textHeight) {
        descriptionTruncatedContent.dotdotdot({
          height: textHeight,
          tolerance: 2
        });

        var isClamped = descriptionTruncatedContent.triggerHandler('isTruncated');

        $scope.safeApply(function() {
          $scope.descriptionClamped = isClamped;
          $scope.animationsOn = true;
        });

      }, 250, { leading: true, trailing: true });

      $scope.toggleExpanded = function() {
        $scope.model.page.toggleExpanded($scope.model);
      };

      var descriptionTruncatedContent = element.find('.description-truncated-content');
      var descriptionElementsWithMaxSize = element.find('.description-expanded-wrapper, .description-expanded-content');

      var dimensionsObservable = element.observeDimensions();

      // Give the visualization all the height that the description isn't using.
      // Note that we set the height on a wrapper instead of the card-visualization itself.
      // This is because the card-visualization DOM node itself can be ripped out and replaced
      // by angular at any time (typically when the card-visualization template finishes loading
      // asynchronously).
      // See: https://github.com/angular/angular.js/issues/8877
      var description = element.find('.card-text');
      Rx.Observable.subscribeLatest(
        description.observeDimensions(),
        dimensionsObservable,
        function(descriptionDimensions, elementDimensions) {
          element.find('.card-visualization-wrapper').height(
            elementDimensions.height - description.outerHeight(true)
          );
        });

      Rx.Observable.subscribeLatest(
        dimensionsObservable,
        column.pluck('description'),
        function(dimensions, descriptionText) {
          // Manually update the binding now, because Angular doesn't know that dotdotdot messes with
          // the text.
          descriptionTruncatedContent.text(descriptionText);

          var availableSpace = dimensions.height - descriptionTruncatedContent.offsetParent().position().top;

          descriptionElementsWithMaxSize.css('max-height', availableSpace);

          updateCardLayout(parseInt(descriptionTruncatedContent.css('line-height')) * 2);

        });

    }
  };

});
