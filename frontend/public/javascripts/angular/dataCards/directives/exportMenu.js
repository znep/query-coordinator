var templateUrl = require('angular_templates/dataCards/exportMenu.html');

module.exports = function ExportMenu(WindowState, ServerConfig, CardDataService, rx, I18n) {
  return {
    restrict: 'E',
    templateUrl: templateUrl,
    scope: true,
    link: function($scope, element) {
      var destroy$ = $scope.$destroyAsObservable(element);

      // Determine if polaroid button should be visible.
      $scope.showPolaroidButton = ServerConfig.get('enablePngDownloadUi');

      // Retrieve row count and filtered row count for radio button labels.  Create shared
      // observables to avoid instantiating multiple observable instances.
      var dataset$ = $scope.page.observe('dataset').shareReplay();
      var whereClause$ = $scope.page.observe('computedWhereClauseFragment').shareReplay();

      var rowCount$ = dataset$.
        pluck('id').
        map(_.bind(CardDataService.getRowCount, CardDataService)).
        switchLatest().
        map(socrata.utils.commaify);

      // Pass the dataset id and where clause to CardDataService.getRowCount
      var filteredRowCount$ = dataset$.
        pluck('id').
        combineLatest(
          whereClause$,
          _.bind(CardDataService.getRowCount, CardDataService, _, _)
        ).
        switchLatest().
        map(socrata.utils.commaify);

      var shouldDisableFilteredExport$ = rx.Observable.combineLatest(
        rowCount$,
        filteredRowCount$,
        dataset$.observeOnLatest('downloadOverride'),
        function(rowCount, filteredRowCount, downloadOverride) {
          return rowCount === filteredRowCount || _.isString(downloadOverride);
        }
      );

      var disabledFilteredExportMessage$ = dataset$.observeOnLatest('downloadOverride').
        startWith(undefined).
        map(function(downloadOverride) {
          if (_.isString(downloadOverride)) {
            return I18n.exportMenu.csv.notAvailableSpecific;
          } else {
            return I18n.exportMenu.csv.notAvailable;
          }
        });

      $scope.$bindObservable('rowCount', rowCount$);
      $scope.$bindObservable('filteredRowCount', filteredRowCount$);
      $scope.$bindObservable('shouldDisableFilteredExport', shouldDisableFilteredExport$);
      $scope.$bindObservable('disabledFilteredExportMessage', disabledFilteredExportMessage$);

      $scope.isFilteredCSVExport = true;

      // Set the URL of the CSV download button.
      var csvDownloadURL$ = rx.Observable.combineLatest(
        dataset$,
        whereClause$,
        $scope.$observe('isFilteredCSVExport'),
        function(dataset, whereClause, isFilteredCSVExport) {
          var downloadOverride = dataset.getCurrentValue('downloadOverride');
          if (downloadOverride) {
            return downloadOverride;
          }

          // Use the where clause of the page to construct the query parameter, but only if the
          // appropriate radio button is checked and the page actually has a where clause.
          var whereClauseFragment = '';
          if (!_.isEmpty(whereClause) && isFilteredCSVExport === true) {
            whereClauseFragment = ` where ${whereClause}`;
          }

          var query = `select *${whereClauseFragment}`;

          // Construct the URL
          var url = $.baseUrl();
          url.pathname = `/api/views/${dataset.id}/rows.csv`;
          url.searchParams.set('accessType', 'DOWNLOAD');
          url.searchParams.set('bom', true);
          url.searchParams.set('query', query);
          if ($scope.page.isFromDerivedView) {
            // NOTE: for this endpoint, we don't need to use the `version` magic
            // flag, and we don't need to prefix magic flags with dollar signs.
            url.searchParams.set('read_from_nbe', true);
          }

          return url.href;
        });

      $scope.$bindObservable('csvDownloadURL', csvDownloadURL$);

      // If the "filtered" radio button is selected and we clear all filters, reset back to the
      // "unfiltered" radio button.
      whereClause$.
        filter(_.isEmpty).
        subscribe(function() {
          $scope.isFilteredCSVExport = false;
        });

      // Hide the flannel when pressing escape or clicking outside the
      // tool-panel-main element. Clicking on the button has its own
      // toggling behavior so it is excluded from this logic.
      WindowState.closeDialogEvent$.
        takeUntil(destroy$).
        filter(function(e) {
          if (!$scope.panelActive) { return false; }
          if (e.type === 'keydown') { return true; }

          var $target = $(e.target);
          var targetInsideFlannel = $target.closest('.tool-panel-main').length > 0;
          var targetIsButton = $target.is($(element).find('.tool-panel-toggle-btn'));
          return !targetInsideFlannel && !targetIsButton;
        }).
        subscribe(function() {
          $scope.$safeApply(function() {
            $scope.panelActive = false;
          });
        });

      // Enter card selection mode
      $scope.initiateCardSelectionMode = function() {
        $scope.panelActive = false;
        $scope.allowChooserModeCancel = true;
        $scope.$emit('enter-export-card-visualization-mode');
      };

      // Leave card selection mode on clicking cancel, on init, and on signal
      $scope.quitCardSelectionMode = function() {
        $scope.allowChooserModeCancel = false;
        $scope.$emit('exit-export-card-visualization-mode');
      };
      $scope.$on('exit-chooser-mode', function() {
        $scope.allowChooserModeCancel = false;
      });
      $scope.quitCardSelectionMode();

      // Leave card selection mode on escape key
      WindowState.escapeKey$.filter(function() {
        return $scope.allowChooserModeCancel === true;
      }).
        takeUntil(destroy$).
        subscribe(function() {
          $scope.$safeApply($scope.quitCardSelectionMode);
        });
    }
  };
};
