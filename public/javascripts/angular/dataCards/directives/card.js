(function() {

  function CardDirective(AngularRxExtensions, ServerConfig, CardTypeMapping, DownloadService, $timeout) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '=',
        'editMode': '=',
        'interactive': '=',
        'isChoosingForExport': '=',
        'isGrabbed': '='
      },
      templateUrl: '/angular_templates/dataCards/card.html',
      link: function($scope, element) {

        AngularRxExtensions.install($scope);

        var modelSubject = $scope.observe('model').filter(_.identity);
        var datasetObservable = modelSubject.pluck('page').observeOnLatest('dataset');
        var columns = datasetObservable.observeOnLatest('columns');
        var versionSequence = modelSubject.observeOnLatest('column.dataset.version');

        $scope.descriptionCollapsed = true;
        $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));

        $scope.bindObservable('isCustomizable', modelSubject.observeOnLatest('isCustomizable'));
        $scope.bindObservable('isExportable', modelSubject.observeOnLatest('isExportable'));

        $scope.bindObservable(
          'title',
          versionSequence.
            flatMapLatest(function(version) {
              return modelSubject.observeOnLatest(version === '0' ? 'column.title' : 'column.name');
            })
        );
        $scope.bindObservable('description', modelSubject.observeOnLatest('column.description'));

        var rowDisplayUnitSequence = datasetObservable.
          observeOnLatest('rowDisplayUnit').
          map(function(value) { return _.isEmpty(value) ? 'rows' : value; });

        var primaryAggregationSequence = modelSubject.
          observeOnLatest('page.primaryAggregation').
          map(function(value) { return _.isNull(value) ? 'count' : value });

        var primaryAmountFieldSequence = modelSubject.
          observeOnLatest('page.primaryAmountField').
          combineLatest(columns, function(fieldName, columns) {
            return columns[fieldName];
          }).
          filter(_.isObject).
          combineLatest(versionSequence, function(column, version) {
            return version === '0' ? column['title'] : column['name'];
          }).
          filter(_.isPresent);

        var countTitleSequence = Rx.Observable.combineLatest(
          rowDisplayUnitSequence,
          primaryAggregationSequence.filter(function(value) { return value === 'count' }),
          function(rowDisplayUnit) {
            return 'Number of {0} by'.format(rowDisplayUnit.pluralize());
          });

        var sumTitleSequence = Rx.Observable.combineLatest(
          primaryAmountFieldSequence.filter(_.isPresent),
          primaryAggregationSequence.filter(function(value) { return value === 'sum' }),
          function(primaryAmountField) {
            return 'Sum of {0} by'.format(primaryAmountField.pluralize());
          });

        var meanTitleSequence = Rx.Observable.combineLatest(
          primaryAmountFieldSequence.filter(_.isPresent),
          primaryAggregationSequence.filter(function(value) { return value === 'mean' }),
          function(primaryAmountField) {
            return 'Average {0} by'.format(primaryAmountField);
          });

        var dynamicTitleSequence = Rx.Observable.merge(
          countTitleSequence,
          sumTitleSequence,
          meanTitleSequence
        );

        $scope.bindObservable('displayDynamicTitle', modelSubject.
          observeOnLatest('cardType').
          map(function(cardType) {
            return cardType !== 'table'
          }));

        $scope.bindObservable('dynamicTitle', dynamicTitleSequence);

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

        }, 250, {leading: true, trailing: true});

        $scope.toggleExpanded = function() {
          $scope.model.page.toggleExpanded($scope.model);
        };

        $scope.customizeCard = function(modelIsCustomizable) {
          if (modelIsCustomizable) {
            $scope.$emit('customize-card-with-model', $scope.model);
          }
        };

        $scope.deleteCard = function() {
          $scope.$emit('delete-card-with-model', $scope.model);
        };

        $scope.downloadUrl = './' + $scope.model.page.id + '/' + $scope.model.fieldName + '.png';

        $scope.downloadStateText = function(state) {
          switch(state) {
            case 'success':
              return 'Downloading';
            case 'error':
              return 'Error';
            default:
              return 'Download';
          }
        };

        $scope.downloadPng = function(e) {

          function resetDownloadButton() {
            $timeout(
              function() {
                delete $scope.downloadState;
              },
              2000
            );
          }

          if (e && e.metaKey) {
            return;
          }

          if (e) {
            e.preventDefault();
          }

          if ($scope.downloadState) {
            return;
          }

          $scope.downloadState = 'loading';

          $(e.target).blur();

          DownloadService.download($scope.downloadUrl).then(
            function success() {

              $scope.$apply(function() {
                $scope.downloadState = 'success';
                resetDownloadButton();
              });

            }, function error() {

              $scope.$apply(function() {
                $scope.downloadState = 'error';
                resetDownloadButton();
              });

            }
          );

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
          modelSubject.observeOnLatest('column.description'),
          function(dimensions, descriptionText) {
            // Manually update the binding now, because Angular doesn't know that dotdotdot messes with
            // the text.
            descriptionTruncatedContent.text(descriptionText);

            var availableSpace = dimensions.height - descriptionTruncatedContent.offsetParent().position().top;

            descriptionElementsWithMaxSize.css('max-height', availableSpace);

            updateCardLayout(parseInt(descriptionTruncatedContent.css('line-height'), 10) * 2);

          });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('card', CardDirective);

})();
