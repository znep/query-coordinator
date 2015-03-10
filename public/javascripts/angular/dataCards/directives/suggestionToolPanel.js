(function() {
  'use strict';

  function SuggestionToolPanel(SuggestionService, AngularRxExtensions) {
    return {
      restrict: 'E',
      scope: {
        shouldShow: '=',
        searchValue: '=',
        dataset: '=',
        fieldName: '=',
        sampleOne: '=',
        sampleTwo: '='
      },
      templateUrl: '/angular_templates/dataCards/suggestionToolPanel.html',
      link: function($scope, element, attrs) {

        AngularRxExtensions.install($scope);

        var suggestionLimit = 10;

        var searchValueObservable = $scope.observe('searchValue').filter(_.isPresent);
        var datasetIdObservable = $scope.observe('dataset').filter(_.isPresent).pluck('id');
        var fieldNameObservable = $scope.observe('fieldName').filter(_.isPresent);

        var suggestionsRequestsObservable = Rx.Observable.combineLatest(
          searchValueObservable,
          datasetIdObservable,
          fieldNameObservable,
          function(searchValue, datasetId, fieldName) {
            return [datasetId, fieldName, searchValue];
          }
        ).
        debounce(300). // Don't hammer the suggestions service.
        map(function(searchOptions) {
          return Rx.Observable.fromPromise(
            // SuggestionService.suggest.apply(this, searchOptions)
            // Line below is hack for testing purposes only. Do not merge!
            SuggestionService.suggest.apply(this, [searchOptions[0], 'crimeType', searchOptions[2]])
          );
        }).merge(
          // Clear out any suggestions if the user clears the input box.
          // This prevents old suggestions from coming up when the user then
          // types things back into the box.
          $scope.observe('searchValue').filter(function(value) { return !_.isPresent(value); }).map(_.constant(
              Rx.Observable.returnValue([])
          ))
        ).share();

        var numberOfSuggestionsObservable = suggestionsRequestsObservable.switchLatest().map(function(suggestions) {
          return suggestions ? suggestions.length : 0;
        });

        var suggestionsStatusObservable = numberOfSuggestionsObservable.map(function(numberOfSuggestions) {
          if (numberOfSuggestions === 0) {
            return 'No data found matching your search term.';
          }
          if (numberOfSuggestions <= suggestionLimit && numberOfSuggestions > 0) {
            return 'Showing {0} {1}:'.format(
              numberOfSuggestions > 1 ? 'all {0}'.format(numberOfSuggestions) : 'the only',
              numberOfSuggestions > 1 ? 'suggestions' : 'suggestion'
            );
          }
          if (numberOfSuggestions > suggestionLimit) {
            return 'Showing top {0} of {1} suggestions:'.format(suggestionLimit, numberOfSuggestions);
          }
        });

        $scope.$on('intractableList:selectedItem', function(event, selectedItem) {
          if ($scope.shouldShow) {
            $scope.$emit('suggestionToolPanel:selectedItem', selectedItem);
          }
        });

        var suggestionsAdviceObservable = numberOfSuggestionsObservable.map(function(numberOfSuggestions) {
          if (numberOfSuggestions === 0) {
            return 'Try broadening your search for more results.';
          } else {
            return 'Choose a suggestion above, or keep typing for more suggestions.';
          }
        });

        $scope.bindObservable('suggestions', suggestionsRequestsObservable.switchLatest().
          map(function(suggestions) { return (suggestions || []).slice(0, suggestionLimit) }));
        $scope.bindObservable('suggestionsStatus', suggestionsStatusObservable);
        $scope.bindObservable('suggestionsLoading',
          searchValueObservable.map(_.constant(true)).
          merge(suggestionsRequestsObservable.switchLatest().map(_.constant(false))));
        $scope.bindObservable('suggestionsAdvice', suggestionsAdviceObservable);
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('suggestionToolPanel', SuggestionToolPanel);

})();
