(function() {
  'use strict';

  function SuggestionToolPanel(SuggestionService, ServerConfig, Constants) {
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
        var SUGGESTION_LIMIT = Constants.MAX_NUMBER_OF_SUGGESTIONS;

        var searchValueObservable = $scope.$observe('searchValue');
        var datasetObservable = $scope.$observe('dataset').filter(_.isPresent);
        var fieldNameObservable = $scope.$observe('fieldName').filter(_.isPresent);
        var sampleOneObservable = $scope.$observe('sampleOne');

        var suggestionsRequestsObservable = Rx.Observable.combineLatest(
          datasetObservable.observeOnLatest('columns'),
          searchValueObservable.filter(_.isPresent),
          datasetObservable.pluck('id'),
          fieldNameObservable,
          function(columns, searchValue, datasetId, fieldName) {
            return {
              physicalDatatype: columns[fieldName].physicalDatatype,
              searchOptions: [datasetId, fieldName, searchValue, SUGGESTION_LIMIT]
            };
          }
        ).
        debounce(300, Rx.Scheduler.timeout). // Don't hammer the suggestions service.
        map(function(suggestionRequest) {
          if (_.contains(Constants.SUGGESTION_DISABLED_DATA_TYPES, suggestionRequest.physicalDatatype)) {
            return Rx.Observable.returnValue([]);
          } else {
            return Rx.Observable.fromPromise(
              SuggestionService.suggest.apply(this, suggestionRequest.searchOptions)
            );
          }
        }).
        merge(
          // Clear out any suggestions if the user clears the input box.
          // This prevents old suggestions from coming up when the user then
          // types things back into the box.
          searchValueObservable.
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
              return 'Showing first {0} suggestions:'.format(SUGGESTION_LIMIT);
            }
          });

        var showSamplesObservable = Rx.Observable.combineLatest(
          numberOfSuggestionsObservable.
            map(function(numberOfSuggestions) { return numberOfSuggestions > 0; }),
          sampleOneObservable.map(_.isPresent),
          function(hasSuggestions, hasSample) {
            return hasSample && !hasSuggestions;
          });

        $scope.$bindObservable('showSamples', showSamplesObservable);

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
          filter(_.isPresent).
          map(_.constant(true)).
          merge(suggestionsRequestsObservable.switchLatest().map(_.constant(false)));

        $scope.$bindObservable('suggestions', suggestionsObservable);
        $scope.$bindObservable('suggestionsStatus', suggestionsStatusObservable);
        $scope.$bindObservable('suggestionsLoading', suggestionsLoadingObservable);
        $scope.$bindObservable('suggestionsAdvice', suggestionsAdviceObservable);
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('suggestionToolPanel', SuggestionToolPanel);

})();
