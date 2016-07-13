var templateUrl = require('angular_templates/dataCards/suggestionToolPanel.html');

module.exports = function SuggestionToolPanel(SuggestionService, ServerConfig, Constants, I18n, rx) {
  const Rx = rx;
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
    templateUrl: templateUrl,
    link: function($scope) {

      var SUGGESTION_LIMIT = Constants.MAX_NUMBER_OF_SUGGESTIONS;

      var searchValue$ = $scope.$observe('searchValue');
      var dataset$ = $scope.$observe('dataset').filter(_.isPresent);
      var fieldName$ = $scope.$observe('fieldName').filter(_.isPresent);
      var showSamples$ = $scope.$observe('sampleOne').map(_.isPresent);

      var suggestionsRequests$ = Rx.Observable.combineLatest(
        dataset$.observeOnLatest('columns'),
        searchValue$.filter(_.isPresent),
        dataset$.pluck('id'),
        fieldName$,
        function(columns, searchValue, datasetId, fieldName) {
          return {
            physicalDatatype: columns[fieldName].physicalDatatype,
            searchOptions: [datasetId, fieldName, searchValue, SUGGESTION_LIMIT]
          };
        }
      ).
      debounce(300, Rx.Scheduler.timeout). // Don't hammer the suggestions service.
      map(function(suggestionRequest) {
        if (_.includes(Constants.SUGGESTION_DISABLED_DATA_TYPES, suggestionRequest.physicalDatatype)) {
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
        searchValue$.
          filter(function(value) { return !_.isPresent(value); }).
          map(_.constant(Rx.Observable.returnValue([])))
      ).share();

      var suggestionsError$ = suggestionsRequests$.
        switchLatest().
        map(_.isNull).
        startWith(false);

      var numberOfSuggestions$ = suggestionsRequests$.
        switchLatest().
        map(function(suggestions) {
          return suggestions ? suggestions.length : 0;
        }).
        startWith(0);

      var suggestionsStatus$ = numberOfSuggestions$.
        map(function(numberOfSuggestions) {
          if (numberOfSuggestions === 0) {
            return I18n.suggestionToolPanel.noSuggestions;
          }
          if (numberOfSuggestions <= SUGGESTION_LIMIT && numberOfSuggestions > 0) {
            if (numberOfSuggestions === 1) {
              return I18n.suggestionToolPanel.onlySuggestion;
            } else {
              return I18n.t('suggestionToolPanel.allSuggestions', numberOfSuggestions);
            }
          }
          if (numberOfSuggestions > SUGGESTION_LIMIT) {
            return I18n.t('suggestionToolPanel.maxSuggestions', SUGGESTION_LIMIT);
          }
        });

      $scope.$on('intractableList:selectedItem', function(event, selectedItem) {
        if ($scope.shouldShow && selectedItem) {
          $scope.$emit('suggestionToolPanel:selectedItem', selectedItem);
        }
      });

      var suggestions$ = suggestionsRequests$.switchLatest().
        map(function(suggestions) {
          return (suggestions || []).slice(0, SUGGESTION_LIMIT);
        });

      var suggestionsLoading$ = searchValue$.
        filter(_.isPresent).
        map(_.constant(true)).
        merge(suggestionsRequests$.switchLatest().map(_.constant(false)));

      var suggestionsAdvice$ = Rx.Observable.combineLatest(
        numberOfSuggestions$,
        suggestionsLoading$,
        suggestionsError$,
        function(numberOfSuggestions, suggestionsLoading, error) {
          if (suggestionsLoading) {
            return I18n.suggestionToolPanel.loadingSuggestionsHint;
          } else if (error) {
            return I18n.searchCard.promptText;
          } else if (numberOfSuggestions === 0) {
            return I18n.suggestionToolPanel.noSuggestionsHint;
          } else {
            return I18n.suggestionToolPanel.someSuggestionsHint;
          }
        });

      $scope.$bindObservable('showSamples', showSamples$);
      $scope.$bindObservable('suggestions', suggestions$);
      $scope.$bindObservable('suggestionsStatus', suggestionsStatus$);
      $scope.$bindObservable('suggestionsLoading', suggestionsLoading$);
      $scope.$bindObservable('suggestionsAdvice', suggestionsAdvice$);
      $scope.$bindObservable('error', suggestionsError$);
      $scope.maxSuggestionLength = Constants.MAX_SUGGESTION_LENGTH;
    }
  };
};