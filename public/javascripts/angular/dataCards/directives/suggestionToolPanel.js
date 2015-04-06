(function() {
  'use strict';

  function SuggestionToolPanel(SuggestionService, AngularRxExtensions, ServerConfig) {
    if (!ServerConfig.get('enableSearchSuggestions')) {
      return {};
    }
    return {
      restrict: 'E',
      scope: {
        shouldShow: '=',
        searchValue: '=',
        selectedSuggestion: '=',
        dataset: '=',
        fieldName: '=',
        sampleOne: '=',
        sampleTwo: '='
      },
      templateUrl: '/angular_templates/dataCards/suggestionToolPanel.html',
      link: function($scope) {

        AngularRxExtensions.install($scope);

        var SUGGESTION_LIMIT = 10;

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
        debounce(300, Rx.Scheduler.timeout). // Don't hammer the suggestions service.
        map(function(searchOptions) {
          return Rx.Observable.fromPromise(
            SuggestionService.suggest.apply(this, searchOptions)
          );
        }).
        merge(
          // Clear out any suggestions if the user clears the input box.
          // This prevents old suggestions from coming up when the user then
          // types things back into the box.
          $scope.observe('searchValue').
            filter(function(value) { return !_.isPresent(value); }).
            map(_.constant(Rx.Observable.returnValue([])))
        ).share();

        var numberOfSuggestionsObservable = suggestionsRequestsObservable.
          switchLatest().
          map(function(suggestions) {
            return suggestions ? suggestions.length : 0;
          });

        var suggestionsStatusObservable = numberOfSuggestionsObservable.
          map(function(numberOfSuggestions) {
            if (numberOfSuggestions === 0) {
              return 'No data found matching your search term.';
            }
            if (numberOfSuggestions <= SUGGESTION_LIMIT && numberOfSuggestions > 0) {
              return 'Showing {0} {1}:'.format(
                numberOfSuggestions > 1 ? 'all {0}'.format(numberOfSuggestions) : 'the only',
                numberOfSuggestions > 1 ? 'suggestions' : 'suggestion'
              );
            }
            if (numberOfSuggestions > SUGGESTION_LIMIT) {
              return 'Showing top {0} of {1} suggestions:'.format(SUGGESTION_LIMIT, numberOfSuggestions);
            }
          });

        var showSamplesObservable = Rx.Observable.combineLatest(
          numberOfSuggestionsObservable.
            map(function(numberOfSuggestions) { return numberOfSuggestions > 0; }),
          $scope.observe('sampleOne').map(_.isPresent),
          function(hasSuggestions, hasSample) {
            return hasSample && !hasSuggestions;
          });

        $scope.bindObservable('showSamples', showSamplesObservable);

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

        var suggestionsObservable = suggestionsRequestsObservable.switchLatest().
          map(function(suggestions) {
            return (suggestions || []).slice(0, SUGGESTION_LIMIT)
          });
        var suggestionsLoadingObservable = searchValueObservable.
          map(_.constant(true)).
          merge(suggestionsRequestsObservable.switchLatest().map(_.constant(false)));

        $scope.bindObservable('suggestions', suggestionsObservable);
        $scope.bindObservable('suggestionsStatus', suggestionsStatusObservable);
        $scope.bindObservable('suggestionsLoading', suggestionsLoadingObservable);
        $scope.bindObservable('suggestionsAdvice', suggestionsAdviceObservable);
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('suggestionToolPanel', SuggestionToolPanel);

})();
